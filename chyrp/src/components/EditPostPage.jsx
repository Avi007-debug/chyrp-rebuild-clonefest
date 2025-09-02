import React, { useState, useEffect } from 'react';

const API_URL = "http://localhost:5000";

const EditPostPage = ({ token, setPage, postId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // In a real app, you would fetch a single post from an endpoint like /api/posts/:id
        // For now, we'll find it in the full list for simplicity.
        fetch(`${API_URL}/posts`)
            .then(res => res.json())
            .then(posts => {
                const postToEdit = posts.find(p => p.id === postId);
                if (postToEdit) {
                    setTitle(postToEdit.title);
                    setContent(postToEdit.content);
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, content })
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
                
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-lg">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default EditPostPage;

