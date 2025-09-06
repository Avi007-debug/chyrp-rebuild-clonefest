import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard.jsx';

const API_URL = "http://localhost:5000";

const HomePage = ({ setPage, currentUserId, token, onPostDeleted }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- State for search and pagination ---
    const [tagQuery, setTagQuery] = useState("");
    const [debouncedTagQuery, setDebouncedTagQuery] = useState(tagQuery);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalPosts, setTotalPosts] = useState(0);

    // --- Debounce search input ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTagQuery(tagQuery);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [tagQuery]);

    // --- Reset posts when search query changes ---
    useEffect(() => {
        setPosts([]);
        setCurrentPage(1);
    }, [debouncedTagQuery]);

    // --- Data fetching effect for posts ---
    useEffect(() => {
        // Don't fetch if we're on page > 1 but there are no more pages
        if (currentPage > 1 && !hasMore) return;

        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const { signal } = controller;

        const url = new URL(`${API_URL}/posts`);
        url.searchParams.append('page', currentPage);
        // Use debounced query for fetching
        if (debouncedTagQuery) {
            url.searchParams.append('tag', debouncedTagQuery);
        }

        fetch(url.toString(), { signal })
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch posts'))
            .then(data => {
                setPosts(prevPosts => [...prevPosts, ...data.posts]);
                setHasMore(data.has_more);
                setTotalPosts(data.total_posts);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError(err.toString());
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [currentPage, debouncedTagQuery]);

    // --- Intersection Observer for infinite scroll ---
    const observer = useRef();
    const lastPostElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

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

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Posts</h1>
            </div>

            <div className="mb-6 flex justify-center">
                <input
                    type="text"
                    className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Search posts by tag..."
                    value={tagQuery}
                    onChange={e => setTagQuery(e.target.value)}
                />
            </div>

            {debouncedTagQuery && !loading && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    Found {totalPosts} post{totalPosts !== 1 ? 's' : ''} with tag "{debouncedTagQuery}"
                </div>
            )}

            {posts.length > 0 && (
                <div className="space-y-6">
                    {posts.map((post, index) => {
                        const isLastElement = posts.length === index + 1;
                        return (
                            <div ref={isLastElement ? lastPostElementRef : null} key={post.id}>
                                <PostCard 
                                    post={post} 
                                    currentUserId={currentUserId} 
                                    setPage={setPage}
                                    onDelete={handleDeletePost}
                                    token={token}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {loading && <div className="text-center p-8">Loading posts...</div>}
            
            {!loading && posts.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {debouncedTagQuery ? `No posts found for tag "${debouncedTagQuery}"` : 'No posts yet. Be the first to post!'}
                </div>
            )}

            {!loading && !hasMore && posts.length > 0 && (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">You've reached the end!</div>
            )}

            {error && <div className="text-center p-8 text-red-500">Error: {error}</div>}
        </main>
    );
};

export default HomePage;