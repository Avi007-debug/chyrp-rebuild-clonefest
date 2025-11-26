# Database Setup Guide

This project uses **Supabase PostgreSQL** as its backend database.

---

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **New Project**
4. Choose your organization
5. Enter project details:
   - **Name**: chyrp-blog (or your preferred name)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
6. Click **Create new project**

---

## 2. Get Database Connection String

1. In Supabase Dashboard, go to **Project Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll to **Connection String** section
4. Select **Connection pooling** tab (important for Render/Vercel)
5. Mode: **Transaction**
6. Copy the connection string - it will look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-[REGION].pooler.supabase.com:5432/postgres
   ```

---

## 3. Run Database Schema

**Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `dbsetup.sql` from your project's `database/` folder
4. Copy all the SQL code
5. Paste into the Supabase SQL Editor
6. Click **Run** or press `Ctrl+Enter`
7. You should see "Success. No rows returned"

**Option B: Using psql Command Line**

```bash
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-[REGION].pooler.supabase.com:5432/postgres?sslmode=require" -f database/dbsetup.sql
```

---

## 4. Verify Tables Created

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - users
   - categories
   - tags
   - posts
   - post_tags
   - post_media
   - comments
   - post_likes
   - post_views
   - webmentions

Or run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 5. Configure Environment Variables

### Backend (.env file):
```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-[REGION].pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_KEY=[YOUR-SERVICE-ROLE-KEY]
SUPABASE_BUCKET_NAME=uploads
FRONTEND_URL=https://your-frontend.vercel.app
```

### Get Supabase Keys:
1. Go to **Project Settings** → **API**
2. Copy **Project URL** for `SUPABASE_URL`
3. Copy **service_role** key (not anon key!) for `SUPABASE_KEY`

---

## 6. Set Up Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `uploads`
4. Make it **Public**
5. Click **Create bucket**

### Set Bucket Policies:
Go to Storage → uploads bucket → Policies:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');
```

---

## Why Supabase Instead of Local PostgreSQL?

✅ **No local installation needed**  
✅ **Built-in storage for media files**  
✅ **Free tier includes 500MB database**  
✅ **Automatic backups**  
✅ **Works with Render/Vercel deployment**  
✅ **Connection pooling built-in**  
✅ **Easy management dashboard**

---

## Testing Connection

Run the test script from your backend folder:
```bash
cd backend
python test_connection.py
```

Expected output:
```
✅ Database connection successful (with SSL)
✅ Found 10 tables in database
✅ All required tables exist!
✅ Bucket 'uploads' exists in Supabase
```

---

✅ After completing these steps, your Supabase database is ready to use!
