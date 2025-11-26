# Supabase Database Configuration

## ✅ Updated: Using Supabase Pooler for IPv4 Support

### Why This Change?
Render requires IPv4 connections, and Supabase's connection pooler provides IPv4 compatibility through `aws-1-ap-south-1.pooler.supabase.com`.

### New Configuration
```bash
DATABASE_URL=postgresql://postgres.spnsqducnxmtsltqjieu:gdo9VOXXp5RevEQ5@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

### Database Setup Requirements

Since you're now using Supabase PostgreSQL instead of Render, you need to:

1. **Run the database schema on Supabase:**
   ```bash
   psql "postgresql://postgres.spnsqducnxmtsltqjieu:gdo9VOXXp5RevEQ5@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require" -f database/dbsetup.sql
   ```

2. **Or use Supabase SQL Editor:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `database/dbsetup.sql`
   - Paste and run

3. **Verify tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

### Key Differences: Supabase vs Render PostgreSQL

| Feature | Render | Supabase |
|---------|--------|----------|
| IP Support | IPv4 + IPv6 | IPv6 (pooler for IPv4) |
| Connection | Direct | Pooled |
| Port | 5432 | 5432 |
| SSL | Required | Required |
| Max Connections | Limited by plan | Pooled connections |

### Environment Variables for Render Deployment

Set these in your Render backend service:

```bash
DATABASE_URL=postgresql://postgres.spnsqducnxmtsltqjieu:gdo9VOXXp5RevEQ5@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://spnsqducnxmtsltqjieu.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET_NAME=uploads
FRONTEND_URL=https://chyrp-rebuild-clonefest-livid.vercel.app
```

### Testing Connection Locally

Run the test script to verify:
```bash
cd backend
python test_connection.py
```

Expected output:
```
✅ Database connection successful (with SSL)
✅ Found X tables in database
✅ All required tables exist!
✅ Bucket 'uploads' exists in Supabase
```

### Benefits of Using Supabase Database

1. ✅ **Unified Platform** - Database + Storage in one place
2. ✅ **IPv4 Support** - Pooler works with Render's requirements
3. ✅ **Better Free Tier** - 500MB database vs Render's limited free tier
4. ✅ **Built-in Dashboard** - Easy data management
5. ✅ **Auto Backups** - Daily backups included
6. ✅ **Real-time Features** - Can add real-time subscriptions later

### Important Notes

⚠️ **Connection Pooling:** The pooler URL uses connection pooling, which is better for serverless deployments like Render.

⚠️ **Session Mode:** If you need specific PostgreSQL session features, you may need to use transaction pooling mode instead.

⚠️ **Prepared Statements:** Some prepared statements might not work with pooling. The current code doesn't use them, so you're fine.

### Troubleshooting

**If connection fails:**
1. Check that SSL mode is enabled (already set in code)
2. Verify credentials haven't changed in Supabase
3. Check Supabase database is running (not paused)
4. Ensure pooler endpoint is correct for your region

**To get connection string again:**
- Supabase Dashboard → Project Settings → Database
- Look for "Connection Pooling" section
- Copy the "Connection string" with pooler URL

### Next Steps

1. ✅ Update environment variables on Render
2. ⏳ Run database schema on Supabase
3. ⏳ Test connection with `test_connection.py`
4. ⏳ Deploy backend to Render
5. ⏳ Test full application flow

---

**Status:** Configuration updated locally. Deploy to Render with new DATABASE_URL to complete the change.
