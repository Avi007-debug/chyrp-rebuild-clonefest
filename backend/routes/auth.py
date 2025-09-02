from flask import Blueprint, jsonify, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager
from db_utils import get_db_connection
from db_utils import get_db_connection, bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not all(key in data for key in ['username', 'email', 'password']):
        return jsonify({"message": "Missing required fields"}), 400
    username, email, password = data['username'], data['email'], data['password']
    # Use bcrypt from app context
    from ..app import bcrypt
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
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not all(key in data for key in ['username', 'password']):
        return jsonify({"message": "Missing username or password"}), 400
    username, password = data['username'], data['password']
    # Use bcrypt from app context
    from ..app import bcrypt
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        if user and bcrypt.check_password_hash(user[3], password):
            # user[3] is password_hash
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity=str(user[0])) # user[0] is id
            return jsonify(access_token=access_token)
        return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()
