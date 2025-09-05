import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { UserIcon, LinkIcon, ExternalLinkIcon } from './Icons.jsx';

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

    // Function to extract domain from URL
    const getDomainFromUrl = (url) => {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain;
        } catch (e) {
            return url;
        }
    };

    if (loading) return <div className="text-center p-8">Loading post...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!post) return <div className="text-center p-8">Post not found.</div>;

    return (
        <main className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Post Type Display */}
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                {post.type} post
            </div>
            
            {/* Post Title */}
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            
            {/* Link Post Content */}
            {post.type === 'link' && post.link_url && (
                <div className="mb-6">
                    <a 
                        href={post.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1 text-pink-500">
                                <LinkIcon />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                    {post.title}
                                </h3>
                                {post.content && (
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                        {post.content}
                                    </p>
                                )}
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span className="truncate">{getDomainFromUrl(post.link_url)}</span>
                                    <ExternalLinkIcon className="ml-1 h-3 w-3" />
                                </div>
                            </div>
                        </div>
                    </a>
                    <div className="mt-2 text-xs text-gray-500">
                        Click the card above to visit the linked website
                    </div>
                </div>
            )}
            
            {/* Regular Post Content */}
            {post.type !== 'link' && post.content && (
                <div className="prose dark:prose-invert max-w-none mb-4">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
            )}
            
            {/* Post Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span>Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span></span>
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
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-sm font-semibold hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors"
                            onClick={() => setPage({ name: 'tag', tagName: tag })}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
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