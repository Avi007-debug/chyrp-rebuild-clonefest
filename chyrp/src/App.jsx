import React, { useState, useEffect } from 'react';

// Correctly import all the components from their new files
import HomePage from './components/HomePage.jsx';
import LoginPage from './components/LoginPage.jsx';
import RegisterPage from './components/RegisterPage.jsx';
import CreatePostPage from './components/CreatePostPage.jsx';
import EditPostPage from './components/EditPostPage.jsx';
import PostDetailPage from './components/PostDetailPage.jsx';
import TagPage from './components/TagPage.jsx';
import CategoryPage from './components/CategoryPage.jsx';
import ProfileDropdown from './components/ProfileDropdown.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { PlusCircleIcon } from './components/Icons.jsx';

// --- Helper function to decode JWT token ---
function parseJwt(token) {
    if (!token) { return null; }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error parsing JWT token:", e);
        return null;
    }
}

// ====================================================================
// --- Main App Component (Now Much Cleaner!) ---
// ====================================================================
export default function App() {
  // Routing state is now an object to handle pages with parameters (like postId)
  const [page, setPage] = useState({ name: 'home' });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Get the current user's ID from the token's 'sub' (subject) claim
  const decodedToken = parseJwt(token);
  const currentUserId = decodedToken ? parseInt(decodedToken.sub) : null;

  // Effect to apply the theme class to the root HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setPage({ name: 'home' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPage({ name: 'home' });
  };

  // The "Router" for our application
  const renderPage = () => {
    switch (page.name) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} />;
      case 'register':
        return <RegisterPage onRegisterSuccess={() => setPage({ name: 'login' })} setPage={setPage} />;
      case 'create-post':
        if (!token) return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} />;
        return <CreatePostPage token={token} setPage={setPage} />;
      case 'edit-post':
        if (!token) return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} />;
        return <EditPostPage token={token} setPage={setPage} postId={page.postId} />;
      case 'post-detail':
        return <PostDetailPage postId={page.postId} setPage={setPage} token={token} currentUserId={currentUserId} />;
      case 'tag':
        return <TagPage tagName={page.tagName} setPage={setPage} token={token} currentUserId={currentUserId} />;
      case 'category':
        return <CategoryPage categorySlug={page.categorySlug} setPage={setPage} token={token} currentUserId={currentUserId} />;
      default:
        return <HomePage 
                    setPage={setPage} 
                    currentUserId={currentUserId} 
                    token={token} 
                    onPostDeleted={() => window.location.reload()} // Reload page on delete for simplicity
                />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-400 cursor-pointer" onClick={() => setPage({ name: 'home' })}>
          Chyrp Lite
        </h1>
        <nav className="flex items-center space-x-4">
          <a href="#" className="text-gray-700 font-medium dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hidden sm:block" onClick={(e) => { e.preventDefault(); setPage({ name: 'home' }); }}>Home</a>
          {token && <button onClick={() => setPage({ name: 'create-post' })} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors sm:hidden"><PlusCircleIcon /></button> }
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <ProfileDropdown token={token} setPage={setPage} handleLogout={handleLogout} />
        </nav>
      </header>
      
      {renderPage()}
    </div>
  );
}
