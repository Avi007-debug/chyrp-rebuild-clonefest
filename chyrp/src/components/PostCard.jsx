import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { LinkIcon, UserIcon, EditIcon, TrashIcon, MessageCircleIcon } from './Icons.jsx';
import CommentSection from './CommentSection.jsx';
import LikeButton from './LikeButton.jsx';

// Add ExternalLinkIcon directly in this file since it's missing from Icons.jsx
const ExternalLinkIcon = ({ className = "h-3 w-3" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    viewBox="0 0 20 20" 
    fill="currentColor"
  >
    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
  </svg>
);

const PostCard = ({ post, currentUserId, setPage, onDelete, token }) => {
    const isAuthor = currentUserId && post.user_id === currentUserId;
    const [showComments, setShowComments] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Function to extract domain from URL
    const getDomainFromUrl = (url) => {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain;
        } catch (e) {
            return url;
        }
    };

    const handleCommentClick = () => {
        if (!token) {
            setShowLoginPrompt(true);
            // Hide the login prompt after 3 seconds
            setTimeout(() => setShowLoginPrompt(false), 3000);
            return;
        }
        setShowComments(!showComments);
    };

    const renderPostContent = () => {
        switch (post.type) {
            case 'text':
                return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        </div>
                    </div>
                );
            case 'photo':
                return (
                    <div>
                        <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover"/>
                        <div className="p-6"><h2 className="text-xl font-bold">{post.title}</h2></div>
                    </div>
                );
            case 'quote':
                return (
                    <div className="p-8 bg-pink-50 dark:bg-pink-900/20">
                        <blockquote className="text-2xl font-serif italic text-center">"{post.quote_text}"</blockquote>
                        <cite className="block text-right mt-4 not-italic">— {post.quote_author || 'Unknown'}</cite>
                    </div>
                );
            case 'link':
                return (
                    <div className="p-6">
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
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                        {post.title}
                                    </h3>
                                    {post.content && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                                            {post.content}
                                        </p>
                                    )}
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                        <span className="truncate">{getDomainFromUrl(post.link_url)}</span>
                                        <ExternalLinkIcon className="ml-1" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                );
            default:
                return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        </div>
                    </div>
                );
        }
    };

    return (
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-transparent hover:border-pink-500/30">
            {renderPostContent()}

            {/* Tags section with oval and bold design */}
            {post.tags && post.tags.length > 0 && (
                <div className="px-6 py-2">
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-4 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 border border-pink-300 text-pink-700 dark:text-pink-200 text-sm font-bold shadow-md hover:bg-pink-200 transition-colors duration-150 cursor-pointer"
                                style={{ boxShadow: '0 2px 8px rgba(60,64,67,.10)' }}
                                onClick={() => setPage({ name: 'tag', tagName: tag })}
                            >
                                <span className="mr-1 text-pink-500 font-bold">#</span>
                                <span className="font-bold">{tag}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                    <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400"/>
                        <span className="ml-2">
                            Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span>
                        </span>
                    </div>
                    {/* Post views */}
                    {typeof post.view_count === 'number' && (
                        <span className="ml-4 text-xs text-gray-400">{post.view_count} views</span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {/* Like button visible to everyone */}
                    <LikeButton 
                        postId={post.id}
                        initialLikeCount={post.like_count}
                        initialLikedByUser={post.liked_by_user}
                        token={token}
                    />

                    {/* Comment button visible to everyone */}
                    <button 
                        onClick={handleCommentClick} 
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-green-600 transition-colors"
                        aria-label="Toggle comments"
                    >
                        <MessageCircleIcon />
                    </button>

                    {/* Edit and Delete buttons only for author */}
                    {isAuthor && (
                        <>
                            <button 
                                onClick={() => setPage({ name: 'edit-post', postId: post.id })} 
                                className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors"
                                aria-label="Edit post"
                            >
                                <EditIcon />
                            </button>
                            <button 
                                onClick={() => onDelete(post.id)} 
                                className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 transition-colors"
                                aria-label="Delete post"
                            >
                                <TrashIcon />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Login prompt for non-authenticated users */}
            {showLoginPrompt && (
                <div className="px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 border-t border-yellow-300 dark:border-yellow-700">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        Please <button onClick={() => setPage({ name: 'login' })} className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-100">log in</button> to view and post comments.
                    </p>
                </div>
            )}

            {/* Comment section - Only show if user is authenticated */}
            {showComments && token && (
                <CommentSection 
                    postId={post.id} 
                    token={token} 
                    currentUserId={currentUserId} 
                />
            )}
        </article>
    );
};

export default PostCard;