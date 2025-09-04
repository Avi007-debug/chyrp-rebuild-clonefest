from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity, verify_jwt_in_request
import psycopg2
import psycopg2.extras
import os
import random
import string


# --- App Initialization & Config ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
bcrypt = Bcrypt(app)
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-for-development" 
jwt = JWTManager(app)

# --- Custom JWT Error Handlers ---
@jwt.unauthorized_loader
def unauthorized_callback(callback): return jsonify({"message": "Missing or invalid Authorization Header"}), 401
@jwt.invalid_token_loader
def invalid_token_callback(error): return jsonify({"message": f"Invalid token: {error}"}), 422
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload): return jsonify({"message": "Token has expired"}), 401

# --- Database Connection ---
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"
def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

# --- Helper Function for Tag Management ---
def manage_tags(cur, post_id, tags_string):
    """Handles finding/creating tags and linking them to a post."""
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
        
        # Link tags to the post
        for tag_id in tag_ids:
            cur.execute("INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (post_id, tag_id))

# --- API Endpoints ---

# === User Authentication (Unchanged) ===
@app.route('/register', methods=['POST'])
def register():
    # ... code is unchanged ...
    data = request.get_json()
    if not all(key in data for key in ['username', 'email', 'password']): return jsonify({"message": "Missing required fields"}), 400
    username, email, password = data['username'], data['email'], data['password']
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone(): return jsonify({"message": "Username or email already exists"}), 409
        cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)", (username, email, password_hash))
        conn.commit()
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    # ... code is unchanged ...
    data = request.get_json()
    if not all(key in data for key in ['username', 'password']): return jsonify({"message": "Missing username or password"}), 400
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

# === Blog Post Endpoints ===

@app.route('/posts', methods=['GET'])
def get_posts():
    # ... (This function is now more complex to include tags) ...
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
            LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM post_likes GROUP BY post_id) lc ON p.id = lc.post_id
            LEFT JOIN post_tags pt ON p.id = pt.post_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            GROUP BY p.id, u.username, lc.like_count
            ORDER BY p.created_at DESC;
        """
        cur.execute(sql_query, (user_id,))
        posts = [dict(post) for post in cur.fetchall()]
        return jsonify(posts)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

@app.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    # ... (This function is updated to handle tags) ...
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title'): return jsonify({"message": "Title is required"}), 400
    
    post_type, title, content = data.get('type', 'text'), data.get('title'), data.get('content')
    tags_string = data.get('tags', '') # Get tags as a comma-separated string
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        attribution = data.get('attribution')
        license = data.get('license')

        cur.execute(
            "INSERT INTO posts (user_id, type, title, content, attribution, license) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (user_id, post_type, title, content, attribution, license)
        )
        post_id = cur.fetchone()[0]
        
        # Use the helper to manage tags
        manage_tags(cur, post_id, tags_string)

        conn.commit()
        return jsonify({"message": "Post created successfully", "post_id": post_id}), 201
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    # ... (This function is updated to handle tags) ...
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title'): return jsonify({"message": "Title is required"}), 400
    
    title, content = data.get('title'), data.get('content')
    tags_string = data.get('tags', '')

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post: return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id: return jsonify({"message": "Forbidden"}), 403
        attribution = data.get('attribution')
        license = data.get('license')

        cur.execute(
            "UPDATE posts SET title = %s, content = %s, attribution = %s, license = %s WHERE id = %s",
            (title, content, attribution, license, post_id)
        )
        
        # Easiest way to update tags is to clear old ones and add new ones
        cur.execute("DELETE FROM post_tags WHERE post_id = %s", (post_id,))
        manage_tags(cur, post_id, tags_string)
        
        conn.commit()
        return jsonify({"message": "Post updated successfully"})
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    # ... (code is unchanged) ...
    current_user_id = int(get_jwt_identity())
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post: return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id: return jsonify({"message": "Forbidden"}), 403
        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        return jsonify({"message": "Post deleted successfully"})
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

# === Comment Endpoints (Unchanged) ===
@app.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    # ... (code is unchanged) ...
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = %s ORDER BY c.created_at ASC", (post_id,))
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
    # ... (code is unchanged) ...
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get('content'): return jsonify({"message": "Comment content is required"}), 400
    content = data['content']
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at", (post_id, user_id, content))
        new_comment_data = cur.fetchone()
        conn.commit()
        cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        full_comment = {'id': new_comment_data['id'], 'post_id': post_id, 'user_id': user_id, 'content': content, 'username': user['username'], 'created_at': new_comment_data['created_at']}
        return jsonify(full_comment), 201
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

# === Like Endpoint (Unchanged) ===
@app.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    # ... (code is unchanged) ...
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
# --- NEW: Tag Endpoint ---
# ====================================================================
@app.route('/posts/tag/<tag_name>', methods=['GET'])
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
        # This query is similar to get_posts but filters by a specific tag name
        sql_query = """
            SELECT 
                p.*, u.username,
                COALESCE(lc.like_count, 0) AS like_count,
                EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = %s) AS liked_by_user,
                ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM post_likes GROUP BY post_id) lc ON p.id = lc.post_id
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
@app.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Increment view count and fetch updated post
        cur.execute(
            "UPDATE posts SET view_count = view_count + 1 WHERE id = %s RETURNING *",
            (post_id,)
        )
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404

        # Get tags
        cur.execute("""
            SELECT t.name FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = %s
        """, (post_id,))
        tags = [row['name'] for row in cur.fetchall()]

        conn.commit()

        # Convert DictRow -> dict and attach tags
        post_data = dict(post)
        post_data["tags"] = tags

        return jsonify(post_data)

    except Exception as e:
        print(f"DB Error: {e}")   # check Flask logs!
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn:
            conn.close()

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

    correct_answer = captchas[token]
    del captchas[token]  # One-time use

    if user_answer == correct_answer:
        return jsonify({"success": True, "message": "Captcha passed"})
    else:
        return jsonify({"success": False, "error": "Incorrect answer"}), 400
# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

