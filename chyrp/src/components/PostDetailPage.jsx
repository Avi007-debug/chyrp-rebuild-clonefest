import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { UserIcon } from './Icons.jsx';

const API_URL = "http://localhost:5000";

const PostDetailPage = ({ postId, setPage }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/posts/${postId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch post'))
            .then(data => {
                setPost(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.toString());
                setLoading(false);
            });
    }, [postId]);

    if (loading) return <div className="text-center p-8">Loading post...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!post) return <div className="text-center p-8">Post not found.</div>;

    return (
        <main className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <div className="prose dark:prose-invert max-w-none mb-4">
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span>
                    Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span>
                </span>
                {typeof post.view_count === 'number' && (
                    <span className="ml-4 text-xs text-gray-400">{post.view_count} views</span>
                )}
            </div>

            {/* Tags section */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags.map((tag) => (
                        <button
                            key={tag}
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full text-xs font-semibold hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors"
                            onClick={() => setPage({ name: 'tag', tag })}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Attribution & License */}
            {post.attribution && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <strong>Attribution:</strong> {post.attribution}
                </p>
            )}

            {post.license && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>License:</strong> {post.license}
                </p>
            )}

            <button
                onClick={() => setPage({ name: 'home' })}
                className="mt-6 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
            >
                Back to Home
            </button>
        </main>
    );
};

export default PostDetailPage;
