"""
Database Connection Test Script
Run this locally to verify your database setup before deploying
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test the database connection with the current environment variables"""
    
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        print("Please set DATABASE_URL in your .env file")
        return False
    
    print(f"🔍 Testing connection to database...")
    print(f"Database URL: {db_url.split('@')[1] if '@' in db_url else 'Invalid URL'}")
    
    try:
        # Try to connect with SSL
        conn = psycopg2.connect(db_url, sslmode='require')
        print("✅ Database connection successful (with SSL)")
        
        # Test if tables exist
        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print(f"✅ Found {len(tables)} tables in database:")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("⚠️  WARNING: No tables found in database")
            print("   You need to run database/dbsetup.sql")
        
        # Test for required tables
        required_tables = ['users', 'posts', 'categories', 'tags', 'comments', 'post_likes']
        existing_table_names = [t[0] for t in tables]
        
        missing_tables = [t for t in required_tables if t not in existing_table_names]
        
        if missing_tables:
            print(f"\n⚠️  WARNING: Missing required tables:")
            for table in missing_tables:
                print(f"   - {table}")
            print("\n   Run: psql <DATABASE_URL> -f database/dbsetup.sql")
        else:
            print("\n✅ All required tables exist!")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection failed:")
        print(f"   Error: {str(e)}")
        
        if "SSL" in str(e) or "ssl" in str(e):
            print("\n💡 SSL Connection Issue:")
            print("   - Make sure your DATABASE_URL includes the full hostname with region")
            print("   - Example: dpg-xxx.oregon-postgres.render.com")
            print("   - The code now uses sslmode='require' automatically")
        
        if "authentication failed" in str(e):
            print("\n💡 Authentication Issue:")
            print("   - Check your database username and password")
            print("   - Verify credentials in Render dashboard")
        
        if "timeout" in str(e) or "could not connect" in str(e):
            print("\n💡 Connection Timeout:")
            print("   - Check if database is running on Render")
            print("   - Verify your IP is not blocked")
            print("   - Use the Internal Database URL for Render deployments")
        
        return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_supabase_connection():
    """Test Supabase configuration"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_bucket = os.getenv("SUPABASE_BUCKET_NAME", "uploads")
    
    print("\n🔍 Testing Supabase configuration...")
    
    if not supabase_url:
        print("❌ ERROR: SUPABASE_URL not found")
        return False
    
    if not supabase_key:
        print("❌ ERROR: SUPABASE_KEY not found")
        return False
    
    print(f"✅ SUPABASE_URL: {supabase_url}")
    print(f"✅ SUPABASE_KEY: {supabase_key[:20]}...")
    print(f"✅ SUPABASE_BUCKET: {supabase_bucket}")
    
    try:
        from supabase import create_client
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Try to list buckets
        buckets = supabase.storage.list_buckets()
        
        bucket_names = [b.name for b in buckets]
        
        if supabase_bucket in bucket_names:
            print(f"✅ Bucket '{supabase_bucket}' exists in Supabase")
        else:
            print(f"⚠️  WARNING: Bucket '{supabase_bucket}' not found")
            print(f"   Available buckets: {', '.join(bucket_names) if bucket_names else 'None'}")
            print(f"   Create the bucket in Supabase Dashboard → Storage")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        print("\n💡 Check:")
        print("   - SUPABASE_URL is correct")
        print("   - SUPABASE_KEY is the Service Role Key (not anon key)")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("  Database & Storage Configuration Test")
    print("=" * 60)
    print()
    
    db_ok = test_database_connection()
    supabase_ok = test_supabase_connection()
    
    print("\n" + "=" * 60)
    if db_ok and supabase_ok:
        print("✅ All tests passed! Your configuration looks good.")
    else:
        print("⚠️  Some issues found. Please fix them before deploying.")
    print("=" * 60)

if __name__ == "__main__":
    main()
