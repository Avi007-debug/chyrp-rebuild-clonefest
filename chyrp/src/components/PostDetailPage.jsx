import React, { useEffect, useState } from 'react';
import { UserIcon, TagIcon } from './Icons';
import MediaRenderer from './MediaRenderer';
import CommentSection from './CommentSection';
import LikeButton from './LikeButton';
import MarkdownRenderer from './MarkdownRenderer';
import WebmentionList from './WebmentionList';
import { Helmet } from 'react-helmet-async';

const API_URL = "http://localhost:5000";

const PostDetailPage = ({ postId, setPage, currentUserId, token }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;  // For cleanup
        
        const fetchPost = async () => {
            if (!postId) {
                if (isMounted) {
                    setError("No post ID provided.");
                    setLoading(false);
                }
                return;
            }

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };

                const response = await fetch(`${API_URL}/posts/${postId}?_=${Date.now()}`, {
                    method: 'GET',
                    headers,
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch post');
                }

                const data = await response.json();
                
                if (isMounted) {
                    setPost(data);
                    setLoading(false);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching post:', err);
                if (isMounted) {
                    setError(err.toString());
                    setLoading(false);
                }
            }
        };

        setLoading(true);  // Reset loading state on each postId change
        fetchPost();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [postId, token]);

    if (loading) return <div className="text-center p-8">Loading post...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!post) return <div className="text-center p-8">Post not found.</div>;

    return (
        <div>
            <Helmet>
                <title>{post.title} - Chyrp Lite</title>
                <link 
                    rel="webmention" 
                    href={`${API_URL}/webmention`} 
                />
                {/* Add canonical URL for webmentions to properly target */}
                <link 
                    rel="canonical" 
                    href={`${window.location.origin}/posts/${postId}`}
                />
            </Helmet>
            <main className="max-w-3xl mx-auto p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-pink-500 pb-4">{post.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="ml-2">Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span></span>
                </div>
                {typeof post.view_count === 'number' && (
                    <span>{post.view_count} views</span>
                )}
                {post.category_name && (
                    <button 
                        onClick={() => setPage({ name: 'category', categorySlug: post.category_slug })}
                        className="ml-4 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        {post.category_name}
                    </button>
                )}
            </div>
            
            {/* Media Gallery for multiple files, or single media renderer */}
            {post.media_urls && post.media_urls.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {post.media_urls.map(url => (
                        <MediaRenderer key={url} post={{...post, image_url: url}} />
                    ))}
                </div>
            ) : (
                <MediaRenderer post={post} />
            )}

            <div className="prose dark:prose-invert max-w-none mt-4 text-lg">
                {post.type === 'text' && <MarkdownRenderer content={post.content} />}
            </div>

            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <TagIcon />
                    {post.tags.map((tag) => (
                        <button
                            key={tag}
                            className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-sm font-semibold hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors"
                            onClick={() => setPage({ name: 'tag', tagName: tag })}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
            
            <hr className="dark:border-gray-700" />

            {/* Integrate comments and likes here */}
            <div className="pt-4">
                <CommentSection postId={postId} token={token} currentUserId={currentUserId} />
            </div>

            <div className="mt-8 pt-8 border-t dark:border-gray-700">
                <WebmentionList postId={postId} />
            </div>

            <button onClick={() => setPage({ name: 'home' })} className="mt-8 px-6 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors shadow-md">
                &larr; Back to Home
            </button>
        </main>
        </div>
    );
};

export default PostDetailPage;