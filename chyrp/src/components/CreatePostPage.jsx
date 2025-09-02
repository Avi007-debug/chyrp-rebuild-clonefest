import React, { useState } from 'react';

const API_URL = "http://localhost:5000";

const CreatePostPage = ({ token, setPage }) => {
    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        const postData = {
            type: postType,
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim() // comma-separated string
        };
        fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        })
        .then(res => {
            if (res.status === 401) throw new Error('Unauthorized. Please log in again.');
            if (!res.ok) return res.json().then(err => { throw new Error(err.message || 'Failed to create post') });
            return res.json();
        })
        .then(data => {
            setSuccess('Post created successfully!');
            setTitle('');
            setContent('');
            setTags('');
            setTimeout(() => setPage({ name: 'home' }), 1500);
        })
        .catch(err => {
            setError(err.message);
        });
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200">Create a New Post</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 p-3 rounded text-center text-sm">{success}</p>}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-title">Title</label>
                    <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your Post Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <input type="hidden" value={postType} />
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-content">Content (Markdown supported)</label>
                    <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write something amazing..." rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"></textarea>
                </div>
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-tags">Tags <span className="text-xs text-gray-400">(comma separated, e.g. react, flask, web)</span></label>
                    <input
                        id="post-tags"
                        type="text"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="e.g. react, flask, web"
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                    Publish Post
                </button>
            </form>
        </div>
    );
};

export default CreatePostPage;

