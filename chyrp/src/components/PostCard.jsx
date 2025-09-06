import React, { useState } from 'react';
import { LinkIcon, UserIcon, EditIcon, TrashIcon, MessageCircleIcon, ExternalLinkIcon } from './Icons.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import CommentSection from './CommentSection.jsx';
import LikeButton from './LikeButton.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';

const PostCard = ({ post, currentUserId, setPage, onDelete, token }) => {
    const isAuthor = currentUserId && post.user_id === currentUserId;
    const [showComments, setShowComments] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleReadMore = () => setIsExpanded(!isExpanded);

    const getDomainFromUrl = (url) => {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain;
        } catch (e) {
            return url;
        }
    };

    const handleViewPost = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPage({ 
            name: 'post-detail', 
            postId: post.id
        });
    };
    
    const handleCommentClick = () => {
        if (!token) {
            setShowLoginPrompt(true);
            setTimeout(() => setShowLoginPrompt(false), 3000);
            return;
        }
        setShowComments(!showComments);
    };

    const renderPostContent = () => {
        switch (post.type) {
            case 'photo':
            case 'video':
            case 'audio':
                return (
                    <div>
                        <MediaRenderer post={post} />
                        <div className="p-6">
                            <h2 className="text-xl font-bold cursor-pointer hover:text-pink-600" onClick={handleViewPost}>{post.title}</h2>
                            {post.content && (
                                <div className="prose dark:prose-invert max-w-none mt-2">
                                    {post.content.length > 300 && !isExpanded ? (
                                        <>
                                            <MarkdownRenderer content={post.content.slice(0, 300) + "..."} />
                                            <button
                                                onClick={toggleReadMore}
                                                className="text-pink-600 font-bold ml-1 hover:underline"
                                            >
                                                Read More
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <MarkdownRenderer content={post.content} />
                                            {post.content.length > 300 && (
                                                <button
                                                    onClick={toggleReadMore}
                                                    className="text-pink-600 font-bold ml-1 hover:underline"
                                                >
                                                    Read Less
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'quote':
                const contentParts = (post.content || '').split('\n— ');
                const quoteText = contentParts[0] || '';
                const quoteAuthor = contentParts[1] || 'Unknown';
                return (
                    <div className="p-8 bg-pink-50 dark:bg-pink-900/20 cursor-pointer" onClick={handleViewPost}>
                        {post.title && <h2 className="text-xl font-bold mb-4 text-center">{post.title}</h2>}
                        <blockquote className="text-2xl font-serif italic text-center">"{quoteText}"</blockquote>
                        <cite className="block text-right mt-4 not-italic">— {quoteAuthor}</cite>
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
                                <div className="flex-shrink-0 mt-1 text-pink-500"><LinkIcon /></div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{post.title}</h3>
                                    {post.content && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{post.content}</p>
                                    )}
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                                        <span className="truncate">{getDomainFromUrl(post.link_url)}</span>
                                        <ExternalLinkIcon className="w-3 h-3 inline-block text-gray-400 dark:text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                );
            case 'text':
            default:
                return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2 cursor-pointer hover:text-pink-600" onClick={handleViewPost}>{post.title}</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            {post.content.length > 300 && !isExpanded ? (
                                <>
                                    <MarkdownRenderer content={post.content.slice(0, 300) + "..."} />
                                    <button
                                        onClick={toggleReadMore}
                                        className="text-pink-600 font-bold ml-1 hover:underline"
                                    >
                                        Read More
                                    </button>
                                </>
                            ) : (
                                <>
                                    <MarkdownRenderer content={post.content} />
                                    {post.content.length > 300 && (
                                        <button
                                            onClick={toggleReadMore}
                                            className="text-pink-600 font-bold ml-1 hover:underline"
                                        >
                                            Read Less
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-transparent hover:border-pink-500/30">
            {renderPostContent()}

            <div className="px-6 pt-2 pb-4 flex flex-wrap gap-2 items-center">
                {post.category_name && (
                    <button 
                        onClick={() => setPage({ name: 'category', categorySlug: post.category_slug })}
                        className="font-bold text-xs uppercase text-pink-600 bg-pink-100 dark:bg-pink-900/50 px-2 py-1 rounded hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors"
                    >
                        {post.category_name}
                    </button>
                )}
                {post.tags && post.tags.map((tag) => (
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

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                    <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400"/>
                        <span className="ml-2">
                            Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span>
                        </span>
                    </div>
                    {typeof post.view_count === 'number' && (
                        <span className="ml-4 text-xs text-gray-400">{post.view_count} views</span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <LikeButton 
                        postId={post.id}
                        initialLikeCount={post.like_count}
                        initialLikedByUser={post.liked_by_user}
                        token={token}
                    />
                    <button onClick={handleCommentClick} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-green-600 transition-colors" aria-label="Toggle comments">
                        <MessageCircleIcon />
                    </button>
                    {isAuthor && (
                        <>
                            <button onClick={() => setPage({ name: 'edit-post', postId: post.id })} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors" aria-label="Edit post">
                                <EditIcon />
                            </button>
                            <button onClick={() => onDelete(post.id)} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 transition-colors" aria-label="Delete post">
                                <TrashIcon />
                            </button>
                        </>
                    )}
                     <button onClick={handleViewPost} className="p-2 rounded-md text-pink-600 bg-pink-100 hover:bg-pink-200 font-bold transition-colors text-xs">
                         View
                     </button>
                </div>
            </div>

            {showLoginPrompt && (
                <div className="px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 border-t border-yellow-300 dark:border-yellow-700">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        Please <button onClick={() => setPage({ name: 'login' })} className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-100">log in</button> to view and post comments.
                    </p>
                </div>
            )}

            {showComments && token && (
                <CommentSection postId={post.id} token={token} currentUserId={currentUserId} />
            )}
        </article>
    );
};

export default PostCard;
