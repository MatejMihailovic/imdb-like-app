import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/MovieCard.css'; 

export default function MovieCard({ movie, rating }) {
  return (
    <div className="card bg-dark text-light h-auto movie-card">
      <Link to={`/movies/${movie.id}`}>
        <img src={movie.poster_url} className="card-img-top movie-card-img" alt={movie.title} />
      </Link>
      <div className="card-body movie-card-body">
        <h5 className="card-title">{movie.title} ({movie.release_year})</h5>
        {movie.avg_rating && (
          <p className="card-text">
            <strong>Просечна оцена: </strong> {parseFloat(movie.avg_rating).toFixed(2)}
          </p>
        )}
        {rating !== undefined && (
          <p className="card-text">
          <strong>Ваша оцена: </strong> {parseFloat(rating).toFixed(2)}
        </p>
        )}
      </div>
    </div>
  );
};
