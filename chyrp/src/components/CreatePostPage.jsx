import React, { useState } from 'react';

const API_URL = "http://localhost:5000";

const CreatePostPage = ({ token, setPage }) => {
    const [postType, setPostType] = useState('text'); // text | quote | link
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [quoteText, setQuoteText] = useState('');
    const [quoteAuthor, setQuoteAuthor] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        let postData = { type: postType, tags: tags.trim() };

        if (postType === 'text') {
            if (!title.trim()) {
                setError('Title is required for text posts.');
                return;
            }
            postData.title = title.trim();
            postData.content = content.trim();

        } else if (postType === 'quote') {
            if (!quoteText.trim()) {
                setError('Quote text is required.');
                return;
            }
            // Backend expects "content" for quotes
            postData.content = quoteText.trim();
            // Save author name inside content or separate field if backend supports
            if (quoteAuthor.trim()) {
                postData.content += `\n— ${quoteAuthor.trim()}`;
            }

        } else if (postType === 'link') {
            if (!title.trim()) {
                setError('Title is required for link posts.');
                return;
            }
            if (!linkUrl.trim()) {
                setError('URL is required for link posts.');
                return;
            }
            postData.title = title.trim();
            postData.link_url = linkUrl.trim();
            postData.content = content.trim(); // optional description
        }

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
            setQuoteText('');
            setQuoteAuthor('');
            setLinkUrl('');
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

                {/* --- Post Type Selector --- */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Post Type</label>
                    <select
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="text">Text Post</option>
                        <option value="quote">Quote</option>
                        <option value="link">Link</option>
                    </select>
                </div>

                {/* --- Text Post Form --- */}
                {postType === 'text' && (
                    <>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-title">Title</label>
                            <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your Post Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-content">Content (Markdown supported)</label>
                            <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write something amazing..." rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"></textarea>
                        </div>
                    </>
                )}

                {/* --- Quote Post Form --- */}
                {postType === 'quote' && (
                    <>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="quote-text">Quote Text</label>
                            <textarea id="quote-text" value={quoteText} onChange={e => setQuoteText(e.target.value)} placeholder="Enter the quotation..." rows="4" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="quote-author">Author</label>
                            <input id="quote-author" type="text" value={quoteAuthor} onChange={e => setQuoteAuthor(e.target.value)} placeholder="e.g. Albert Einstein" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                    </>
                )}

                {/* --- Link Post Form --- */}
                {postType === 'link' && (
                    <>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-title">Title</label>
                            <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Link Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="link-url">URL</label>
                            <input id="link-url" type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-content">Description (Optional)</label>
                            <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Add a description of the link..." rows="4" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                    </>
                )}

                {/* --- Common Tags --- */}
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
