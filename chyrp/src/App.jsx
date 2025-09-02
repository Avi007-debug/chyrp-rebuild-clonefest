import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// --- Helper function to decode JWT token ---
// This helps us get the logged-in user's ID on the frontend
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


// --- Reusable SVG Icons ---
const LinkIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block h-4 w-4 mr-2 text-gray-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg> );
const UserIcon = ({ className = "h-5 w-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );
const AtSignIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg> );
const LockKeyholeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="16" r="1"></circle><rect x="3" y="10" width="18" height="12" rx="2"></rect><path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg> );
const ChevronDownIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg> );
const SunIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> );
const MoonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> );
const PlusCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);


// --- API URL Configuration ---
const API_URL = "http://localhost:5000";


// ====================================================================
// --- Child Components for Different "Pages" ---
// ====================================================================

const HomePage = ({ setPage, currentUserId, token, onPostDeleted }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = () => {
            fetch(`${API_URL}/posts`)
                .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch posts'))
                .then(data => {
                    setPosts(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.toString());
                    setLoading(false);
                });
        };
        fetchPosts();
    }, []);

    const handleDeletePost = (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
                if (!res.ok) return res.json().then(err => Promise.reject(err));
                return res.json();
            })
            .then(() => {
                setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
                onPostDeleted();
            })
            .catch(err => alert(`Error: ${err.message || 'Could not delete post.'}`));
        }
    };

    if (loading) return <div className="text-center p-8">Loading posts...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-8">
            {posts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUserId={currentUserId} 
                    setPage={setPage}
                    onDelete={handleDeletePost}
                />
            ))}
        </main>
    );
};

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
                    Don't have an account? <button type="button" onClick={() => setPage({ name: 'register' })} className="font-semibold text-pink-600 dark:text-pink-400 hover:underline">Sign Up</button>
                </p>
            </form>
        </div>
    );
};

const RegisterPage = ({ onRegisterSuccess, setPage }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
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
                    Already have an account? <button type="button" onClick={() => setPage({ name: 'login' })} className="font-semibold text-pink-600 dark:text-pink-400 hover:underline">Log In</button>
                </p>
            </form>
        </div>
    );
};

const CreatePostPage = ({ token, setPage }) => {
    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        const postData = {
            type: postType,
            title: title.trim(),
            content: content.trim(),
        };
        fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        })
        .then(res => {
            if (res.status === 401) throw new Error('Unauthorized. Please log in again.');
            if (!res.ok) return res.json().then(err => { throw new Error(err.message || 'Failed to create post') });
            return res.json();
        })
        .then(data => {
            setSuccess('Post created successfully!');
            setTitle('');
            setContent('');
            setTimeout(() => setPage({ name: 'home' }), 1500);
        })
        .catch(err => {
            setError(err.message);
        });
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200">Create a New Post</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 p-3 rounded text-center text-sm">{success}</p>}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-title">Title</label>
                    <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your Post Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <input type="hidden" value={postType} />
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-content">Content (Markdown supported)</label>
                    <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write something amazing..." rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                    Publish Post
                </button>
            </form>
        </div>
    );
};

const EditPostPage = ({ token, setPage, postId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/posts`)
            .then(res => res.json())
            .then(posts => {
                const postToEdit = posts.find(p => p.id === postId);
                if (postToEdit) {
                    setTitle(postToEdit.title);
                    setContent(postToEdit.content);
                } else {
                    setError("Post not found.");
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch post data.");
                setLoading(false);
            });
    }, [postId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, content })
        })
        .then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
        })
        .then(() => {
            setSuccess('Post updated successfully!');
            setTimeout(() => setPage({ name: 'home' }), 1500);
        })
        .catch(err => setError(err.message || 'Failed to update post.'));
    };
    
    if (loading) return <div className="text-center p-8">Loading post for editing...</div>;

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
             <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200">Edit Post</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 p-3 rounded text-center text-sm">{success}</p>}
                
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-title">Title</label>
                    <input id="edit-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-content">Content (Markdown supported)</label>
                    <textarea id="edit-content" value={content} onChange={e => setContent(e.target.value)} rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"></textarea>
                </div>
                
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-lg">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

const PostCard = ({ post, currentUserId, setPage, onDelete }) => {
    const isAuthor = post.user_id === currentUserId;

    const renderPostContent = () => {
        switch (post.type) {
            case 'text':
                return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        </div>
                    </div>
                );
            case 'photo':
                return (
                    <div>
                        <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover"/>
                        <div className="p-6"><h2 className="text-xl font-bold">{post.title}</h2></div>
                    </div>
                );
            case 'quote':
                return (
                    <div className="p-8 bg-pink-50 dark:bg-pink-900/20">
                        <blockquote className="text-2xl font-serif italic text-center">“{post.quote_text}”</blockquote>
                        <cite className="block text-right mt-4 not-italic">— {post.quote_author}</cite>
                    </div>
                );
            case 'link':
                return (
                    <div className="p-6">
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xl font-semibold text-pink-600 hover:underline">
                            <LinkIcon />{post.title}
                        </a>
                    </div>
                );
            default:
                return <div className="p-6 text-red-500">Unknown post type</div>;
        }
    };

    return (
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-transparent hover:border-pink-500/30">
            {renderPostContent()}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <UserIcon className="h-5 w-5 text-gray-400"/>
                    <span className="ml-2">Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span></span>
                </div>
                {isAuthor && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setPage({ name: 'edit-post', postId: post.id })} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors">
                            <EditIcon />
                        </button>
                        <button onClick={() => onDelete(post.id)} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 transition-colors">
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
};


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

    const navigate = (pageName) => {
        setPage({ name: pageName });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl z-20 py-1 border dark:border-gray-700">
                    {token ? (
                        <>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('create-post'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">New Post</a>
                            <hr className="border-gray-200 dark:border-gray-700" />
                            <button onClick={() => {handleLogout(); setIsOpen(false);}} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                        </>
                    ) : (
                        <>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Login</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('register'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Register</a>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const ThemeToggle = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};


// ====================================================================
// --- Main App Component (Major Update for Routing and User State) ---
// ====================================================================
export default function App() {
  // Routing state is now an object to handle pages with parameters (like postId)
  const [page, setPage] = useState({ name: 'home' });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Get the current user's ID from the token
  const decodedToken = parseJwt(token);
  const currentUserId = decodedToken ? parseInt(decodedToken.sub) : null;

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

  const renderPage = () => {
    switch (page.name) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} />;
      case 'register':
        return <RegisterPage onRegisterSuccess={() => setPage({ name: 'login' })} setPage={setPage} />;
      case 'create-post':
        if (!token) return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={rehydratePage} />;
        return <CreatePostPage token={token} setPage={setPage} />;
      case 'edit-post':
        if (!token) return <LoginPage onLoginSuccess={handleLoginSuccess} setPage={setPage} />;
        return <EditPostPage token={token} setPage={setPage} postId={page.postId} />;
      default:
        return <HomePage setPage={setPage} currentUserId={currentUserId} token={token} onPostDeleted={() => setPage({ name: 'home' })} />;
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

