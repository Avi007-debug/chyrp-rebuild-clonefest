#!/usr/bin/env python3
"""Test connection pooling with Supabase"""

import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

def test_connection_pool():
    """Test that connection pool works with keepalive settings"""
    print("Testing Supabase connection pool...")
    print(f"Database URL: {DB_URL[:50]}...")
    
    try:
        # Create connection pool with keepalive to prevent SSL timeouts
        connection_pool = pool.SimpleConnectionPool(
            1,  # minconn
            5,  # maxconn
            DB_URL,
            sslmode='require',
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
        print("✅ Connection pool created successfully")
        
        # Test getting a connection
        conn = connection_pool.getconn()
        print("✅ Got connection from pool")
        
        # Test a query
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM posts")
        count = cur.fetchone()[0]
        print(f"✅ Query successful: {count} posts found")
        cur.close()
        
        # Return connection to pool
        connection_pool.putconn(conn)
        print("✅ Connection returned to pool")
        
        # Test getting connection again
        conn2 = connection_pool.getconn()
        print("✅ Got connection from pool again")
        
        # Test another query
        cur2 = conn2.cursor()
        cur2.execute("SELECT version()")
        version = cur2.fetchone()[0]
        print(f"✅ PostgreSQL version: {version[:50]}...")
        cur2.close()
        
        # Return and close pool
        connection_pool.putconn(conn2)
        connection_pool.closeall()
        print("✅ Connection pool closed")
        
        print("\n✅ All connection pool tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_connection_pool()
