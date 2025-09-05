import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';

const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";


const TagPage = ({ tagName, setPage, currentUserId, token }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tagName) return;

        // Fetch posts for the specific tag
        fetch(`${API_URL}/posts/tag/${tagName}`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch posts for this tag.'))
            .then(data => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.toString());
                setLoading(false);
            });
    }, [tagName]);

    const handleDeletePost = (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(() => {
                setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
                alert("Post deleted successfully.");
            })
            .catch(err => alert(`Error: ${err.message || 'Could not delete post.'}`));
        }
    };

    if (loading) return <div className="text-center p-8">Loading posts tagged with "{tagName}"...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 border-b-2 border-pink-500 pb-2">
                Posts tagged with <span className="text-pink-600 dark:text-pink-400">#{tagName}</span>
            </h1>
            {posts.length > 0 ? (
                posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={currentUserId} 
                        setPage={setPage}
                        onDelete={handleDeletePost}
                        token={token}
                    />
                ))
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">No posts found with this tag.</div>
            )}
        </main>
    );
};

export default TagPage;
