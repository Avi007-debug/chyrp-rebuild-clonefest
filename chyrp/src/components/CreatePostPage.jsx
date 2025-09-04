import React, { useState } from 'react';

const API_URL = "http://localhost:5000";

const CreatePostPage = ({ token, setPage }) => {
    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // For text posts
    const [mediaFile, setMediaFile] = useState(null); // For media uploads
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e) => {
        setMediaFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        let imageUrl = null;

        // Step 1: Upload file if it's a media post
        if (['photo', 'video', 'audio'].includes(postType) && mediaFile) {
            const formData = new FormData();
            formData.append('file', mediaFile);

            try {
                const uploadRes = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('File upload failed.');
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.file_url; // Use the URL as returned by backend
            } catch (err) {
                setError(err.message);
                setIsSubmitting(false);
                return;
            }
        }

        // Step 2: Create the post with text content or the new media URL
        const postData = {
            type: postType,
            title: title.trim(),
            content: postType === 'text' ? content.trim() : null,
            image_url: imageUrl,
            tags: tags.trim(),
        };

        try {
            const postRes = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(postData),
            });
            if (!postRes.ok) throw new Error('Failed to create post.');
            
            // Success
            setPage({ name: 'home' });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContentInput = () => {
        switch (postType) {
            case 'photo':
            case 'video':
            case 'audio':
                return (
                    <div>
                        <label className="block font-semibold mb-2" htmlFor="media-file">Upload File</label>
                        <input id="media-file" type="file" onChange={handleFileChange} required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                    </div>
                );
            case 'text':
            default:
                return (
                     <div>
                        <label className="block font-semibold mb-2" htmlFor="post-content">Content (Markdown supported)</label>
                        <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-mono"></textarea>
                    </div>
                );
        }
    };

    const postTypes = ['text', 'photo', 'video', 'audio'];

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
                <h2 className="text-3xl font-bold text-center">Create a New Post</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
                
                <div className="flex justify-center space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    {postTypes.map(type => (
                        <button key={type} type="button" onClick={() => setPostType(type)} className={`w-full px-4 py-2 text-sm font-bold rounded-md transition-colors ${postType === type ? 'bg-white dark:bg-gray-900 text-pink-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                <div>
                    <label className="block font-semibold mb-2" htmlFor="post-title">Title</label>
                    <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your Post Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                
                {renderContentInput()}
                
                <div>
                    <label className="block font-semibold mb-2" htmlFor="post-tags">Tags (comma-separated)</label>
                    <input id="post-tags" type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., tech, travel, photography" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
                    {isSubmitting ? 'Submitting...' : 'Publish Post'}
                </button>
            </form>
        </div>
    );
};

export default CreatePostPage;