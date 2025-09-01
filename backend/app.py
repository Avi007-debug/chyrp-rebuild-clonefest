from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras # Used to get results as dictionaries

# Initializing flask app
app = Flask(__name__)
# Enable CORS for your React frontend
# This allows requests from any origin. For production, you might want to restrict this.
CORS(app)

# --- Database Connection Details ---
# Replace with your actual PostgreSQL credentials.
# It's recommended to use environment variables for these in a real application.
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"

# --- Database Connection Pool ---
# A simple function to get a new connection.
# For a larger application, consider using a connection pool like psycopg2.pool.
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

@app.route('/database_test')
def test_db():
    """A simple endpoint to verify the database connection."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # A simple query to test the connection
        cur.execute("SELECT version()")
        db_version = cur.fetchone()[0]
        cur.close()
        return jsonify({
            'message': 'Successfully connected to the database!',
            'db_version': db_version,
            'status': 'success'
        })
    except (Exception, psycopg2.DatabaseError) as error:
        return jsonify({
            'message': f'Database connection failed: {error}',
            'status': 'error'
        }), 500
    finally:
        if conn is not None:
            conn.close()

@app.route('/posts')
def get_posts():
    """Fetches all blog posts from the database."""
    conn = None
    try:
        conn = get_db_connection()
        # Use DictCursor to get rows as dictionaries (e.g., {'id': 1, 'title': '...'})
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Query to select all posts, ordered by creation date
        cur.execute("SELECT * FROM posts ORDER BY created_at DESC")
        
        posts_raw = cur.fetchall()
        cur.close()

        # Convert the list of DictRow objects to a list of standard dictionaries
        posts = [dict(post) for post in posts_raw]
        
        return jsonify(posts)

    except (Exception, psycopg2.DatabaseError) as error:
        print(error) # Log the error for debugging
        return jsonify({
            'message': 'Failed to retrieve posts.',
            'status': 'error'
        }), 500
    finally:
        if conn is not None:
            conn.close()


# --- Main Execution ---
if __name__ == '__main__':
    # Running in debug mode is convenient for development but should be disabled for production.
    app.run(debug=True, port=5000)
