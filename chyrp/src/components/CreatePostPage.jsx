import React, { useState, useEffect } from 'react';
import EmbedRenderer from './EmbedRenderer';

const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";


const CreatePostPage = ({ token, setPage }) => {
  // --- STATE MANAGEMENT ---
  const [postType, setPostType] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [tags, setTags] = useState('');
  const [attribution, setAttribution] = useState('');
  const [licenseText, setLicenseText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    // Fetch categories
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) {
          const defaultCategory = data.find(c => c.slug === 'uncategorized') || data[0];
          setCategoryId(defaultCategory.id);
        }
      })
      .catch(() => setError("Could not load categories."));

    // Fetch initial captcha
    loadCaptcha();
  }, []);

  // --- HELPER FUNCTIONS ---
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

  const handleFileChange = (e) => {
    setMediaFiles(Array.from(e.target.files));
  };

  const handlePostTypeChange = (newType) => {
    setPostType(newType);
    setContent('');
    setMediaFiles([]);
    setQuoteText('');
    setQuoteAuthor('');
    setLinkUrl('');
  };

  const handleEmbed = (embedHtml) => {
    // Append the embed HTML to the current content, adding newlines for spacing
    setContent(currentContent => (currentContent ? currentContent + '\n\n' : '') + embedHtml);
  };

  // --- MAIN SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if ((postType !== 'quote' && !title.trim()) || !categoryId) {
      setError('Title and Category are required.');
      return;
    }
    if (postType === 'quote' && !quoteText.trim()) {
      setError('Quote text is required.');
      return;
    }
    if (postType === 'link' && !linkUrl.trim()) {
      setError('URL is required for link posts.');
      return;
    }
    if (!captchaAnswer.trim()) {
      setError('Please solve the captcha.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Verify captcha
      const captchaRes = await fetch(`${API_URL}/captcha/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha_token: captchaToken, answer: captchaAnswer })
      });
      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        loadCaptcha();
        throw new Error("Captcha verification failed. Please try again.");
      }

      // Step 2: Upload media if any files are selected
      let mediaUrls = [];
      if (['photo', 'video', 'audio'].includes(postType) && mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => {
          const formData = new FormData();
          formData.append('file', file);
          return fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          }).then(res => {
            if (!res.ok) throw new Error(`File upload failed for ${file.name}.`);
            return res.json();
          });
        });
        const uploadResults = await Promise.all(uploadPromises);
        mediaUrls = uploadResults.map(result => result.file_url);
      }

      // Step 3: Construct the final post data object based on post type
      const postData = {
        type: postType,
        title: title.trim(),
        tags: tags.trim(),
        attribution: attribution.trim(),
        license: licenseText.trim(),
        category_id: categoryId,
        media_urls: mediaUrls,
        content: null,
        link_url: null,
      };

      if (postType === 'text' || ['photo', 'video', 'audio'].includes(postType)) {
        postData.content = content.trim();
      } else if (postType === 'quote') {
        let finalQuote = quoteText.trim();
        if (quoteAuthor.trim()) {
          finalQuote += `\n— ${quoteAuthor.trim()}`;
        }
        postData.content = finalQuote;
      } else if (postType === 'link') {
        postData.link_url = linkUrl.trim();
        postData.content = content.trim();
      }

      // Step 4: Send the request to create the post
      const postRes = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData),
      });

      if (!postRes.ok) {
        const errData = await postRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create post.');
      }

      setSuccess('Post created successfully!');
      setTitle('');
      setContent('');
      setTags('');
      setAttribution('');
      setLicenseText('');
      setMediaFiles([]);
      setQuoteText('');
      setQuoteAuthor('');
      setLinkUrl('');
      setCaptchaAnswer('');
      loadCaptcha();

      setTimeout(() => setPage({ name: 'home' }), 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DYNAMIC FORM RENDERING ---
  const renderContentInput = () => {
    switch (postType) {
      case 'photo':
      case 'video':
      case 'audio':
        return (
          <>
            <div>
              <label htmlFor="file-upload" className="block font-semibold mb-2">Upload File(s)</label>
              <input id="file-upload" type="file" multiple onChange={handleFileChange} required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
            </div>
            <div>
              <label htmlFor="content-input" className="block font-semibold mb-2">Description (Optional, Markdown supported)</label>
              <textarea id="content-input" value={content} onChange={e => setContent(e.target.value)} rows="4" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-mono"></textarea>
            </div>
          </>
        );
      case 'quote':
        return (
          <>
            <div>
              <label htmlFor="quote-text" className="block font-semibold mb-2">Quote Text</label>
              <textarea id="quote-text" value={quoteText} onChange={e => setQuoteText(e.target.value)} placeholder="Enter the quotation..." rows="4" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
            </div>
            <div>
              <label htmlFor="quote-author" className="block font-semibold mb-2">Author (optional)</label>
              <input id="quote-author" type="text" value={quoteAuthor} onChange={e => setQuoteAuthor(e.target.value)} placeholder="e.g. Albert Einstein" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </>
        );
      case 'link':
        return (
          <>
            <div>
                <label htmlFor="link-url" className="block font-semibold mb-2">URL</label>
                <input id="link-url" type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="content-input" className="block font-semibold mb-2">Description (Optional)</label>
                <textarea id="content-input" value={content} onChange={e => setContent(e.target.value)} placeholder="Add a description of the link..." rows="4" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"></textarea>
            </div>
          </>
        );
      default:
        return (
          <div>
            <label htmlFor="content-input" className="block font-semibold mb-2">Content (Markdown supported)</label>
            <textarea id="content-input" value={content} onChange={e => setContent(e.target.value)} rows="10"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-mono"></textarea>
            
            {/* Embed Helper Section */}
            <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Easy Embed Helper</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Paste a URL from YouTube, Twitter, etc. to generate embed code and add it to your post.</p>
                <EmbedRenderer onEmbed={handleEmbed} />
            </div>
          </div>
        );
    }
  };

  const postTypes = ['text', 'photo', 'video', 'audio', 'quote', 'link'];

  // --- JSX ---
  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center">Create a New Post</h2>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-3 rounded text-center text-sm">{success}</p>}

        {/* Post type selector */}
        <div className="flex justify-center space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
          {postTypes.map(type => (
            <button key={type} type="button" onClick={() => handlePostTypeChange(type)}
              className={`w-full px-4 py-2 text-sm font-bold rounded-md transition-colors ${postType === type ? 'bg-white dark:bg-gray-900 text-pink-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Title (hidden for quote type as it's optional) */}
        {postType !== 'quote' && (
            <div>
                <label htmlFor="title-input" className="block font-semibold mb-2">Title</label>
                <input id="title-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Your Post Title" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
            </div>
        )}
         {postType === 'quote' && (
            <div>
                <label htmlFor="title-input" className="block font-semibold mb-2">Title (Optional)</label>
                <input id="title-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Optional Title for Quote" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
            </div>
        )}

        {renderContentInput()}

        {/* Category & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category-select" className="block font-semibold mb-2">Category</label>
            <select id="category-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <option value="" disabled>Select a category</option>
              {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="tags-input" className="block font-semibold mb-2">Tags (comma-separated)</label>
            <input id="tags-input" type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., tech, travel" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
          </div>
        </div>

        {/* Attribution & License */}
        <div>
          <label htmlFor="attribution-input" className="block font-semibold mb-2">Attribution (optional)</label>
          <input id="attribution-input" type="text" value={attribution} onChange={e => setAttribution(e.target.value)} placeholder="e.g. Photo by John Doe" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
        </div>
        <div>
          <label htmlFor="license-input" className="block font-semibold mb-2">License (optional, max 255 chars)</label>
          <input id="license-input" type="text" value={licenseText} onChange={e => setLicenseText(e.target.value)} maxLength={255} placeholder="e.g. CC-BY-SA 4.0" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
        </div>

        {/* Captcha */}
        <div>
          <label htmlFor="captcha-input" className="block font-semibold mb-2">Captcha Challenge</label>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{captchaQuestion}</p>
            <button type="button" onClick={loadCaptcha} className="text-sm text-pink-600 hover:underline">Refresh</button>
          </div>
          <input id="captcha-input" type="text" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} placeholder="Enter your answer" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
        </div>

        <button type="submit" disabled={isSubmitting || !captchaToken}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-transform transform hover:scale-105">
          {isSubmitting ? 'Submitting...' : 'Publish Post'}
        </button>

      </form>
    </div>
  );
};

export default CreatePostPage;