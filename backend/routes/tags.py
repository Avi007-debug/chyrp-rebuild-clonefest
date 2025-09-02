from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from db_utils import get_db_connection

tags_bp = Blueprint('tags', __name__)

@tags_bp.route('/posts/tag/<tag_name>', methods=['GET'])
def get_posts_by_tag(tag_name):
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
            JOIN post_tags pt ON p.id = pt.post_id
            JOIN tags t ON pt.tag_id = t.id
            WHERE t.name = %s
            GROUP BY p.id, u.username, lc.like_count
            ORDER BY p.created_at DESC;
        """
        cur.execute(sql_query, (user_id, tag_name))
        posts = [dict(zip([desc[0] for desc in cur.description], row)) for row in cur.fetchall()]
        return jsonify(posts)
    except Exception as e:
        print(f"DB Error: {e}")
        return jsonify({'message': 'Failed to retrieve posts.'}), 500
    finally:
        if conn: conn.close()
