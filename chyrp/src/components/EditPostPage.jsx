import React, { useState, useEffect } from 'react';

const API_URL = "http://localhost:5000";

const EditPostPage = ({ token, setPage, postId }) => {
    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/posts/${postId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch post');
                return res.json();
            })
            .then(post => {
                setTitle(post.title || '');
                setContent(post.content || '');
                setLinkUrl(post.link_url || '');
                setPostType(post.type || 'text');
                setTags(post.tags ? post.tags.join(', ') : '');
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [postId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        let postData = { 
            title: title.trim(), 
            content: content.trim(),
            tags: tags.trim(),
            type: postType
        };

        // Add link_url for link posts
        if (postType === 'link') {
            postData.link_url = linkUrl.trim();
        }

        if (!postData.title) {
            setError('Title is required.');
            return;
        }

        fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(postData)
        })
        .then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
        })
        .then(() => {
            setSuccess('Post updated successfully!');
            setTimeout(() => setPage({ name: 'home' }), 1500);
        })
        .catch(err => setError(err.message || 'Failed to update post.'));
    };
    
    if (loading) return <div className="text-center p-8">Loading post for editing...</div>;

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200">Edit Post</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 p-3 rounded text-center text-sm">{success}</p>}
                
                {/* Post Type Display (Read-only since we shouldn't change type after creation) */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Post Type</label>
                    <div className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                        {postType.charAt(0).toUpperCase() + postType.slice(1)} Post
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Post type cannot be changed after creation.</p>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-title">Title</label>
                    <input 
                        id="edit-title" 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" 
                    />
                </div>

                {/* Link URL Field (only for link posts) */}
                {postType === 'link' && (
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-link-url">URL</label>
                        <input 
                            id="edit-link-url" 
                            type="url" 
                            value={linkUrl} 
                            onChange={e => setLinkUrl(e.target.value)} 
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" 
                            placeholder="https://example.com"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-content">
                        {postType === 'link' ? 'Description (Optional)' : 'Content (Markdown supported)'}
                    </label>
                    <textarea 
                        id="edit-content" 
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        rows="10" 
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                        placeholder={postType === 'link' ? 'Add a description of the link...' : 'Write your content here...'}
                    ></textarea>
                </div>

                {/* Tags Field */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-tags">
                        Tags <span className="text-xs text-gray-400">(comma separated)</span>
                    </label>
                    <input 
                        id="edit-tags" 
                        type="text" 
                        value={tags} 
                        onChange={e => setTags(e.target.value)} 
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" 
                        placeholder="e.g. react, flask, web"
                    />
                </div>
                
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-lg">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default EditPostPage;