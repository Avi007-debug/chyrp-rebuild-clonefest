import React, { useEffect, useState } from 'react';

const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";


const WebmentionList = ({ postId }) => {
    const [webmentions, setWebmentions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWebmentions = async () => {
            try {
                const res = await fetch(`${API_URL}/posts/${postId}/webmentions`);
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Failed to fetch webmentions: ${res.status} ${errorText}`);
                }
                const data = await res.json();
                setWebmentions(data);
            } catch (err) {
                console.error('Error fetching webmentions:', err);
                setError(err.message || 'Failed to fetch webmentions');
            } finally {
                setLoading(false);
            }
        };

        fetchWebmentions();
    }, [postId]);

    if (loading) return <div className="text-sm text-gray-500">Loading webmentions...</div>;
    if (error) return <div className="text-sm text-red-500">Error loading webmentions: {error}</div>;
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Webmentions</h3>
            {!webmentions.length ? (
                <p className="text-sm text-gray-500 italic">No webmentions yet. Be the first to mention this post!</p>
            ) : (
                <div className="space-y-4">
                    {webmentions.map(mention => (
                    <div key={mention.id} className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        {mention.author_photo && (
                            <img 
                                src={mention.author_photo} 
                                alt={mention.author_name || "Author"} 
                                className="w-10 h-10 rounded-full"
                            />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                {mention.author_url ? (
                                    <a 
                                        href={mention.author_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="font-medium text-pink-600 dark:text-pink-400 hover:underline"
                                    >
                                        {mention.author_name || "Anonymous"}
                                    </a>
                                ) : (
                                    <span className="font-medium">{mention.author_name || "Anonymous"}</span>
                                )}
                                <span className="text-sm text-gray-500">
                                    {new Date(mention.published_at).toLocaleDateString()}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                                    {mention.mention_type}
                                </span>
                            </div>
                            {mention.content && (
                                <p className="mt-1 text-gray-700 dark:text-gray-300">{mention.content}</p>
                            )}
                            <a 
                                href={mention.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-2 text-sm text-gray-500 hover:text-pink-600 dark:hover:text-pink-400"
                            >
                                View original post →
                            </a>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
};

export default WebmentionList;
