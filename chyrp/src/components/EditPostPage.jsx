import React, { useState, useEffect } from 'react';

const API_URL = "http://localhost:5000";

const EditPostPage = ({ token, setPage, postId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [attribution, setAttribution] = useState('');
    const [licenseText, setLicenseText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/posts/${postId}`)
            .then(res => res.json())
            .then(post => {
                if (post) {
                    setTitle(post.title);
                    setContent(post.content);
                    setTags(post.tags ? post.tags.join(', ') : '');
                    setAttribution(post.attribution || '');
                    setLicenseText(post.license || '');
                } else {
                    setError("Post not found.");
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch post data.");
                setLoading(false);
            });
    }, [postId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                title: title.trim(),
                content: content.trim(),
                tags: tags.trim(),
                attribution: attribution.trim(),
                license: licenseText.trim()
            })
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
                
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-title">Title</label>
                    <input id="edit-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-content">Content (Markdown supported)</label>
                    <textarea id="edit-content" value={content} onChange={e => setContent(e.target.value)} rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"></textarea>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-tags">
                        Tags <span className="text-xs text-gray-400">(comma separated)</span>
                    </label>
                    <input
                        id="edit-tags"
                        type="text"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="e.g. react, flask, web"
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-attribution">
                        Attribution <span className="text-xs text-gray-400">(optional)</span>
                    </label>
                    <input
                        id="edit-attribution"
                        type="text"
                        value={attribution}
                        onChange={e => setAttribution(e.target.value)}
                        placeholder="e.g. Photo by John Doe"
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="edit-license">
                        License <span className="text-xs text-gray-400">(optional, max 255 chars)</span>
                    </label>
                    <input
                        id="edit-license"
                        type="text"
                        value={licenseText}
                        onChange={e => setLicenseText(e.target.value)}
                        placeholder="e.g. CC-BY-SA 4.0"
                        maxLength={255}
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
