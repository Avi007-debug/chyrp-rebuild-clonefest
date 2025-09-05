import React, { useState, useEffect } from 'react';
import { UserIcon } from './Icons.jsx';

const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";


// --- Individual Comment Component ---
const Comment = ({ comment }) => {
    // Helper to format the date nicely
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="flex items-start space-x-3 py-4">
            <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{comment.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</p>
                </div>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{comment.content}</p>
            </div>
        </div>
    );
};

// --- Main Comments Section Component ---
const CommentSection = ({ postId, token, currentUserId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch comments for the post when the component loads
    useEffect(() => {
        fetch(`${API_URL}/posts/${postId}/comments`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch comments.'))
            .then(data => {
                setComments(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.toString());
                setLoading(false);
            });
    }, [postId]);

    // Handle form submission for a new comment
    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: newComment.trim() })
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(postedComment => {
            // Add the new comment to the list in real-time
            setComments([...comments, postedComment]);
            setNewComment(""); // Clear the input field
        })
        .catch(err => alert(`Error: ${err.message || 'Could not post comment.'}`));
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-b-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Comments ({comments.length})</h3>
            
            {/* Comment Submission Form (only for logged-in users) */}
            {token && (
                 <form onSubmit={handleSubmitComment} className="mb-6">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows="3"
                    ></textarea>
                    <button type="submit" className="mt-2 px-4 py-2 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 transition-colors">
                        Post Comment
                    </button>
                </form>
            )}

            {/* List of Comments */}
            <div className="space-y-4">
                {loading && <p>Loading comments...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && comments.length > 0 && (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                    </div>
                )}
                {!loading && comments.length === 0 && <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first!</p>}
            </div>
        </div>
    );
};

export default CommentSection;