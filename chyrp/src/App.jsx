import React, { useState, useEffect } from 'react';
import PostCard from "./PostCard";

import './App.css';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch a list of posts from the Flask backend at the /posts endpoint
    fetch("http://localhost:5000/posts")
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
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

  if (loading) {
    return <div className="text-center p-8">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between">
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
        {posts.length > 0 ? (
          posts.map((post, index) => <PostCard key={index} post={post} />)
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">No posts found.</div>
        )}
      </main>
    </div>
  );
}