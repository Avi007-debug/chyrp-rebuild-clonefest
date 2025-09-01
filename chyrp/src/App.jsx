import React, { useState, useEffect, useRef } from 'react';

// --- Reusable SVG Icons ---
const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block h-4 w-4 mr-2 text-gray-400">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
  </svg>
);
const UserIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const AtSignIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>);
const LockKeyholeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="16" r="1"></circle><rect x="3" y="10" width="18" height="12" rx="2"></rect><path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg>);
const ChevronDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>);


// --- API URL Configuration ---
const API_URL = "http://localhost:5000";

// ====================================================================
// --- Child Components for Different "Pages" ---
// ====================================================================

// --- Home Page Component ---
const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/posts`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center p-8">Loading posts...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error.message}</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      {posts.length > 0 ? (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">No posts found.</div>
      )}
    </main>
  );
};


// --- Login Page Component ---
const LoginPage = ({ onLoginSuccess, setPage }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => onLoginSuccess(data.access_token))
        .catch(err => setError(err.message || 'Login failed'));
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Welcome Back</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm">{error}</p>}
                <div className="mb-4 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><UserIcon className="h-5 w-5"/></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                </div>
                <div className="mb-6 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><LockKeyholeIcon /></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                </div>
                <div className="flex items-center justify-between">
                    <button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-all duration-300 transform hover:scale-105" type="submit">
                        Sign In
                    </button>
                </div>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Don't have an account? <button type="button" onClick={() => setPage('register')} className="font-semibold text-pink-600 dark:text-pink-400 hover:underline">Sign Up</button>
                </p>
            </form>
        </div>
    );
};

// --- Register Page Component ---
const RegisterPage = ({ onRegisterSuccess, setPage }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => {
            setSuccess(data.message + ". Please log in.");
            onRegisterSuccess();
        })
        .catch(err => setError(err.message || 'Registration failed'));
    };

     return (
        <div className="max-w-md mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Create Account</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center text-sm">{success}</p>}
                <div className="mb-4 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><UserIcon className="h-5 w-5"/></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="username-reg" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                </div>
                <div className="mb-4 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><AtSignIcon /></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="email-reg" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required />
                </div>
                <div className="mb-6 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><LockKeyholeIcon /></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="password-reg" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                </div>
                <div className="flex items-center justify-between">
                    <button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-all duration-300 transform hover:scale-105" type="submit">
                        Register
                    </button>
                </div>
                 <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Already have an account? <button type="button" onClick={() => setPage('login')} className="font-semibold text-pink-600 dark:text-pink-400 hover:underline">Log In</button>
                </p>
            </form>
        </div>
    );
};


// --- PostCard Component ---
const PostCard = ({ post }) => {
  const cardBaseStyle = "bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-transparent hover:border-pink-500/30";

  const renderPostContent = () => {
    switch (post.type) {
      case 'text':
        return <div className="p-6"><h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{post.title}</h2><p className="text-gray-600 dark:text-gray-400">{post.content}</p></div>;
      case 'photo':
        return <div><img src={post.image_url} alt={post.title || 'Blog image'} className="w-full h-auto object-cover"/><div className="p-6"><h2 className="text-xl font-bold">{post.title}</h2></div></div>;
      case 'quote':
        return <div className="p-8 bg-pink-50 dark:bg-pink-900/20"><blockquote className="text-2xl font-serif italic text-center">“{post.quote_text}”</blockquote><cite className="block text-right mt-4 not-italic">— {post.quote_author}</cite></div>;
      case 'link':
        return <div className="p-6"><a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xl font-semibold text-pink-600 hover:underline"><LinkIcon />{post.title}</a></div>;
      default:
        return <div className="p-6 text-red-500">Unknown post type: {post.type}</div>;
    }
  };

  return (
    <article className={cardBaseStyle}>
        {renderPostContent()}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <UserIcon className="h-5 w-5 text-gray-400"/>
                <span className="ml-2">Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span></span>
            </div>
        </div>
    </article>
  );
};

// --- Profile Dropdown Component ---
const ProfileDropdown = ({ token, setPage, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navigate = (page) => {
        setPage(page);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl z-20 py-1 border dark:border-gray-700">
                    {token ? (
                         <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                    ) : (
                        <>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Login</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('register'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Register</a>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}


// ====================================================================
// --- Main App Component (with Routing and State Management) ---
// ====================================================================
export default function App() {
  const [page, setPage] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPage('home');
  };

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} />;
      case 'register':
        return <RegisterPage onRegisterSuccess={() => setPage('login')} setPage={setPage} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-400 cursor-pointer" onClick={() => setPage('home')}>
          Chyrp Lite
        </h1>
        <nav className="flex items-center space-x-4">
          <a href="#" className="text-gray-700 font-medium dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400" onClick={(e) => { e.preventDefault(); setPage('home'); }}>Home</a>
          <ProfileDropdown token={token} setPage={setPage} handleLogout={handleLogout} />
        </nav>
      </header>
      
      {renderPage()}
    </div>
  );
}

