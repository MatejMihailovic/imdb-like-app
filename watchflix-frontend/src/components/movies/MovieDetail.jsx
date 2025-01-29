import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosPrivate from '../../api/axios';
import MovieList from '../movies/MovieList';
import ReviewList from '../ReviewList';
import AuthContext from '../../context/AuthProvider';
import '../../assets/MovieDetail.css';
import RatingReviewModal from '../util/RatingReviewModal';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [recommendedMoviesGenres, setRecommendedMoviesGenres] = useState([]);
  const [error, setError] = useState(null);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ifWatched, setIfWatched] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rating, setRating] = useState(null);
  const [showFullPlot, setShowFullPlot] = useState(false);

  const { auth } = useContext(AuthContext);
  const username = auth?.username;

  useEffect(() => {
    checkAdminStatus();
    fetchMovieDetails();
    fetchRecommendedMovies();
    checkIfMovieWatched();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await axiosPrivate.get(`/movies/${id}`);
      setMovie(response.data);
    } catch (err) {
      setError(err);
    }
  };

  const fetchRecommendedMovies = async () => {
    try {
      const response = await axiosPrivate.get(`/recommendations/qdrant/content-based/${id}/`);
      setRecommendedMovies(response.data.recommendations || []);
      setRecommendedMoviesGenres(response.data.genres);
    } catch (err) {
      setRecError(err);
    } finally {
      setRecLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await axiosPrivate.get(`/user-profiles/${username}/is-admin/`);
      if (response.data.is_admin) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const checkIfMovieWatched = async () => {
    try {
      const response = await axiosPrivate.get(`/watch-history/check-watched/${id}?user=${username}`);
      setIfWatched(response.data.watched);
      if (response.data.rating) {
        setRating(response.data.rating);
      }
    } catch (err) {
      setRecError(err);
    }
  };

  const togglePlot = () => {
    setShowFullPlot(!showFullPlot);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    fetchMovieDetails();
    checkIfMovieWatched();
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleDeleteMovie = async () => {
    const confirmDelete = window.confirm(`Да ли сте сигурни да желите да обришете филм "${movie.title}"?`);
    if (confirmDelete) {
      try {
        await axiosPrivate.delete(`/movies/${id}/`);
        navigate('/movies');  // Redirect to the movies list after deletion
      } catch (err) {
        console.error('Error deleting movie:', err);
      }
    }
  };

  if (error) return <div className="text-danger">Грешка: {error.message}</div>;

  return (
    <div className="container movie-detail mt-5 text-light bg-dark">
      <div className="row">
        <div className="col-md-4 d-flex justify-content-center mt-4">
          <div className="poster-wrapper">
            {movie && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="img-fluid rounded shadow-lg poster-image"
                style={{ width: '100%', height: 'auto' }}
              />
            )}
          </div>
        </div>

        <div className="col-md-8">
          <div className="movie-info p-4 bg-dark bg-opacity-75 rounded shadow-lg">
            {movie && (
              <>
                <h1 className="display-4 text-warning">
                  {movie.title} ({movie.release_year})
                </h1>
                <p>
                  <strong>Радња:</strong> {showFullPlot ? movie.synopsis : `${movie.synopsis.substring(0, 150)}...`}
                  <button onClick={togglePlot} className="btn btn-link text-warning p-0">
                    {showFullPlot ? 'Прочитај мање' : 'Прочитај више'}
                  </button>
                </p>
                <p><strong>Трајање:</strong> {movie.duration} минута</p>
                <p><strong>Жанрови:</strong> {movie.genres.map(genre => genre.name).join(', ')}</p>
                <p>
                  <strong>Режисери: </strong>
                  {movie.directors &&
                    movie.directors.map((director, index) => (
                      <span key={index}>
                        <Link to={`/directors/${director.id}`} className="text-warning">
                          {director.first_name} {director.last_name}
                        </Link>
                        {index < movie.directors.length - 1 && ', '}
                      </span>
                    ))}
                </p>
                <p>
                  <strong>Глумци: </strong>
                  {movie.actors &&
                    movie.actors.map((actor, index) => (
                      <span key={index}>
                        <Link to={`/actors/${actor.id}`} className="text-warning">
                          {actor.first_name} {actor.last_name}
                        </Link>
                        {index < movie.actors.length - 1 && ', '}
                      </span>
                    ))}
                </p>
                <p><strong>Оцена:</strong> <div>{movie.avg_rating ? movie.avg_rating : "Нема оцена"}</div></p>

                {/* Show delete button if admin */}
                {isAdmin ? (
                  <button className="btn btn-danger mt-3" onClick={handleDeleteMovie}>
                    Обриши Филм
                  </button>
                ) : (
                  // Regular users can rate/review the movie
                  <div>
                    {ifWatched && <p><strong>Ваша оцена:</strong> {rating}</p>}
                    <button
                      type="button"
                      className="btn btn-warning mt-3"
                      onClick={handleOpenModal}
                    >
                      {ifWatched ? "Измени оцену и рецензију" : "Оцени филм и/или напиши рецензију"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <ReviewList id={id} loggedInUsername={username}/>
        </div>
      </div>

      {/* Render the Movie Recommendations */}
      <div className="row">
        <div className="col-12">
          {recLoading ? (
            <div className="text-light">Учитавање сличних филмова...</div>
          ) : recError ? (
            <div className="text-danger">Грешка приликом учитавања сличних филмова: {recError.message}</div>
          ) : recommendedMovies.length > 0 ? (
            <MovieList title="Слични филмови" movies={recommendedMovies} genres={recommendedMoviesGenres} />
          ) : (
            <div className="text-light">Нису пронађени слични филмови.</div>
          )}
        </div>
      </div>

      {showModal && (
        <RatingReviewModal
          movieId={id}
          username={username}
          handleClose={handleCloseModal} 
          showModal={showModal}
        />
      )}
    </div>
  );
};

export default MovieDetail;
