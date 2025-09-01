# app.py

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)