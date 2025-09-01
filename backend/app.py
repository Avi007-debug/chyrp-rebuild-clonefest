from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager
import psycopg2
import psycopg2.extras
import os

# --- App Initialization ---
app = Flask(__name__)

# --- CORS Configuration (The Fix) ---
# This more explicit configuration ensures that the browser's
# preflight "OPTIONS" requests are handled correctly for all routes.
CORS(app, resources={r"/*": {"origins": "*"}})

bcrypt = Bcrypt(app)

# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = os.urandom(24).hex()
jwt = JWTManager(app)


# --- Database Connection Details ---
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    return conn

# --- API Endpoints ---

# === User Authentication Endpoints ===

@app.route('/register', methods=['POST'])
def register():
    """Registers a new user."""
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

        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (username, email, password_hash)
        )
        conn.commit()
        cur.close()
        return jsonify({"message": "User registered successfully"}), 201

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({"message": "Database error during registration"}), 500
    finally:
        if conn:
            conn.close()


@app.route('/login', methods=['POST'])
def login():
    """Logs in a user and returns a JWT access token."""
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
            access_token = create_access_token(identity={'username': user['username'], 'id': user['id']})
            return jsonify(access_token=access_token)
        
        return jsonify({"message": "Invalid username or password"}), 401

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({"message": "Database error during login"}), 500
    finally:
        if conn:
            conn.close()


# === Blog Post Endpoints ===

@app.route('/posts')
def get_posts():
    """Fetches all blog posts from the database."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cur.execute("""
            SELECT p.*, u.username 
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        """)
        
        posts_raw = cur.fetchall()
        cur.close()

        posts = [dict(post) for post in posts_raw]
        return jsonify(posts)

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn:
            conn.close()

# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

