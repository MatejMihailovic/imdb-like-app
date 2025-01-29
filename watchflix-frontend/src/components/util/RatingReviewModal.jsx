import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import axiosPrivate from '../../api/axios';  
import '../../assets/RatingReviewModal.css'; 

const RatingReviewModal = ({ movieId, username, showModal, handleClose }) => {
  const [hover, setHover] = useState(null);
  const [rating, setRating] = useState(null);
  const [reviewText, setReviewText] = useState('');

  const onSubmit = () => {
    if (reviewText.trim() !== '') {
      handleReviewSubmit(reviewText);
    }
    if (rating !== null) {
      handleRatingSubmit(rating);
    }
    handleClose();  
  };

  const handleReviewSubmit = async (reviewText) => {
    try {
      const data = {
        username: username,
        movie: movieId,
        text: reviewText,
      };

      const response = await axiosPrivate.post('/reviews/', data);
      if (response.status === 201) {
        console.log('Review successfully added.');
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const handleRatingSubmit = async (rating) => {
    try {
      const data = {
        username: username,
        movie: movieId,
        rating: rating,
      };

      const response = await axiosPrivate.post('/watch-history/', data);
      if (response.status === 201) {
        console.log('Rating successfully added.');
      }
    } catch (error) {
      console.error('Error adding rating:', error);
    }
  };

  return (
    <div className={`modal fade ${showModal ? 'show' : ''}`} 
         id="ratingModal" 
         style={{ display: showModal ? 'block' : 'none', opacity: showModal ? 1 : 0 }}>
      <div className="modal-dialog">
        <div className="modal-content">  
          <div className="modal-header">
            <h5 className="modal-title">Оцените филм и/или напишите рецензију</h5>
            <button className="btn-close btn-close-white" aria-label="Close" data-bs-dismiss="modal" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <h6>Ваша рецензија</h6>
            <textarea
              className="modal-textarea"
              rows="4"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Напишите своју рецензију овде..."
            />

            <h6>Ваша оцена</h6>
            <div className="rating-stars d-flex justify-content-center">
              {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                  <label key={index}>
                    <input
                      type="radio"
                      name="rating"
                      value={ratingValue}
                      onClick={() => setRating(ratingValue)}
                      style={{ display: 'none' }}
                    />
                    <FaStar
                      className="star"
                      color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                      size={40}
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(null)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button className="modal-close-btn" data-bs-dismiss="modal" onClick={handleClose}>Затвори</button>
            <button className="modal-submit-btn text-white" onClick={onSubmit}>Пошаљи</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingReviewModal;
