from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from db_utils import get_db_connection, manage_tags

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/posts', methods=['GET'])
def get_posts():
    user_id = None
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        user_id = None
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
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
        posts = [dict(zip([desc[0] for desc in cur.description], row)) for row in cur.fetchall()]
        return jsonify(posts)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()

@posts_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title'):
        return jsonify({"message": "Title is required"}), 400
    post_type, title, content = data.get('type', 'text'), data.get('title'), data.get('content')
    tags_string = data.get('tags', '')
    # manage_tags is now imported above
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO posts (user_id, type, title, content) VALUES (%s, %s, %s, %s) RETURNING id",
            (user_id, post_type, title, content)
        )
        post_id = cur.fetchone()[0]
        manage_tags(cur, post_id, tags_string)
        conn.commit()
        return jsonify({"message": "Post created successfully", "post_id": post_id}), 201
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@posts_bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Get post and author
        cur.execute("SELECT * FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        # Get user_id from JWT if available
        user_id = None
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            user_id = None
        # Only increment view_count if viewer is not author and hasn't viewed before
        incremented = False
        if user_id and int(user_id) != post[1]: # post[1] is user_id
            cur.execute("SELECT 1 FROM post_views WHERE user_id = %s AND post_id = %s", (user_id, post_id))
            already_viewed = cur.fetchone()
            if not already_viewed:
                cur.execute("UPDATE posts SET view_count = view_count + 1 WHERE id = %s", (post_id,))
                cur.execute("INSERT INTO post_views (user_id, post_id) VALUES (%s, %s)", (user_id, post_id))
                incremented = True
        # Get tags
        cur.execute("""
            SELECT t.name FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = %s
        """, (post_id,))
        tags = [row[0] for row in cur.fetchall()]
        # Get updated view_count if incremented
        if incremented:
            cur.execute("SELECT view_count FROM posts WHERE id = %s", (post_id,))
            view_count = cur.fetchone()[0]
        else:
            view_count = post[6] # assuming view_count is at index 6
        conn.commit()
        post_data = dict(zip([desc[0] for desc in cur.description], post))
        post_data['tags'] = tags
        post_data['view_count'] = view_count
        return jsonify(post_data)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@posts_bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title'):
        return jsonify({"message": "Title is required"}), 400
    title, content = data.get('title'), data.get('content')
    tags_string = data.get('tags', '')
    from ..app import manage_tags
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        if post[0] != current_user_id:
            return jsonify({"message": "Forbidden"}), 403
        cur.execute("UPDATE posts SET title = %s, content = %s WHERE id = %s", (title, content, post_id))
        cur.execute("DELETE FROM post_tags WHERE post_id = %s", (post_id,))
        manage_tags(cur, post_id, tags_string)
        conn.commit()
        return jsonify({"message": "Post updated successfully"})
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()

@posts_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    current_user_id = int(get_jwt_identity())
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cur.fetchone()
        if not post:
            return jsonify({"message": "Post not found"}), 404
        if post[0] != current_user_id:
            return jsonify({"message": "Forbidden"}), 403
        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        return jsonify({"message": "Post deleted successfully"})
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({"message": "Database error"}), 500
    finally:
        if conn: conn.close()
