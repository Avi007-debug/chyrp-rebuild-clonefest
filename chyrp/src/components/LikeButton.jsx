import React, { useState } from 'react';
import { HeartIcon } from './Icons.jsx';

const API_URL = "https://chyrp-rebuild-clonefest.onrender.com";


const LikeButton = ({ postId, initialLikeCount, initialLikedByUser, token }) => {
    // State to manage the like count and the user's like status
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [liked, setLiked] = useState(initialLikedByUser);
    const [isLoading, setIsLoading] = useState(false);

    const handleLikeClick = () => {
        // Prevent multiple clicks while a request is in progress
        if (isLoading) return;
        
        // A user must be logged in to like a post
        if (!token) {
            alert("Please log in to like posts.");
            return;
        }

        setIsLoading(true);

        // Optimistic UI update for immediate feedback
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);

        fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) {
                // If the request fails, revert the optimistic update
                setLiked(liked);
                setLikeCount(likeCount);
                return res.json().then(err => Promise.reject(err));
            }
            return res.json();
        })
        .then(data => {
            // Sync with the server's response to ensure consistency
            setLiked(data.liked);
            setLikeCount(data.like_count);
        })
        .catch(err => {
            console.error("Failed to update like status:", err);
            alert(`Error: ${err.message || "Could not update like."}`);
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    // Dynamically set button styles based on like status
    const buttonClasses = `flex items-center space-x-1 p-2 rounded-md transition-colors text-sm 
        ${liked 
            ? 'text-red-500 bg-red-100 dark:bg-red-900/30' 
            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`;

    return (
        <button onClick={handleLikeClick} className={buttonClasses} disabled={isLoading}>
            <HeartIcon filled={liked} />
            <span>{likeCount}</span>
        </button>
    );
};

export default LikeButton;
