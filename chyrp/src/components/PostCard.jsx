import React, { useState } from 'react';
import { LinkIcon, UserIcon, EditIcon, TrashIcon, MessageCircleIcon, ExternalLinkIcon } from './Icons.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import CommentSection from './CommentSection.jsx';
import LikeButton from './LikeButton.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import Lightbox from './Lightbox.jsx';
import './PostCard.css'; // Import the CSS file

const PostCard = ({ post, currentUserId, setPage, onDelete, token }) => {
    const isAuthor = currentUserId && post.user_id === currentUserId;
    const [showComments, setShowComments] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState({ url: '', type: '' });

    const toggleReadMore = () => setIsExpanded(!isExpanded);

    const openLightbox = (url, type) => {
        setLightboxMedia({ url, type });
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

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

    // Function to extract images from post content
    const extractImages = (content) => {
        if (!content) return [];
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        const images = [];
        let match;
        
        while ((match = imgRegex.exec(content)) !== null) {
            images.push(match[1]);
        }
        
        return images;
    };

    const renderPostContent = () => {
        const contentImages = extractImages(post.content);
        
        switch (post.type) {
            case 'photo':
            case 'video':
            case 'audio':
                return (
                    <div>
                        <MediaRenderer 
                            post={post} 
                            onClick={() => openLightbox(post.media_url, post.type)} 
                        />
                        <div className="post-content">
                            <h2 className="post-title" onClick={handleViewPost}>{post.title}</h2>
                            {post.content && (
                                <div className="prose dark:prose-invert max-w-none mt-2">
                                    {post.content.length > 300 && !isExpanded ? (
                                        <>
                                            <MarkdownRenderer content={post.content.slice(0, 300) + "..."} />
                                            <button
                                                onClick={toggleReadMore}
                                                className="read-more-button"
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
                                                    className="read-more-button"
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
                    <div className="quote-post" onClick={handleViewPost}>
                        {post.title && <h2 className="text-xl font-bold mb-4 text-center">{post.title}</h2>}
                        <blockquote className="quote-text">"{quoteText}"</blockquote>
                        <cite className="quote-author">— {quoteAuthor}</cite>
                    </div>
                );
            case 'link':
                return (
                    <div className="link-post">
                        <a 
                            href={post.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="link-container"
                        >
                            <div className="flex items-start gap-3">
                                <div className="link-icon"><LinkIcon /></div>
                                <div className="link-content">
                                    <h3 className="link-title">{post.title}</h3>
                                    {post.content && (
                                        <p className="link-description">{post.content}</p>
                                    )}
                                    <div className="link-domain">
                                        <span className="truncate">{getDomainFromUrl(post.link_url)}</span>
                                        <ExternalLinkIcon className="external-link-icon" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                );
            case 'text':
            default:
                return (
                    <div className="post-content">
                        <h2 className="post-title" onClick={handleViewPost}>{post.title}</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            {post.content && post.content.length > 300 && !isExpanded ? (
                                <>
                                    <MarkdownRenderer content={post.content.slice(0, 300) + "..."} />
                                    <button
                                        onClick={toggleReadMore}
                                        className="read-more-button"
                                    >
                                        Read More
                                    </button>
                                </>
                            ) : (
                                <>
                                    <MarkdownRenderer content={post.content} />
                                    {post.content && post.content.length > 300 && (
                                        <button
                                            onClick={toggleReadMore}
                                            className="read-more-button"
                                        >
                                            Read Less
                                        </button>
                                    )}
                                </>
                            )}
                            
                            {/* Display images from content with lightbox functionality */}
                            {contentImages.length > 0 && (
                                <div className="post-images">
                                    {contentImages.map((imgSrc, index) => (
                                        <img
                                            key={index}
                                            src={imgSrc}
                                            alt={`Post content image ${index + 1}`}
                                            className="post-image"
                                            onClick={() => openLightbox(imgSrc, 'image')}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <article className="post-card">
            {renderPostContent()}

            <div className="post-meta">
                {post.category_name && (
                    <button 
                        onClick={() => setPage({ name: 'category', categorySlug: post.category_slug })}
                        className="category-button"
                    >
                        {post.category_name}
                    </button>
                )}
                {post.tags && post.tags.map((tag) => (
                     <span
                        key={tag}
                        className="tag"
                        onClick={() => setPage({ name: 'tag', tagName: tag })}
                    >
                        <span className="tag-hash">#</span>
                        <span>{tag}</span>
                    </span>
                ))}
            </div>

            <div className="post-footer">
                <div className="post-author">
                    <UserIcon className="author-icon"/>
                    <span>
                        Posted by <span className="author-name">{post.username}</span>
                    </span>
                    {typeof post.view_count === 'number' && (
                        <span className="view-count">{post.view_count} views</span>
                    )}
                </div>

                <div className="post-actions">
                    <LikeButton 
                        postId={post.id}
                        initialLikeCount={post.like_count}
                        initialLikedByUser={post.liked_by_user}
                        token={token}
                    />
                    <button onClick={handleCommentClick} className="action-button comment-button" aria-label="Toggle comments">
                        <MessageCircleIcon />
                    </button>
                    {isAuthor && (
                        <>
                            <button onClick={() => setPage({ name: 'edit-post', postId: post.id })} className="action-button edit-button" aria-label="Edit post">
                                <EditIcon />
                            </button>
                            <button onClick={() => onDelete(post.id)} className="action-button delete-button" aria-label="Delete post">
                                <TrashIcon />
                            </button>
                        </>
                    )}
                     <button onClick={handleViewPost} className="view-button">
                         View
                     </button>
                </div>
            </div>

            {showLoginPrompt && (
                <div className="login-prompt">
                    <p className="login-text">
                        Please <button onClick={() => setPage({ name: 'login' })} className="login-link">log in</button> to view and post comments.
                    </p>
                </div>
            )}

            {showComments && token && (
                <CommentSection postId={post.id} token={token} currentUserId={currentUserId} />
            )}

            {lightboxOpen && (
                <Lightbox 
                    mediaUrl={lightboxMedia.url} 
                    mediaType={lightboxMedia.type} 
                    onClose={closeLightbox} 
                />
            )}
        </article>
    );
};

export default PostCard;