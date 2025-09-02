from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from db_utils import get_db_connection

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = %s ORDER BY c.created_at ASC", (post_id,))
        comments = [dict(zip([desc[0] for desc in cur.description], row)) for row in cur.fetchall()]
        return jsonify(comments)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@comments_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({"message": "Comment content is required"}), 400
    content = data['content']
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at", (post_id, user_id, content))
        new_comment_data = cur.fetchone()
        conn.commit()
        cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        full_comment = {'id': new_comment_data[0], 'post_id': post_id, 'user_id': user_id, 'content': content, 'username': user[0], 'created_at': new_comment_data[1]}
        return jsonify(full_comment), 201
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()
