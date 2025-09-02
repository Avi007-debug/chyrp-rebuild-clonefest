import React from 'react';
import ReactMarkdown from 'react-markdown';
import { LinkIcon, UserIcon, EditIcon, TrashIcon } from './Icons.jsx';

const PostCard = ({ post, currentUserId, setPage, onDelete }) => {
    const isAuthor = post.user_id === currentUserId;

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
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <UserIcon className="h-5 w-5 text-gray-400"/>
                    <span className="ml-2">Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span></span>
                </div>
                {isAuthor && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setPage({ name: 'edit-post', postId: post.id })} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 transition-colors">
                            <EditIcon />
                        </button>
                        <button onClick={() => onDelete(post.id)} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 transition-colors">
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
};

export default PostCard;

