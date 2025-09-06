// src/components/Lightbox.jsx
import { useEffect } from 'react';
import './Lightbox.css';

const Lightbox = ({ image, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.keyCode === 27) onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!image) return null;

  return (
    <div className="lightbox-backdrop" onClick={handleBackdropClick}>
      <div className="lightbox-content">
        <button className="lightbox-close" onClick={onClose}>
          &times;
        </button>
        <img src={image} alt="Enlarged view" />
      </div>
    </div>
  );
};

export default Lightbox;