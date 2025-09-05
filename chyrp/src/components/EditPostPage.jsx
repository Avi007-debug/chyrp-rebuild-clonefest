import React, { useState, useEffect } from 'react';

const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";


const EditPostPage = ({ token, setPage, postId }) => {
  // --- STATE MANAGEMENT ---
  // Combines state from both versions to handle all post types and fields
  const [postType, setPostType] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [attribution, setAttribution] = useState('');
  const [licenseText, setLicenseText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA FETCHING EFFECT ---
  useEffect(() => {
    // Fetch both the specific post and the list of all categories at the same time
    Promise.all([
      fetch(`${API_URL}/posts/${postId}`),
      fetch(`${API_URL}/categories`)
    ])
    .then(async ([postRes, catRes]) => {
      if (!postRes.ok) {
        const err = await postRes.json().catch(() => ({ message: 'Failed to fetch post data.' }));
        throw new Error(err.message);
      }
      if (!catRes.ok) {
         const err = await catRes.json().catch(() => ({ message: 'Failed to fetch categories.' }));
        throw new Error(err.message);
      }
      
      const post = await postRes.json();
      const categoriesData = await catRes.json();
      
      return { post, categoriesData };
    })
    .then(({ post, categoriesData }) => {
      // Set categories for the dropdown
      setCategories(categoriesData);

      // Populate form state with the fetched post data
      setTitle(post.title || '');
      setTags(post.tags ? post.tags.join(', ') : '');
      setAttribution(post.attribution || '');
      setLicenseText(post.license || '');
      setCategoryId(post.category_id || '');
      setPostType(post.type || 'text');

      // Handle content parsing based on the post's type
      if (post.type === 'quote') {
        const contentParts = (post.content || '').split('\n— ');
        setQuoteText(contentParts[0] || '');
        setQuoteAuthor(contentParts[1] || '');
      } else if (post.type === 'link') {
        setLinkUrl(post.link_url || '');
        setContent(post.content || ''); // This is the description for a link post
      } else {
        setContent(post.content || '');
      }
    })
    .catch(err => {
      setError(err.message || "An error occurred while loading data.");
    })
    .finally(() => {
      setLoading(false);
    });
  }, [postId]);

  // --- MAIN SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Construct the final post data object for the PUT request
    const postData = {
      type: postType,
      title: title.trim(),
      tags: tags.trim(),
      attribution: attribution.trim(),
      license: licenseText.trim(),
      category_id: categoryId,
      content: null,
      link_url: null,
    };

    // Assign content and link_url based on the post type
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
      postData.content = content.trim(); // Optional description for a link
    }
    
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update the post.');
      }

      setSuccess('Post updated successfully!');
      // Redirect back to the post view page after a short delay
      setTimeout(() => setPage({ name: 'post', id: postId }), 1500);
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
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">Media files for this post cannot be changed here. You can edit the description and other details below.</p>
            </div>
            <div>
              <label htmlFor="content-input" className="block font-semibold mb-2">Description (Markdown supported)</label>
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
      default: // 'text' post type
        return (
          <div>
            <label htmlFor="content-input" className="block font-semibold mb-2">Content (Markdown supported)</label>
            <textarea id="content-input" value={content} onChange={e => setContent(e.target.value)} rows="10"
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-mono"></textarea>
          </div>
        );
    }
  };

  if (loading) return <div className="text-center p-8">Loading post for editing...</div>;

  // --- JSX ---
  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center">Edit Post</h2>
        
        {error && <p className="bg-red-100 text-red-700 p-3 rounded text-center text-sm">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-3 rounded text-center text-sm">{success}</p>}
        
        {/* Post Type Display (Read-only) */}
        <div>
          <label className="block font-semibold mb-2">Post Type</label>
          <div className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400">
            {postType.charAt(0).toUpperCase() + postType.slice(1)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Post type cannot be changed after creation.</p>
        </div>

        {/* Title (always visible, but optional for quotes) */}
        <div>
            <label htmlFor="title-input" className="block font-semibold mb-2">Title {postType === 'quote' && '(Optional)'}</label>
            <input id="title-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={postType === 'quote' ? 'Optional Title for Quote' : 'Your Post Title'} className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
        </div>

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
        
        <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-transform transform hover:scale-105">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditPostPage;
