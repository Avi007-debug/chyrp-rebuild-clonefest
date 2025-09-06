from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_caching import Cache # type: ignore
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity, verify_jwt_in_request
import boto3
import psycopg2
from flask import make_response
from datetime import datetime
import psycopg2.extras
import os
from werkzeug.utils import secure_filename
import random
import string


# --- App Initialization & Config ---
app = Flask(__name__, static_folder='uploads', static_url_path='/uploads')
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
bcrypt = Bcrypt(app)
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-for-development"
jwt = JWTManager(app)

# --- Caching Configuration ---
app.config['CACHE_TYPE'] = 'SimpleCache'  # In-memory cache for development
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # Default cache timeout in seconds (5 minutes)
app.config['CACHE_THRESHOLD'] = 1000  # Maximum number of items the cache will store
app.config['CACHE_KEY_PREFIX'] = 'chyrp_'  # Prefix for all cache keys
cache = Cache(app)

def invalidate_post_caches(post_id=None):
    """Helper function to invalidate relevant caches when a post is modified"""
    cache.delete('all_posts')  # Always invalidate the main posts list
    cache.delete('popular_posts')  # Invalidate popular posts cache if we implement it
    if post_id:
        cache.delete(f'post_{post_id}')  # Invalidate specific post cache
        cache.delete(f'post_{post_id}_comments')  # Invalidate post's comments cache
        # NEW: Invalidate category cache if we have one
        # For now, just invalidating all posts is enough.

# --- AWS S3 Configuration (for Vercel deployment) ---
S3_BUCKET = os.getenv('S3_BUCKET_NAME')
S3_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
S3_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
S3_REGION = os.getenv('AWS_REGION', 'us-east-1')

s3_client = None
if S3_BUCKET and S3_ACCESS_KEY and S3_SECRET_KEY:
    s3_client = boto3.client('s3', aws_access_key_id=S3_ACCESS_KEY, aws_secret_access_key=S3_SECRET_KEY)



# --- File Upload Configuration ---
# Use an absolute path for the upload folder to avoid ambiguity
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'ogg'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Create upload directory if it doesn't exist

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Custom JWT Error Handlers ---
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({"message": "Missing or invalid Authorization Header"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": f"Invalid token: {error}"}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token has expired"}), 401

# --- Database Connection ---
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST, database=DB_NAME,
        user=DB_USER, password=DB_PASS
    )
    
    # Create tables if they don't exist
    with conn.cursor() as cur:
        # Create posts table with quote and link support
        cur.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type VARCHAR(20) NOT NULL,
                title TEXT,
                content TEXT,
                link_url TEXT,
                attribution TEXT,
                license TEXT,
                image_url TEXT,
                category_id INTEGER,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT posts_type_check CHECK (type IN ('text', 'photo', 'video', 'audio', 'quote', 'link'))
            )
        """)
        
        # Update existing table to add link_url if it doesn't exist
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'posts' AND column_name = 'link_url'
                ) THEN
                    ALTER TABLE posts ADD COLUMN link_url TEXT;
                END IF;
            END $$;
        """)
        
        conn.commit()
    
    return conn

# --- Helper: Manage Tags ---
def manage_tags(cur, post_id, tags_string):
    if tags_string:
        tag_names = [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]
        tag_ids = []
        for name in tag_names:
            cur.execute("SELECT id FROM tags WHERE name = %s", (name,))
            tag = cur.fetchone()
            if tag:
                tag_ids.append(tag[0])
            else:
                cur.execute("INSERT INTO tags (name) VALUES (%s) RETURNING id", (name,))
                tag_ids.append(cur.fetchone()[0])
        for tag_id in tag_ids:
            cur.execute(
                "INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (post_id, tag_id)
            )

# =========================
# === User Auth Routes ===
# =========================

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all(key in data for key in ['username', 'email', 'password']):
        return jsonify({"message": "Missing required fields"}), 400

    username, email, password = data['username'], data['email'], data['password']
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            return jsonify({"message": "Username or email already exists"}), 409
        cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                      (username, email, password_hash))
        conn.commit()
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not all(key in data for key in ['username', 'password']):
        return jsonify({"message": "Missing username or password"}), 400

    username, password = data['username'], data['password']
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        if user and bcrypt.check_password_hash(user['password_hash'], password):
            access_token = create_access_token(identity=str(user['id']))
            return jsonify(access_token=access_token)
        return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

# =========================
# === Posts Routes ========
# =========================

@app.route('/posts', methods=['GET'])
def get_posts():
    """
    Fetches posts with pagination and optional tag searching.
    """
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception: # nosec
        user_id = None
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # --- Pagination and Search Query Params ---
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int) # Number of posts per page
        tag_query = request.args.get('tag', None, type=str)
        offset = (page - 1) * per_page

        # --- Build Query Conditions ---
        where_clauses = []
        query_params = []

        if tag_query:
            # This subquery finds all post_ids that have a matching tag
            where_clauses.append("p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.name ILIKE %s)")
            query_params.append(f"%{tag_query}%")

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        # --- Total Count Query ---
        count_query = f"SELECT COUNT(DISTINCT p.id) FROM posts p {where_sql}"
        cur.execute(count_query, tuple(query_params))
        total_posts = cur.fetchone()[0]
        has_more = (offset + per_page) < total_posts

        # --- Main Posts Query ---
        final_params = [user_id] + query_params + [per_page, offset]

        sql_query = f"""
            SELECT 
                p.*, 
                u.username,
                cat.name as category_name, cat.slug as category_slug,
                COALESCE(lc.like_count, 0) AS like_count,
                EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = %s) AS liked_by_user,
                ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
                ARRAY_AGG(DISTINCT pm.media_url) FILTER (WHERE pm.media_url IS NOT NULL) as media_urls
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM post_likes
                GROUP BY post_id
            ) lc ON p.id = lc.post_id
            LEFT JOIN post_tags pt ON p.id = pt.post_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            LEFT JOIN post_media pm ON p.id = pm.post_id
            LEFT JOIN categories cat ON p.category_id = cat.id
            {where_sql}
            GROUP BY p.id, u.username, lc.like_count, cat.name, cat.slug
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s;
        """
        
        cur.execute(sql_query, tuple(final_params))
        posts = [dict(post) for post in cur.fetchall()]
        cur.close()
        
        return jsonify({
            "posts": posts,
            "has_more": has_more,
            "page": page,
            "total_posts": total_posts
        })
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR fetching posts: {error}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

# --- Single Post Detail Endpoint (with View Count Logic) ---
@app.route('/posts/<int:post_id>', methods=['GET'])
@cache.memoize(timeout=300)  # Use memoize instead of cached to include parameters in cache key
def get_post(post_id):
    """Fetches a single post by its ID and increments the view count."""
    print(f"Fetching post with ID: {post_id}")  # Debug log
    user_id = None
    try:
        # Check for a token, but don't require one
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        # Convert to int if not None for consistency
        user_id = int(user_id) if user_id else None
    except Exception as e:
        print(f"Token verification exception (non-critical): {e}")
        user_id = None

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        print(f"Executing query for post {post_id} with user_id {user_id}")  # Debug log
        # Get the post and its author with like count in a single query
        query = """
            SELECT 
                p.*, 
                u.username,
                cat.name as category_name, cat.slug as category_slug,
                COALESCE(lc.like_count, 0) AS like_count,
                CASE WHEN %s IS NOT NULL THEN 
                    EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = %s) 
                ELSE false END AS liked_by_user
            FROM posts p 
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM post_likes
                GROUP BY post_id
            ) lc ON p.id = lc.post_id
            LEFT JOIN categories cat ON p.category_id = cat.id
            WHERE p.id = %s
        """
        
        cur.execute(query, (user_id, user_id, post_id))
        post = cur.fetchone()

        if not post:
            print(f"Post {post_id} not found")  # Debug log
            return jsonify({"message": "Post not found"}), 404

        # --- View Count Logic ---
        increment_view = False
        if user_id and post['user_id'] != user_id:
            cur.execute("SELECT 1 FROM post_views WHERE post_id = %s AND user_id = %s", (post_id, user_id))
            existing_view = cur.fetchone()
            if not existing_view:
                increment_view = True

        if increment_view:
            cur.execute("UPDATE posts SET view_count = view_count + 1 WHERE id = %s", (post_id,))
            cur.execute("INSERT INTO post_views (post_id, user_id) VALUES (%s, %s)", (post_id, user_id))
            conn.commit()
            # Update the post data to reflect the new view count
            post = dict(post)  # Convert to dict for modification
            post['view_count'] += 1

        # Get all tags for the post
        cur.execute("""
            SELECT t.name FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = %s
        """, (post_id,))
        tags = [row['name'] for row in cur.fetchall()]

        # Get all media URLs for the post
        cur.execute("SELECT media_url FROM post_media WHERE post_id = %s ORDER BY id ASC", (post_id,))
        media_urls = [row['media_url'] for row in cur.fetchall()]

        # Prepare the final response
        post_data = dict(post)
        post_data['tags'] = tags
        post_data['media_urls'] = media_urls

        return jsonify(post_data)

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"ERROR in get_post: {error}")
        print(f"Error details: {type(error).__name__}: {str(error)}")  # Detailed error logging
        import traceback
        print("Traceback:", traceback.format_exc())  # Print full traceback
        return jsonify({"message": "Database error", "error": str(error)}), 500
    finally:
        if conn:
            try:
                conn.close()
            except Exception as e:
                print(f"Error closing connection: {e}")  # Log connection closing errors
@app.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    invalidate_post_caches()  # Invalidate relevant caches
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    post_type = data.get('type', 'text')
    title = data.get('title')
    content = data.get('content')
    media_urls = data.get('media_urls', []) # Get the list of media URLs
    tags_string = data.get('tags', '') # Get tags as a comma-separated string
    category_id = data.get('category_id') # Get category ID
    link_url = data.get('link_url')  # Get link URL for link type posts
    
    # Validation
    if post_type != 'quote' and not title:
        return jsonify({"message": "Title is required for this post type"}), 400
    if post_type == 'link' and not link_url:
        return jsonify({"message": "Link URL is required for link type posts"}), 400
    if post_type == 'quote' and not content:
        return jsonify({"message": "Content is required for quote type posts"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        attribution = data.get('attribution')
        license = data.get('license')

        # Use the first media URL as the primary 'image_url' for thumbnails/previews
        primary_media_url = media_urls[0] if media_urls else None

        cur.execute(
            "INSERT INTO posts (user_id, type, title, content, attribution, license, image_url, category_id, link_url) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (user_id, post_type, title, content, attribution, license, primary_media_url, category_id, link_url)
        )
        post_id = cur.fetchone()[0]
        
        # Use the helper to manage tags
        manage_tags(cur, post_id, tags_string)

        # NEW: Insert all media URLs into post_media table
        if media_urls:
            media_records = [(post_id, url) for url in media_urls]
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO post_media (post_id, media_url) VALUES %s",
                media_records
            )

        conn.commit()
        cur.close()
        return jsonify({"message": "Post created successfully", "post_id": post_id}), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR creating post: {error}")
        return jsonify({"message": "Database error"}), 500

    finally:
        if conn:
            conn.close()


@app.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    invalidate_post_caches(post_id)  # Invalidate relevant caches
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Extract fields from request
    title = data.get('title')
    content = data.get('content')
    post_type = data.get('type') # Type should be sent on update
    tags_string = data.get('tags', '')
    category_id = data.get('category_id')
    attribution = data.get('attribution')
    license = data.get('license')
    link_url = data.get('link_url')

    # Validation
    if post_type != 'quote' and not title:
        return jsonify({"message": "Title is required for this post type"}), 400
    if post_type == 'link' and not link_url:
        return jsonify({"message": "Link URL is required for link posts"}), 400
    if post_type == 'quote' and not content:
        return jsonify({"message": "Content is required for quotes"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Verify ownership of post
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id:
            return jsonify({"message": "Forbidden"}), 403

        # Update post fields
        cur.execute(
            """
            UPDATE posts
            SET title = %s,
                content = %s,
                attribution = %s,
                license = %s,
                category_id = %s,
                link_url = %s,
                type = %s
            WHERE id = %s
            """,
            (title, content, attribution, license, category_id, link_url, post_type, post_id)
        )

        # Update tags (clear + add new ones)
        cur.execute("DELETE FROM post_tags WHERE post_id = %s", (post_id,))
        manage_tags(cur, post_id, tags_string)

        conn.commit()
        cur.close()
        return jsonify({"message": "Post updated successfully"}), 200

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR updating post: {error}")
        return jsonify({"message": "Database error"}), 500

    finally:
        if conn:
            conn.close()

@app.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    invalidate_post_caches(post_id)
    current_user_id = int(get_jwt_identity())
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id:
            return jsonify({"message": "Forbidden"}), 403
        
        # Deletion logic
        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        return jsonify({"message": "Post deleted successfully"})
    except Exception as e:
        print(f"DB Error on delete: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn:
            conn.close()

# --- Tag Filter Endpoint ---
@app.route('/posts/tag/<tag_name>', methods=['GET'])
@cache.cached(timeout=300, key_prefix='tag_posts_')  # Cache tagged posts for 5 minutes
def get_posts_by_tag(tag_name):
    """Fetches all posts associated with a specific tag."""
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        user_id = None

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        sql_query = """
            SELECT 
                p.*, u.username,
                COALESCE(lc.like_count, 0) AS like_count,
                EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = %s) AS liked_by_user,
                ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM post_likes GROUP BY post_id) lc 
                ON p.id = lc.post_id
            JOIN post_tags pt ON p.id = pt.post_id
            JOIN tags t ON pt.tag_id = t.id
            WHERE t.name = %s
            GROUP BY p.id, u.username, lc.like_count
            ORDER BY p.created_at DESC;
        """
        cur.execute(sql_query, (user_id, tag_name))
        posts = [dict(post) for post in cur.fetchall()]
        return jsonify(posts)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

# ================================
# === Likes & Comments Routes ===
# ================================

@app.route('/posts/<int:post_id>/comments', methods=['GET'])
@cache.cached(timeout=300, key_prefix='post_comments_')  # Cache comments for 5 minutes
def get_comments(post_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(
            "SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id "
            "WHERE c.post_id = %s ORDER BY c.created_at ASC",
            (post_id,)
        )
        comments = [dict(comment) for comment in cur.fetchall()]
        return jsonify(comments)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    invalidate_post_caches(post_id)
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({"message": "Comment content is required"}), 400

    content = data['content']
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(
            "INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
            (post_id, user_id, content)
        )
        new_comment_data = cur.fetchone()
        conn.commit()

        cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        full_comment = {
            'id': new_comment_data['id'],
            'post_id': post_id,
            'user_id': user_id,
            'content': content,
            'username': user['username'],
            'created_at': new_comment_data['created_at']
        }
        return jsonify(full_comment), 201
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    invalidate_post_caches(post_id)  # Invalidate relevant caches
    user_id = int(get_jwt_identity())
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM post_likes WHERE user_id = %s AND post_id = %s", (user_id, post_id))
        like = cur.fetchone()
        if like:
            cur.execute("DELETE FROM post_likes WHERE user_id = %s AND post_id = %s", (user_id, post_id))
            liked = False
        else:
            cur.execute("INSERT INTO post_likes (user_id, post_id) VALUES (%s, %s)", (user_id, post_id))
            liked = True
        conn.commit()

        cur.execute("SELECT COUNT(*) FROM post_likes WHERE post_id = %s", (post_id,))
        like_count = cur.fetchone()[0]
        return jsonify({"liked": liked, "like_count": like_count})
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

# ====================================================================
# --- Media Upload Endpoints ---
# ====================================================================

@app.route('/upload', methods=['POST'])
@jwt_required()
def upload_media():
    """
    Handles uploading of media files.
    Uploads to Amazon S3 if configured, otherwise falls back to local storage.
    """
    if 'file' not in request.files:
        return jsonify({"message": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No file selected for uploading"}), 400

    if file and allowed_file(file.filename):
        # Sanitize filename and make it unique to prevent overwrites
        import uuid
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"

        # --- S3 Upload Logic (for production on Vercel) ---
        if s3_client:
            try:
                s3_client.upload_fileobj(
                    file, S3_BUCKET, unique_filename,
                    ExtraArgs={"ACL": "public-read", "ContentType": file.content_type}
                )
                file_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{unique_filename}"
                return jsonify({"message": "File uploaded successfully to S3", "file_url": file_url}), 201
            except Exception as e:
                print(f"S3 Upload Error: {e}")
                return jsonify({"message": "Failed to upload to S3"}), 500

        # --- Local Fallback Logic (for development) ---
        else:
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            file_url = f"{request.host_url}uploads/{unique_filename}"
            return jsonify({"message": "File uploaded locally (S3 not configured)", "file_url": file_url}), 201
    else:
        return jsonify({"message": "File type not allowed"}), 400

# ====================================================================
# --- Categories Endpoint ---
# ====================================================================
@app.route('/categories', methods=['GET'])
@cache.cached(key_prefix='all_categories')
def get_categories():
    """Fetches all available categories."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT id, name, slug FROM categories ORDER BY name ASC")
        categories = [dict(cat) for cat in cur.fetchall()]
        return jsonify(categories)
    except Exception as e:
        print(f"DB Error fetching categories: {e}")
        return jsonify({'message': 'Failed to retrieve categories.'}), 500
    finally:
        if conn: conn.close()

# ====================================================================
# --- Category Posts Endpoint ---
# ====================================================================
@app.route('/posts/category/<category_slug>', methods=['GET'])
@cache.cached(timeout=300, key_prefix='category_posts_')
def get_posts_by_category(category_slug):
    """Fetches all posts associated with a specific category slug."""
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        user_id = None

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cur.execute("SELECT name FROM categories WHERE slug = %s", (category_slug,))
        category = cur.fetchone()
        if not category:
            return jsonify({"message": "Category not found"}), 404
        category_name = category['name']

        sql_query = """
            SELECT 
                p.*, u.username, cat.name as category_name, cat.slug as category_slug,
                COALESCE(lc.like_count, 0) AS like_count,
                EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = %s) AS liked_by_user,
                ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
                ARRAY_AGG(DISTINCT pm.media_url) FILTER (WHERE pm.media_url IS NOT NULL) as media_urls
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN categories cat ON p.category_id = cat.id
            LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM post_likes GROUP BY post_id) lc ON p.id = lc.post_id
            LEFT JOIN post_tags pt ON p.id = pt.post_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            LEFT JOIN post_media pm ON p.id = pm.post_id
            WHERE cat.slug = %s
            GROUP BY p.id, u.username, lc.like_count, cat.name, cat.slug
            ORDER BY p.created_at DESC;
        """
        cur.execute(sql_query, (user_id, category_slug))
        posts = [dict(post) for post in cur.fetchall()]
        
        return jsonify({"posts": posts, "category_name": category_name})
    except Exception as e:
        print(f"DB Error fetching posts by category: {e}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

# ====================================================================
# --- Webmention Endpoints ---
# ====================================================================
@app.route('/webmention', methods=['POST'])
def receive_webmention():
    """Handle incoming webmentions."""
    data = request.get_json()
    print("Received webmention data:", data)  # Debug print
    
    # Validate required fields
    if not data or 'source' not in data or 'target' not in data:
        return jsonify({"message": "Missing required fields (source and target)"}), 400
    
    source_url = data['source']
    target_url = data['target']
    mention_type = data.get('type', 'mention')
    author_info = data.get('author', {})
    if isinstance(author_info, dict):
        author_name = author_info.get('name')
        author_url = author_info.get('url')
        author_photo = author_info.get('photo')
    else:
        author_name = author_url = author_photo = None
    content = data.get('content')
    
    # Extract post ID from target URL
    try:
        # This logic assumes a URL structure like /posts/123 at the end
        path_parts = target_url.split('/')
        post_id = int(path_parts[-1] or path_parts[-2])
    except (ValueError, IndexError):
        return jsonify({"message": "Invalid target URL format"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post: return jsonify({"message": "Target post not found"}), 404
        
        insert_query = """
            INSERT INTO webmentions 
            (post_id, source_url, target_url, mention_type, author_name, author_url, author_photo, content, verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true)
            RETURNING id
        """
        values = (post_id, source_url, target_url, mention_type, author_name, author_url, author_photo, content)
        cur.execute(insert_query, values)
        webmention_id = cur.fetchone()[0]
        conn.commit()
        
        invalidate_post_caches(post_id)
        
        return jsonify({"message": "Webmention received successfully", "id": webmention_id}), 201
        
    except Exception as e:
        print(f"Error processing webmention: {e}")
        return jsonify({"message": "Error processing webmention"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>/webmentions', methods=['GET'])
def get_webmentions(post_id):
    """Get all webmentions for a post."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cur.execute("""
            SELECT * FROM webmentions 
            WHERE post_id = %s AND verified = true 
            ORDER BY published_at DESC
        """, (post_id,))
        
        webmentions = [dict(mention) for mention in cur.fetchall()]
        return jsonify(webmentions)
        
    except Exception as e:
        print(f"Error fetching webmentions: {e}")
        return jsonify({"message": "Error fetching webmentions"}), 500
    finally:
        if conn: conn.close()

# ====================================================================
# --- Sitemap Endpoint ---
# ====================================================================
@app.route('/sitemap.xml')
def sitemap():
    """Generates a sitemap.xml file for SEO."""
    base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        static_urls = [{'loc': base_url, 'lastmod': datetime.now().strftime('%Y-%m-%d')}]

        cur.execute("SELECT id, updated_at FROM posts ORDER BY updated_at DESC")
        posts = cur.fetchall()
        post_urls = [{'loc': f"{base_url}/posts/{post['id']}", 'lastmod': post['updated_at'].strftime('%Y-%m-%d')} for post in posts]

        cur.execute("SELECT slug FROM categories")
        categories = cur.fetchall()
        category_urls = [{'loc': f"{base_url}/category/{cat['slug']}", 'lastmod': datetime.now().strftime('%Y-%m-%d')} for cat in categories]

        cur.execute("SELECT name FROM tags")
        tags = cur.fetchall()
        tag_urls = [{'loc': f"{base_url}/tag/{tag['name']}", 'lastmod': datetime.now().strftime('%Y-%m-%d')} for tag in tags]

        all_urls = static_urls + post_urls + category_urls + tag_urls
        
        sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        for url_info in all_urls:
            sitemap_xml += '  <url>\n'
            sitemap_xml += f"    <loc>{url_info['loc']}</loc>\n"
            sitemap_xml += f"    <lastmod>{url_info['lastmod']}</lastmod>\n"
            sitemap_xml += '  </url>\n'
        sitemap_xml += '</urlset>'

        response = make_response(sitemap_xml)
        response.headers['Content-Type'] = 'application/xml'
        return response
    except Exception as e:
        print(f"Sitemap Generation Error: {e}")
        return jsonify({"message": "Could not generate sitemap"}), 500
    finally:
        if conn: conn.close()

# ====================================================================
# --- Captcha Endpoints ---
# ====================================================================
captchas = {}

def generate_token(length=12):
    """Generate a random token for captcha session"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

@app.route('/captcha/new', methods=['GET'])
def new_captcha():
    """Generate a new math captcha"""
    num1 = random.randint(1, 9)
    num2 = random.randint(1, 9)
    question = f"What is {num1} + {num2}?"
    answer = str(num1 + num2)

    token = generate_token()
    captchas[token] = answer

    return jsonify({
        "captcha_token": token,
        "question": question
    })

@app.route('/captcha/verify', methods=['POST'])
def verify_captcha():
    """Verify captcha answer"""
    data = request.get_json()
    token = data.get("captcha_token")
    user_answer = str(data.get("answer"))

    if not token or token not in captchas:
        return jsonify({"success": False, "error": "Invalid or expired captcha"}), 400

    correct_answer = captchas.pop(token) # Pop to ensure one-time use

    if user_answer == correct_answer:
        return jsonify({"success": True, "message": "Captcha passed"})
    else:
        return jsonify({"success": False, "error": "Incorrect answer"}), 400

# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
