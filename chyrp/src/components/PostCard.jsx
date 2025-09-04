import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { LinkIcon, UserIcon, EditIcon, TrashIcon, MessageCircleIcon } from './Icons.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import CommentSection from './CommentSection.jsx';
import LikeButton from './LikeButton.jsx';

const PostCard = ({ post, currentUserId, setPage, onDelete, token }) => {
    const isAuthor = post.user_id === currentUserId;
    const [showComments, setShowComments] = useState(false);

    const renderPostContent = () => {
        switch (post.type) {
            case 'photo':
            case 'video':
            case 'audio':
                return (
                    <div>
                        <MediaRenderer post={post} />
                        <div className="p-6"><h2 className="text-xl font-bold">{post.title}</h2></div>
                    </div>
                );
            case 'text':
            default:
                return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2 cursor-pointer hover:text-pink-600" onClick={() => setPage({ name: 'post-detail', postId: post.id })}>{post.title}</h2>
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
                    <span key={tag} className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer" onClick={() => setPage({ name: 'tag', tagName: tag })}>
                        #{tag}
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
                    {/* View Post button */}
                    <button
                        onClick={() => setPage({ name: 'post-detail', postId: post.id })}
                        className="p-2 rounded-md text-pink-600 bg-pink-100 hover:bg-pink-200 font-bold transition-colors"
                    >
                        View Post
                    </button>
                </div>
            </div>

            {/* Comment section */}
            {showComments && <CommentSection postId={post.id} token={token} currentUserId={currentUserId} />}
        </article>
    );
};

export default PostCard;
