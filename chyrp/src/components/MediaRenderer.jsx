import React from 'react';
import ReactMarkdown from 'react-markdown';

const MediaRenderer = ({ post }) => {
    // This component decides how to render a post's content based on its type.
    switch (post.type) {
        case 'photo':
            return <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover" />;
        
        case 'video':
            return (
                <video controls className="w-full rounded-lg mt-2 bg-black">
                    <source src={post.image_url} />
                    Your browser does not support the video tag.
                </video>
            );

        case 'audio':
            return (
                <div className="w-full mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <audio controls className="w-full">
                        <source src={post.image_url} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );

        case 'text':
        default:
            // For text posts, the content is rendered outside this component
            // to allow for different layouts (e.g., on PostDetailPage).
            return null;
    }
};

export default MediaRenderer;