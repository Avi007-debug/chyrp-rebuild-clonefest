# Deployment Guide - Chyrp Rebuild

## Common Database Errors & Fixes

### Issue 1: SSL Connection Error
**Error:** `SSL connection has been closed unexpectedly` or `FATAL: no pg_hba.conf entry`

**Fix:** The database connection now includes `sslmode='require'` for Render PostgreSQL.

### Issue 2: Database URL Format
**Error:** Connection timeout or authentication failed

**Fix:** Your DATABASE_URL should include the full host with region:
```
postgresql://user:password@host.region.render.com/database_name
```

Your current URL is missing `.oregon-postgres.render.com` - it should be:
```
postgresql://p1:1FJCM59AtmRHb2FCtBGDc6BGjQhBDjKX@dpg-d2tk6jndiees738b66l0-a.oregon-postgres.render.com/blog_ixcu
```

---

## Deployment Checklist

### 1. Render Backend Setup

#### Environment Variables to Set on Render:
```bash
SUPABASE_URL=https://spnsqducnxmtsltqjieu.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbnNxZHVjbnhtdHNsdHFqaWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE0MjUwMCwiZXhwIjoyMDcyNzE4NTAwfQ.3drkVmVKvMEdDQALIOBm-zv0UiibxpUo_0US4PNXk9g
SUPABASE_BUCKET_NAME=uploads
DATABASE_URL=<Your Render PostgreSQL Internal URL>
FRONTEND_URL=<Your Vercel URL>
```

#### Important Notes:
- Use the **Internal Database URL** from Render (it includes the region)
- The DATABASE_URL is automatically set when you connect your PostgreSQL database to your web service
- Make sure to use the **Service Role Key** for Supabase (not anon key)

---

### 2. Render Database Setup

1. **Create PostgreSQL Database on Render:**
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `chyrp-blog-db`
   - Region: Oregon (US West) - matches your current setup
   - Plan: Free or Starter

2. **Run Database Schema:**
   - Connect to your Render database using the **External Database URL**
   - Use a PostgreSQL client (pgAdmin, DBeaver, or psql)
   - Run the `database/dbsetup.sql` script

   ```bash
   # Using psql from command line
   psql "postgresql://p1:PASSWORD@HOST.oregon-postgres.render.com/blog_ixcu" -f database/dbsetup.sql
   ```

3. **Verify Tables Created:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

---

### 3. Supabase Storage Setup

1. **Create Storage Bucket:**
   - Go to Supabase Dashboard → Storage
   - Create new bucket named `uploads`
   - Make it **public** for read access

2. **Set Bucket Policies:**
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

3. **Enable RLS (Row Level Security):**
   - Go to Storage settings
   - Enable RLS on the uploads bucket

---

### 4. Vercel Frontend Setup

1. **Environment Variables on Vercel:**
   ```bash
   VITE_API_BASE_URL=https://your-backend.onrender.com
   ```

2. **Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Root Directory: `chyrp`

3. **Vercel Configuration (create `vercel.json` in `/chyrp/`):**
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

### 5. Update Frontend Code

Make sure all API calls use the configured API_BASE_URL. Example:

```javascript
import { API_BASE_URL } from './apiConfig';

// Example API call
fetch(`${API_BASE_URL}/posts`)
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## Testing Your Deployment

### 1. Test Backend Health:
```bash
curl https://your-backend.onrender.com/
# Should return: {"status":"ok","message":"Chyrp Backend is running"}
```

### 2. Test Database Connection:
```bash
curl https://your-backend.onrender.com/categories
# Should return list of categories
```

### 3. Test Supabase Upload:
- Try uploading an image from the frontend
- Check if it appears in Supabase Storage bucket

### 4. Test Full Flow:
1. Register a new user
2. Login
3. Create a post with media
4. View the post
5. Add a comment
6. Like the post

---

## Common Issues & Solutions

### Issue: "relation does not exist"
**Cause:** Database tables not created
**Fix:** Run `database/dbsetup.sql` on your Render PostgreSQL database

### Issue: "Connection timeout"
**Cause:** Wrong DATABASE_URL or database not accessible
**Fix:** 
- Use the **Internal Database URL** from Render
- Ensure it includes the region (e.g., `.oregon-postgres.render.com`)
- The code now uses `sslmode='require'` automatically

### Issue: "CORS error" on API calls
**Cause:** Backend not allowing frontend origin
**Fix:** Already handled with `CORS(app)` but you can specify:
```python
CORS(app, origins=["https://your-vercel-app.vercel.app"])
```

### Issue: "Unauthorized" on file uploads
**Cause:** JWT token not being sent or Supabase key incorrect
**Fix:**
- Check SUPABASE_KEY is the Service Role Key (not anon key)
- Ensure frontend sends JWT in Authorization header

### Issue: "Bucket not found" 
**Cause:** Supabase bucket not created or wrong name
**Fix:** 
- Create bucket named `uploads` in Supabase Storage
- Verify SUPABASE_BUCKET_NAME matches in .env

---

## Monitoring & Debugging

### Check Render Logs:
```bash
# In Render Dashboard
Web Service → Logs → View Live Logs
```

### Check Database Status:
```bash
# In Render Dashboard  
PostgreSQL → Connections → Check Connection Info
```

### Enable Flask Debug Mode Temporarily:
**Note:** Only for debugging, remove in production
```python
if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## Security Checklist

✅ Use Service Role Key for Supabase (not in frontend code)  
✅ Set proper CORS origins (not `*` in production)  
✅ Use HTTPS for all connections  
✅ Set strong JWT secret (change from default)  
✅ Enable RLS policies on Supabase  
✅ Don't commit `.env` files to git  
✅ Use environment variables on all platforms  

---

## Next Steps

1. ✅ Fix DATABASE_URL format (add region)
2. ✅ Run database schema on Render PostgreSQL
3. ✅ Set environment variables on Vercel
4. ✅ Update apiConfig.js with backend URL
5. ✅ Test all endpoints
6. ✅ Monitor Render logs for errors

---

## Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test database connection directly using psql
5. Check Supabase dashboard for storage issues
