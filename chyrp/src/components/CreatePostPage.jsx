import React, { useState, useEffect } from 'react';

const API_URL = "http://localhost:5000";

const CreatePostPage = ({ token, setPage }) => {
    const [postType, setPostType] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [attribution, setAttribution] = useState('');
    const [licenseText, setLicenseText] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaQuestion, setCaptchaQuestion] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 🔹 Helper: Load or refresh captcha
    const loadCaptcha = () => {
        fetch(`${API_URL}/captcha/new`)
            .then(res => res.json())
            .then(data => {
                setCaptchaToken(data.captcha_token);
                setCaptchaQuestion(data.question);
                setCaptchaAnswer('');
            })
            .catch(() => setError("Failed to load captcha"));
    };

    // Load captcha when component mounts
    useEffect(() => {
        loadCaptcha();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!title.trim()) {
            setError('Title is required.');
            return;
        }

        if (!captchaAnswer.trim()) {
            setError('Please solve the captcha.');
            return;
        }

        const postData = {
            type: postType,
            title: title.trim(),
            content: content.trim(),
            tags: tags.trim(),
            attribution: attribution.trim(),
            license: licenseText.trim()
        };

        // Step 1: Verify captcha first
        fetch(`${API_URL}/captcha/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ captcha_token: captchaToken, answer: captchaAnswer })
        })
        .then(res => res.json())
        .then(result => {
            if (!result.success) {
                // 🔹 Refresh captcha if failed
                loadCaptcha();
                throw new Error(result.error || "Captcha failed");
            }

            // Step 2: If captcha passes, create the post
            return fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            });
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
            setAttribution('');
            setLicenseText('');
            setCaptchaAnswer('');
            loadCaptcha(); // 🔹 Refresh captcha after success
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

                {/* Title */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-title">Title</label>
                    <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your Post Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>

                <input type="hidden" value={postType} />

                {/* Content */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-content">Content (Markdown supported)</label>
                    <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write something amazing..." rows="10" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"></textarea>
                </div>

                {/* Tags */}
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

                {/* Attribution */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-attribution">
                        Attribution <span className="text-xs text-gray-400">(optional)</span>
                    </label>
                    <input
                        id="post-attribution"
                        type="text"
                        value={attribution}
                        onChange={e => setAttribution(e.target.value)}
                        placeholder="e.g. Photo by John Doe"
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {/* License */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="post-license">
                        License <span className="text-xs text-gray-400">(optional, max 255 chars)</span>
                    </label>
                    <input
                        id="post-license"
                        type="text"
                        value={licenseText}
                        onChange={e => setLicenseText(e.target.value)}
                        placeholder="e.g. CC-BY-SA 4.0"
                        maxLength={255}
                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {/* Captcha Section */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                        Captcha Challenge
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{captchaQuestion}</p>
                    <input
                        type="text"
                        value={captchaAnswer}
                        onChange={e => setCaptchaAnswer(e.target.value)}
                        placeholder="Enter your answer"
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
