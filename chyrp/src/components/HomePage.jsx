import React, { useState, useEffect } from 'react';
import PostCard from './PostCard.jsx';

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
                onPostDeleted();
            })
            .catch(err => alert(`Error: ${err.message || 'Could not delete post.'}`));
        }
    };

    if (loading) return <div className="text-center p-8">Loading posts...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-8">
            {posts.length > 0 ? (
                 posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={currentUserId} 
                        setPage={setPage}
                        onDelete={handleDeletePost}
                    />
                ))
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">No posts found.</div>
            )}
        </main>
    );
};

export default HomePage;

