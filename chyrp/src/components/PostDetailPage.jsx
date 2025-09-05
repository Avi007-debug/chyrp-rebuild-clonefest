import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

// --- Component Imports ---
import MarkdownRenderer from './MarkdownRenderer.jsx';
import MediaRenderer from './MediaRenderer.jsx';
import CommentSection from './CommentSection.jsx';
import WebmentionList from './WebmentionList.jsx';
import LikeButton from './LikeButton.jsx';
import { UserIcon, TagIcon, ExternalLinkIcon } from './Icons.jsx';

const API_URL = "http://localhost:5000";

const PostDetailPage = ({ postId, setPage, currentUserId, token }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPost = async () => {
      if (!postId) {
        if (isMounted) {
          setError("No post ID provided.");
          setLoading(false);
        }
        return;
      }
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/posts/${postId}?_=${Date.now()}`, { headers, cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch post');
        const data = await response.json();
        if (isMounted) {
          setPost(data);
        }
      } catch (err) {
        if (isMounted) setError(err.toString());
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPost();
    return () => { isMounted = false; };
  }, [postId, token]);

  const getDomainFromUrl = (url) => {
    try { return new URL(url).hostname.replace('www.', ''); } catch (e) { return url; }
  };

  const renderPostContent = () => {
    if (!post) return null;
    switch (post.type) {
        case 'photo':
        case 'video':
        case 'audio':
            return (
                <>
                    {post.media_urls && post.media_urls.length > 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {post.media_urls.map(url => <MediaRenderer key={url} post={{...post, image_url: url }} />)}
                        </div>
                    ) : <MediaRenderer post={post} />}
                    {post.content && <div className="mt-4"><MarkdownRenderer content={post.content} /></div>}
                </>
            );
        case 'quote':
            const [quoteText, quoteAuthor] = (post.content || '').split('\n— ');
            return (
                <div className="p-8 my-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <blockquote className="text-2xl font-serif italic text-center">"{quoteText}"</blockquote>
                    {quoteAuthor && <cite className="block text-right mt-4 not-italic">— {quoteAuthor}</cite>}
                </div>
            );
        case 'link':
            return (
                <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="block my-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{post.title}</h3>
                            {post.content && <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{post.content}</p>}
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <ExternalLinkIcon className="h-3 w-3 mr-1" />
                                <span className="truncate">{getDomainFromUrl(post.link_url)}</span>
                            </div>
                        </div>
                    </div>
                </a>
            );
        case 'text':
        default:
            return <MarkdownRenderer content={post.content} />;
    }
  };


  if (loading) return <div className="text-center p-8">Loading post...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!post) return <div className="text-center p-8">Post not found.</div>;

  return (
    <div>
      <Helmet>
        <title>{post.title} - Chyrp Lite</title>
        <link rel="webmention" href={`${API_URL}/webmention`} />
        <link rel="canonical" href={`${window.location.origin}/posts/${postId}`} />
      </Helmet>

      <main className="max-w-3xl mx-auto p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-pink-500 pb-4">
          {post.title || `A ${post.type} post`}
        </h1>

        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center"><UserIcon className="h-5 w-5" /> <span className="ml-2">Posted by <span className="font-medium text-gray-700 dark:text-gray-300">{post.username}</span></span></div>
            {typeof post.view_count === "number" && <span>{post.view_count} views</span>}
            {post.category_name && <button onClick={() => setPage({ name: "category", categorySlug: post.category_slug })} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">{post.category_name}</button>}
            <LikeButton postId={post.id} initialLikeCount={post.like_count} initialLikedByUser={post.liked_by_user} token={token} />
        </div>

        <div className="text-lg text-gray-800 dark:text-gray-200">
            {renderPostContent()}
        </div>

        {(post.attribution || post.license) && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                {post.attribution && <p><strong>Attribution:</strong> {post.attribution}</p>}
                {post.license && <p><strong>License:</strong> {post.license}</p>}
            </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <TagIcon className="h-4 w-4 text-gray-500" />
            {post.tags.map((tag) => (
              <button key={tag} onClick={() => setPage({ name: "tag", tagName: tag })} className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-sm font-semibold hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors">
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <CommentSection postId={postId} token={token} currentUserId={currentUserId} />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <WebmentionList postId={postId} />
        </div>

        <button onClick={() => setPage({ name: "home" })} className="mt-8 px-6 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors shadow-md">
          &larr; Back to Home
        </button>
      </main>
    </div>
  );
};

export default PostDetailPage;
