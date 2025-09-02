import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { LinkIcon, UserIcon, EditIcon, TrashIcon, MessageCircleIcon } from './Icons.jsx';
import CommentSection from './CommentSection.jsx';
import LikeButton from './LikeButton.jsx';

const PostCard = ({ post, currentUserId, setPage, onDelete, token }) => {
    const isAuthor = post.user_id === currentUserId;
    const [showComments, setShowComments] = useState(false);

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
                        <blockquote className="text-2xl font-serif italic text-center">“{post.quote_text}”</blockquote>
                        <cite className="block text-right mt-4 not-italic">— {post.quote_author}</cite>
                    </div>
                );
            case 'link':
                return (
                    <div className="p-6">
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xl font-semibold text-pink-600 hover:underline">
                            <LinkIcon />{post.title}
                        </a>
                    </div>
                );
            default:
                return <div className="p-6 text-red-500">Unknown post type</div>;
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
                            >
                                <span className="mr-1 text-pink-500 font-bold">#</span><span className="font-bold">{tag}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/*
                How to add tags to a post:
                - When creating or editing a post, include a 'tags' field (array of strings) in the post data sent to the backend.
                - Example: { title: '...', content: '...', tags: ['react', 'flask', 'web'] }
                - The backend will save and return these tags for each post.
            */}

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
                    <button onClick={() => setShowComments(!showComments)} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-green-600 transition-colors">
                        <MessageCircleIcon />
                    </button>

                    {/* Edit and Delete buttons only for author */}
                    {isAuthor && (
                        <>
                            <button onClick={() => setPage({ name: 'edit-post', postId: post.id })} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors">
                                <EditIcon />
                            </button>
                            <button onClick={() => onDelete(post.id)} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 transition-colors">
                                <TrashIcon />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Comment section */}
            {showComments && <CommentSection postId={post.id} token={token} currentUserId={currentUserId} />}
        </article>
    );
};

export default PostCard;
