import React, { useState, useEffect } from 'react';  
import { FaUserCircle } from 'react-icons/fa'; 
import axiosPrivate from '../api/axios';  
import { Dropdown } from 'react-bootstrap'; 
import '../assets/ReviewList.css'; 

export default function ReviewList({ id, loggedInUsername }) {
  const [reviewList, setReviewList] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axiosPrivate.get(`/reviews/movie/${id}`);
        setReviewList(response.data); 
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    fetchReviews();
  }, [id]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  const handleDelete = async (reviewId) => {
    try {
      await axiosPrivate.delete(`/reviews/${reviewId}/`);
      setReviewList(reviewList.filter(review => review.id !== reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const handleEdit = (reviewId, text) => {
    setEditingReviewId(reviewId);
    setEditedText(text);
  };

  const handleSaveEdit = async (reviewId) => {
    try {
      await axiosPrivate.patch(`/reviews/${reviewId}/`, { text: editedText });
      setReviewList(
        reviewList.map((review) =>
          review.id === reviewId ? { ...review, text: editedText } : review
        )
      );
      setEditingReviewId(null);
    } catch (err) {
      console.error("Error updating review:", err);
    }
  };

  return (
    <section className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-warning">Рецензије</h3>
      </div>

      {reviewList.length > 0 ? (
        <div className="d-flex flex-wrap">
          {reviewList.map((review, index) => (
            <div 
              className="review-card col-12 col-sm-6 col-md-4 col-lg-3 me-3 mb-4 d-flex flex-column p-3 border rounded bg-dark text-light" 
              key={review?.id || index}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  {review.user?.profile_image_url ? (
                    <img 
                      src={review.user.profile_image_url} 
                      alt={`${review.user.user.username}'s profile`} 
                      className="rounded-circle me-2" 
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  ) : (
                    <FaUserCircle size={50} className="me-2" />
                  )}
                  <span className="text-warning fw-bold">{review.user.user.first_name} {review.user.user.last_name}</span>
                </div>
                
                {loggedInUsername === review.user.user.username && (
                  <Dropdown>
                    <Dropdown.Toggle variant="dark" id="dropdown-basic" size="sm">
                      &#x2026; 
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleEdit(review.id, review.text)}>
                        Измени
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDelete(review.id)}>
                        Избриши
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </div>

              {editingReviewId === review.id ? (
                <>
                  <textarea
                    className="form-control mb-3"
                    rows="3"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                  />
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleSaveEdit(review.id)}
                    >
                      Сачувај
                    </button>
                    <button
                      className="btn btn-secondary btn-sm ms-2"
                      onClick={() => setEditingReviewId(null)}
                    >
                      Откажи
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="review-text text-light mt-2 mb-3">
                    {review.text || 'No review text available'}
                  </p>
                  <p className="review-date text-light text-end mb-0">
                    {formatDate(review.date)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <h4>Нема рецензија.</h4>
      )}
    </section>
  );
}
