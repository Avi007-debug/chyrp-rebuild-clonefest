import React, { useState, useEffect } from 'react';

// --- Reusable SVG Icons ---
// Using inline SVGs avoids extra network requests and makes them easy to style.
const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block h-4 w-4 mr-2 text-gray-400">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
  </svg>
);

// --- PostCard Component ---
// This component is now inside the same file.
// It dynamically renders different content based on the post's 'type'.
const PostCard = ({ post }) => {
  // Common card styling
  const cardBaseStyle = "bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl";

  const renderPostContent = () => {
    switch (post.type) {
      case 'text':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{post.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{post.content}</p>
          </div>
        );
      case 'photo':
        return (
          <div>
            <img src={post.image_url} alt={post.title || 'Blog post image'} className="w-full h-auto object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/222/FFF?text=Image+Not+Found'; }} />
            {post.title && <h2 className="text-xl font-bold p-6 pb-0 text-gray-800 dark:text-gray-200">{post.title}</h2>}
          </div>
        );
      case 'quote':
        return (
          <div className="p-8 bg-pink-50 dark:bg-pink-900/20">
            <blockquote className="text-2xl font-serif italic text-center text-gray-700 dark:text-gray-300">
              “{post.quote_text}”
            </blockquote>
            <cite className="block text-right mt-4 text-gray-500 dark:text-gray-400">— {post.quote_author}</cite>
          </div>
        );
      case 'link':
        return (
          <div className="p-6">
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xl font-semibold text-pink-600 dark:text-pink-400 hover:underline">
              <LinkIcon />
              {post.title}
            </a>
          </div>
        );
      default:
        return <div className="p-6 text-red-500">Unknown post type: {post.type}</div>;
    }
  };

  return <article className={cardBaseStyle}>{renderPostContent()}</article>;
};


// --- Main App Component ---
export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch a list of posts from the Flask backend at the /posts endpoint
    fetch("http://localhost:5000/posts")
      .then(res => {
        if (!res.ok) {
          // Try to get a more specific error from the backend response
          return res.json().then(err => { throw new Error(err.message || 'Network response was not ok'); });
        }
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Fetch error:", error);
        setError(error);
        setLoading(false);
      });
  }, []); // Empty dependency array means this effect runs once on mount

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading posts...</div>;
    }

    if (error) {
      return <div className="text-center p-8 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg"><strong>Error:</strong> {error.message}</div>;
    }

    if (posts.length > 0) {
      return posts.map((post) => <PostCard key={post.id} post={post} />);
    }

    return <div className="text-center text-gray-500 dark:text-gray-400">No posts found.</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
          Chyrp Lite
        </h1>
        <nav className="space-x-4">
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-pink-600 transition-colors duration-200">Home</a>
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-pink-600 transition-colors duration-200">About</a>
          <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-pink-600 transition-colors duration-200">Contact</a>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-8">
        {renderContent()}
      </main>
    </div>
  );
}
