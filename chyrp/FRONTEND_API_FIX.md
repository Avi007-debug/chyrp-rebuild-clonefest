# Frontend API Configuration Fix

## Problem Found
Your frontend components are using **hardcoded API URLs** instead of the centralized config:

```javascript
// ❌ HARDCODED - Found in 10+ components
const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";
```

This means:
- Changes to the backend URL require updating 10+ files
- Environment-based configuration (dev/prod) doesn't work
- The `apiConfig.js` file we created is not being used

## Solution

### Option 1: Update All Components (Recommended)

Replace the hardcoded URL in each component with an import:

```javascript
// ❌ BEFORE
const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";

// ✅ AFTER
import { API_BASE_URL as API_URL } from '../apiConfig';
```

### Files That Need Updates:
1. `src/components/CategoryPage.jsx`
2. `src/components/CommentSection.jsx`
3. `src/components/CreatePostPage.jsx`
4. `src/components/EditPostPage.jsx`
5. `src/components/HomePage.jsx`
6. `src/components/LikeButton.jsx`
7. `src/components/LoginPage.jsx`
8. `src/components/PostDetailPage.jsx`
9. `src/components/RegisterPage.jsx`
10. `src/components/TagPage.jsx`
11. `src/components/WebmentionList.jsx`

### Option 2: Quick Fix for Testing

Update your `.env.production` file:
```bash
VITE_API_BASE_URL=https://chyrp-rebuild-clonefest.onrender.com
```

But components still won't use it unless you update the imports.

---

## Why This Matters

With environment-based config, you can:
- ✅ Use different URLs for development and production
- ✅ Change the backend URL in ONE place
- ✅ Test locally without editing code
- ✅ Deploy to different environments easily

---

## Current Backend URLs

Your hardcoded URL: `https://chyrp-rebuild-clonefest.onrender.com`

Make sure this is still correct! Check your Render dashboard.

---

## Quick Test

After updating, test that environment variables work:

```bash
# Development (local backend)
npm run dev
# Should use: http://localhost:5000

# Production build (Render backend)  
npm run build
# Should use: https://chyrp-rebuild-clonefest.onrender.com
```

---

See `COMPONENT_UPDATE_GUIDE.md` for detailed instructions on updating each file.
