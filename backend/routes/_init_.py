from .auth import auth_bp
from .posts import posts_bp
from .comments import comments_bp
from .likes import likes_bp
from .tags import tags_bp

# Export all blueprints for easy import in app.py
__all__ = ["auth_bp", "posts_bp", "comments_bp", "likes_bp", "tags_bp"]
