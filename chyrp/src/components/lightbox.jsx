// src/components/Lightbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import './lightbox.css';

const Lightbox = ({ mediaUrl, mediaType, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const imageRef = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });

    // --- Effects ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

    // --- Event Handlers ---
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

    const handleWheel = (e) => {
        if (mediaType !== 'image' && mediaType !== 'photo') return;
        e.preventDefault();
        const newZoom = zoom - e.deltaY * 0.001;
        setZoom(Math.min(Math.max(0.5, newZoom), 5)); // Clamp zoom level
    };

    const handleMouseDown = (e) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e) => {
        if (!isDragging || zoom <= 1) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - startPos.current.x,
            y: e.clientY - startPos.current.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // --- Render Logic ---
    const renderMedia = () => {
        const style = {
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        };

        switch (mediaType) {
            case 'image':
            case 'photo':
                return (
                    <img
                        ref={imageRef}
                        src={mediaUrl}
                        alt="Enlarged view"
                        style={style}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves
                        onClick={zoom > 1 ? undefined : onClose} // Close on click if not zoomed
                        onContextMenu={(e) => e.preventDefault()} // Basic image protection
                    />
                );
            case 'video':
                return (
                    <video controls autoPlay src={mediaUrl} className="lightbox-video" onContextMenu={(e) => e.preventDefault()}>
                        Your browser does not support the video tag.
                    </video>
                );
            case 'audio':
                 return (
                    <div className="lightbox-audio-container">
                        <p className="text-white mb-4">Playing Audio</p>
                        <audio controls autoPlay src={mediaUrl} onContextMenu={(e) => e.preventDefault()}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                );
            default:
                return <p className="text-white">Unsupported media type.</p>;
        }
    };

  if (!mediaUrl) return null;

  return (
    <div className="lightbox-backdrop" onClick={handleBackdropClick} onWheel={handleWheel}>
      <div className="lightbox-content">
        <button className="lightbox-close" onClick={onClose}>&times;</button>
        {(mediaType === 'image' || mediaType === 'photo') && (
            <div className="lightbox-controls">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))}>+</button>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>-</button>
                <button onClick={resetZoom}>Reset</button>
            </div>
        )}
        {renderMedia()}
      </div>
    </div>
  );
};

export default Lightbox;