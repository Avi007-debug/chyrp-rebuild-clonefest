from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

# Initializing flask app
app = Flask(__name__)
# Enable CORS for your React frontend
CORS(app)

# Database connection details (replace with your own)
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"

# Function to connect to the database
def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    return conn

# A simple endpoint that connects to the database and returns data
@app.route('/database_test')
def test_db():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # You can run a simple query here to test the connection
        cur.execute("SELECT 1")
        result = cur.fetchone()[0]
        cur.close()
        return jsonify({
            'message': f'Successfully connected to the database! Result: {result}',
            'status': 'success'
        })
    except (Exception, psycopg2.DatabaseError) as error:
        return jsonify({
            'message': f'Database connection failed: {error}',
            'status': 'error'
        })
    finally:
        if conn is not None:
            conn.close()

# New endpoint for blog posts
@app.route('/posts')
def get_posts():
    # In a real application, you would fetch this data from your PostgreSQL database.
    # For now, we will use hardcoded data to test the frontend.
    sample_posts = [
        {
            "type": "text",
            "title": "Welcome to Chyrp Lite",
            "content": "This is the first post on your new Chyrp Lite blog. It's a text post, simple and clean. You can edit or delete this post and start creating your own content!"
        },
        {
            "type": "photo",
            "title": "A Beautiful Sunset",
            "image_url": "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        },
        {
            "type": "quote",
            "quote_text": "The future belongs to those who believe in the beauty of their dreams.",
            "quote_author": "Eleanor Roosevelt"
        },
        {
            "type": "link",
            "title": "Vite - Next Generation Frontend Tooling",
            "url": "https://vitejs.dev/"
        }
    ]
    return jsonify(sample_posts)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
