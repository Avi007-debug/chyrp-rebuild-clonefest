from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import os

# --- App Initialization ---
app = Flask(__name__)

# --- CORS Configuration ---
CORS(app, resources={r"/*": {"origins": "*"}})

bcrypt = Bcrypt(app)

# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = "your-super-secret-key-for-development" 
jwt = JWTManager(app)

# Custom error handlers for JWT
@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({"message": "Missing or invalid Authorization Header"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": f"Invalid token: {error}"}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token has expired"}), 401

# --- Database Connection Details ---
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    conn = psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS
    )
    return conn

# --- API Endpoints ---

# === User Authentication Endpoints (Unchanged) ===
@app.route('/register', methods=['POST'])
def register():
    # ... code is unchanged ...
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({"message": "Missing username, email, or password"}), 400
    username = data['username']
    email = data['email']
    password = data['password']
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            return jsonify({"message": "Username or email already exists"}), 409
        cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)", (username, email, password_hash))
        conn.commit()
        cur.close()
        return jsonify({"message": "User registered successfully"}), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR during registration: {error}")
        return jsonify({"message": "Database error during registration"}), 500
    finally:
        if conn: conn.close()

@app.route('/login', methods=['POST'])
def login():
    # ... code is unchanged ...
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"message": "Missing username or password"}), 400
    username = data['username']
    password = data['password']
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        if user and bcrypt.check_password_hash(user['password_hash'], password):
            user_id = user['id']
            access_token = create_access_token(identity=str(user_id))
            return jsonify(access_token=access_token)
        return jsonify({"message": "Invalid username or password"}), 401
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR during login: {error}")
        return jsonify({"message": "Database error during login"}), 500
    finally:
        if conn: conn.close()


# === Blog Post Endpoints (GET and POST are unchanged) ===
@app.route('/posts', methods=['GET'])
def get_posts():
    # ... code is unchanged ...
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC")
        posts_raw = cur.fetchall()
        cur.close()
        posts = [dict(post) for post in posts_raw]
        return jsonify(posts)
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR while fetching posts: {error}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

@app.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    # ... code is unchanged ...
    user_id = int(get_jwt_identity())
    data = request.get_json()
    post_type = data.get('type', 'text')
    title = data.get('title')
    content = data.get('content')
    if not title:
        return jsonify({"message": "Title is required"}), 400
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO posts (user_id, type, title, content) VALUES (%s, %s, %s, %s)", (user_id, post_type, title, content))
        conn.commit()
        cur.close()
        return jsonify({"message": "Post created successfully"}), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR while creating post: {error}")
        return jsonify({"message": "Database error while creating post"}), 500
    finally:
        if conn: conn.close()


# ====================================================================
# --- NEW: Update (Edit) Post Endpoint ---
# ====================================================================
@app.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Updates a specific post. Requires user to be the author."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')

    if not title:
        return jsonify({"message": "Title is required"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # First, verify the user is the author of the post
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id:
            return jsonify({"message": "Forbidden: You are not the author of this post"}), 403

        # If authorized, update the post
        cur.execute("UPDATE posts SET title = %s, content = %s WHERE id = %s", (title, content, post_id))
        conn.commit()
        cur.close()
        return jsonify({"message": "Post updated successfully"})

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR while updating post: {error}")
        return jsonify({"message": "Database error while updating post"}), 500
    finally:
        if conn: conn.close()


# ====================================================================
# --- NEW: Delete Post Endpoint ---
# ====================================================================
@app.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Deletes a specific post. Requires user to be the author."""
    current_user_id = int(get_jwt_identity())
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Verify the user is the author before deleting
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        if post['user_id'] != current_user_id:
            return jsonify({"message": "Forbidden: You are not the author of this post"}), 403

        # If authorized, delete the post
        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        cur.close()
        return jsonify({"message": "Post deleted successfully"})

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"DATABASE ERROR while deleting post: {error}")
        return jsonify({"message": "Database error while deleting post"}), 500
    finally:
        if conn: conn.close()


# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

