import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';

const API_URL = "http://localhost:5000";

const CategoryPage = ({ categorySlug, setPage, currentUserId, token }) => {
    const [posts, setPosts] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!categorySlug) return;

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`${API_URL}/posts/category/${categorySlug}`, { headers })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) return Promise.reject('Category not found.');
                    return Promise.reject('Failed to fetch posts for this category.');
                }
                return res.json();
            })
            .then(data => {
                setPosts(data.posts);
                setCategoryName(data.category_name);
                setLoading(false);
            })
            .catch(err => {
                setError(err.toString());
                setLoading(false);
            });
    }, [categorySlug, token]);

    const handleDeletePost = (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(() => {
                setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
            })
            .catch(err => alert(`Error: ${err.message || 'Could not delete post.'}`));
        }
    };

    if (loading) return <div className="text-center p-8">Loading posts in "{categorySlug}"...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 border-b-2 border-pink-500 pb-2">
                Posts in <span className="text-pink-600 dark:text-pink-400">{categoryName}</span>
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
                <div className="text-center text-gray-500 dark:text-gray-400">No posts found in this category.</div>
            )}
        </main>
    );
};

export default CategoryPage;