from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity, verify_jwt_in_request
import psycopg2
import psycopg2.extras
import os

# --- App Initialization ---
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

# --- API Endpoints ---

# === User Authentication Endpoints (Unchanged) ===
@app.route('/register', methods=['POST'])
def register():
    # ... (code is unchanged) ...
    data = request.get_json()
    if not all(key in data for key in ['username', 'email', 'password']): return jsonify({"message": "Missing username, email, or password"}), 400
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
        cur.close()
        return jsonify({"message": "User registered successfully"}), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR during registration: {error}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/login', methods=['POST'])
def login():
    # ... (code is unchanged) ...
    data = request.get_json()
    if not all(key in data for key in ['username', 'password']): return jsonify({"message": "Missing username or password"}), 400
    username, password = data['username'], data['password']
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        if user and bcrypt.check_password_hash(user['password_hash'], password):
            access_token = create_access_token(identity=str(user['id']))
            return jsonify(access_token=access_token)
        return jsonify({"message": "Invalid username or password"}), 401
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR during login: {error}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()


# ====================================================================
# --- UPDATED: Blog Post Endpoints ---
# ====================================================================

@app.route('/posts', methods=['GET'])
def get_posts():
    """
    Fetches all posts.
    UPDATED: Now includes like count and if the current user has liked each post.
    """
    conn = None
    user_id = None
    # Safely get the user ID if a valid token is present, but don't require it.
    # This allows anonymous users to still view posts and like counts.
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        user_id = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # This more advanced query joins posts with users, and also calculates
        # the total like count and checks if the current user has liked the post.
        sql_query = """
            SELECT 
                p.*, 
                u.username,
                COALESCE(lc.like_count, 0) AS like_count,
                EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = %s) AS liked_by_user
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM post_likes
                GROUP BY post_id
            ) lc ON p.id = lc.post_id
            ORDER BY p.created_at DESC;
        """
        
        cur.execute(sql_query, (user_id,))
        posts = [dict(post) for post in cur.fetchall()]
        cur.close()
        return jsonify(posts)
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR fetching posts: {error}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

# ... (POST, PUT, DELETE routes for /posts are unchanged) ...
@app.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title'): return jsonify({"message": "Title is required"}), 400
    post_type, title, content = data.get('type', 'text'), data.get('title'), data.get('content')
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO posts (user_id, type, title, content) VALUES (%s, %s, %s, %s)", (user_id, post_type, title, content))
        conn.commit()
        cur.close()
        return jsonify({"message": "Post created successfully"}), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR creating post: {error}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title'): return jsonify({"message": "Title is required"}), 400
    title, content = data.get('title'), data.get('content')
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post: return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id: return jsonify({"message": "Forbidden"}), 403
        cur.execute("UPDATE posts SET title = %s, content = %s WHERE id = %s", (title, content, post_id))
        conn.commit()
        cur.close()
        return jsonify({"message": "Post updated successfully"})
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR updating post: {error}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@app.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
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
        cur.close()
        return jsonify({"message": "Post deleted successfully"})
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR deleting post: {error}")
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
        cur.close()
        return jsonify(comments)
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR fetching comments: {error}")
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
        cur.close()
        full_comment = { 'id': new_comment_data['id'], 'post_id': post_id, 'user_id': user_id, 'content': content, 'username': user['username'], 'created_at': new_comment_data['created_at'] }
        return jsonify(full_comment), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR adding comment: {error}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

# ====================================================================
# --- NEW: Like Endpoint ---
# ====================================================================
@app.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    """Toggles a like on a post for the current user."""
    user_id = int(get_jwt_identity())
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if the user has already liked the post
        cur.execute("SELECT * FROM post_likes WHERE user_id = %s AND post_id = %s", (user_id, post_id))
        like = cur.fetchone()

        if like:
            # If a like exists, delete it (unlike)
            cur.execute("DELETE FROM post_likes WHERE user_id = %s AND post_id = %s", (user_id, post_id))
            liked = False
        else:
            # If no like exists, insert a new one (like)
            cur.execute("INSERT INTO post_likes (user_id, post_id) VALUES (%s, %s)", (user_id, post_id))
            liked = True
        
        conn.commit()
        
        # Get the new total like count for the post
        cur.execute("SELECT COUNT(*) FROM post_likes WHERE post_id = %s", (post_id,))
        like_count = cur.fetchone()[0]
        
        cur.close()
        
        return jsonify({
            "liked": liked,
            "like_count": like_count
        })

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR toggling like: {error}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

