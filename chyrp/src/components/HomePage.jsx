import React, { useState, useEffect } from 'react';
import PostCard from './PostCard.jsx';

const API_URL = "http://localhost:5000";

const HomePage = ({ setPage, currentUserId, token, onPostDeleted }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tagQuery, setTagQuery] = useState("");
    const [filteredPosts, setFilteredPosts] = useState([]);

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

    useEffect(() => {
        if (!tagQuery.trim()) {
            setFilteredPosts(posts);
        } else {
            setFilteredPosts(
                posts.filter(post =>
                    post.tags && post.tags.some(tag => 
                        tag.toLowerCase().includes(tagQuery.toLowerCase())
                    )
                )
            );
        }
    }, [tagQuery, posts]);

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
                // Update the posts state instead of reloading the page
                setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
                if (onPostDeleted) {
                    onPostDeleted(postId);
                }
            })
            .catch(err => alert(`Error: ${err.message || 'Could not delete post.'}`));
        }
    };

    if (loading) return <div className="text-center p-8">Loading posts...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-8">
            {/* Header with search only - Create Post button removed */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Posts</h1>
                {/* Create Post button removed from home page */}
            </div>

            {/* Tag search bar */}
            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Search posts by tag..."
                    value={tagQuery}
                    onChange={e => setTagQuery(e.target.value)}
                />
            </div>

            {/* Post counter */}
            {tagQuery && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    Found {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} with tag "{tagQuery}"
                </div>
            )}

            {/* Posts list */}
            {filteredPosts.length === 0 && !loading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {tagQuery ? `No posts found for tag "${tagQuery}"` : 'No posts yet. Be the first to post!'}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredPosts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            currentUserId={currentUserId} 
                            setPage={setPage}
                            onDelete={handleDeletePost}
                            token={token}
                        />
                    ))}
                </div>
            )}
        </main>
    );
};

export default HomePage;