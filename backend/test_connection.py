"""
Database & Supabase Configuration Test Script
Works with Supabase Session Pooler + psycopg2
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------
#  DATABASE TEST
# ---------------------------------------------------------
def test_database_connection():
    print("=" * 60)
    print("🔍 TESTING DATABASE CONNECTION")
    print("=" * 60)

    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        return False

    # Show only the "host:port/db" part for safety
    try:
        host_info = db_url.split('@')[1]
    except:
        host_info = "Invalid URL"

    print(f"Database URL → {host_info}")

    try:
        # IMPORTANT: Do NOT override SSL here!
        conn = psycopg2.connect(db_url)
        print("✅ Successfully connected to Supabase Session Pooler")

        cursor = conn.cursor()

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()

        if tables:
            print(f"\n📦 Found {len(tables)} tables:")
            for t in tables:
                print(f"  - {t[0]}")
        else:
            print("⚠️ No tables found. You need to run dbsetup.sql")

        required_tables = ['users', 'posts', 'categories', 'tags', 'comments', 'post_likes']
        existing = [t[0] for t in tables]
        missing = [t for t in required_tables if t not in existing]

        if missing:
            print("\n⚠️ Missing required tables:")
            for m in missing:
                print(f"  - {m}")
        else:
            print("\n✅ All required tables exist!")

        cursor.close()
        conn.close()
        return True

    except psycopg2.OperationalError as e:
        print("❌ Database connection failed:")
        print("   ", str(e))

        if "SSL" in str(e):
            print("💡 Fix: Ensure your DATABASE_URL contains sslmode=require")

        if "authentication failed" in str(e):
            print("💡 Fix: Incorrect password or username. Supabase uses username 'postgres'.")

        if "SASL" in str(e):
            print("💡 Fix: You MUST use the Session Pooler connection string from Supabase.")

        if "closed" in str(e):
            print("💡 Fix: Remove sslmode override in psycopg2.connect()")

        return False

    except Exception as e:
        print("❌ Unexpected error:", str(e))
        return False


# ---------------------------------------------------------
#  SUPABASE STORAGE TEST
# ---------------------------------------------------------
def test_supabase_connection():
    print("\n" + "=" * 60)
    print("🔍 TESTING SUPABASE STORAGE")
    print("=" * 60)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "uploads")

    if not supabase_url or not supabase_key:
        print("❌ SUPABASE_URL or SUPABASE_KEY missing!")
        return False

    print(f"SUPABASE_URL → {supabase_url}")
    print(f"SUPABASE_KEY → {supabase_key[:20]}...")
    print(f"Bucket → {bucket_name}")

    try:
        from supabase import create_client

        client = create_client(supabase_url, supabase_key)

        buckets = client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]

        if bucket_name in bucket_names:
            print(f"✅ Bucket '{bucket_name}' exists")
        else:
            print(f"⚠️ Bucket '{bucket_name}' does not exist")
            print(f"   Available buckets: {bucket_names}")

        return True

    except Exception as e:
        print("❌ Supabase connection failed:", str(e))
        print("💡 Fix: Ensure you are using the SERVICE ROLE KEY")
        return False


# ---------------------------------------------------------
#  MAIN
# ---------------------------------------------------------
def main():
    db_ok = test_database_connection()
    supabase_ok = test_supabase_connection()

    print("\n" + "=" * 60)
    if db_ok and supabase_ok:
        print("✅ ALL TESTS PASSED! System is correctly configured.")
    else:
        print("⚠️ Some issues detected. Please fix them before deploying.")
    print("=" * 60)


if __name__ == "__main__":
    main()
