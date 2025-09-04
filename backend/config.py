import os

class Config:
    # Secret key for JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-for-development")

    # Database connection settings
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "blog")
    DB_USER = os.getenv("DB_USER", "p1")
    DB_PASS = os.getenv("DB_PASS", "root")
