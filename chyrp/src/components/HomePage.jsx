import React, { useState, useEffect } from 'react';
import PostCard from './PostCard.jsx'; // Corrected the import path

const API_URL = "http://localhost:5000";

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
                // Reloading is a simple way to ensure UI consistency after delete
                window.location.reload(); 
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
                    // --- THIS IS THE FIX ---
                    // We now correctly pass the token down to each PostCard
                    token={token}
                />
            ))}
        </main>
    );
};

export default HomePage;

