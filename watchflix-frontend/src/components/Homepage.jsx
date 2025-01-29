import React, { useState, useContext, useEffect } from 'react';
import MovieList from '../components/movies/MovieList';
import { axiosPrivate } from '../api/axios'; 
import AuthContext from '../context/AuthProvider';

const Homepage = () => {
    const { auth } = useContext(AuthContext);
    const [watchedMovies, setWatchedMovies] = useState([]);
    const [userBasedMovies, setUserBasedMovies] = useState([]);
    const [followBasedMovies, setFollowBasedMovies] = useState([]);
    
    const [watchedMoviesGenres, setWatchedMoviesGenres] = useState([]);
    const [userBasedMoviesGenres, setUserBasedMoviesGenres] = useState([]);
    const [followBasedMoviesGenres, setFollowBasedMoviesGenres] = useState([]);

    const [loadingWatched, setLoadingWatched] = useState(true);
    const [loadingUserBased, setLoadingUserBased] = useState(true);
    const [loadingFollowBased, setLoadingFollowBased] = useState(true);
    
    const [errorWatched, setErrorWatched] = useState(null);
    const [errorUserBased, setErrorUserBased] = useState(null);
    const [errorFollowBased, setErrorFollowBased] = useState(null);

    const username = auth?.username;

    useEffect(() => {
        if (username) {
            // Fetch watched movies
            const fetchWatchedMovies = async () => {
                try {
                    const response = await axiosPrivate.get(`/watch-history/user/${username}`);
                    setWatchedMovies(response.data.user_watched_movies || []);
                    setWatchedMoviesGenres(response.data.genres || []);
                } catch (err) {
                    setErrorWatched(err);
                } finally {
                    setLoadingWatched(false);
                }
            };

            // Fetch follow-based recommendations
            const fetchFollowBasedMovies = async () => {
                try {
                    const response = await axiosPrivate.get(`/recommendations/neo4j/follow-based/${username}`);
                    setFollowBasedMovies(response.data.recommendations || []);
                    setFollowBasedMoviesGenres(response.data.genres || []);
                } catch (err) {
                    setErrorFollowBased(err);
                } finally {
                    setLoadingFollowBased(false);
                }
            };
            
            // Fetch user-based recommendations
            const fetchUserBasedMovies = async () => {
                try {
                    const response = await axiosPrivate.get(`/recommendations/neo4j/user-based/${username}`);
                    setUserBasedMovies(response.data.recommendations || []);
                    setUserBasedMoviesGenres(response.data.genres || []);
                } catch (err) {
                    setErrorUserBased(err);
                } finally {
                    setLoadingUserBased(false);
                }
            };
            
            fetchWatchedMovies();
            fetchFollowBasedMovies();
            fetchUserBasedMovies();
        }
    }, [username]);

    return (
        <div>
            <div className="pt-5">
                
                {/* Watched Movies */}
                <section className="mb-5">
                    {loadingWatched ? (
                        <div className="text-light text-center">Учитавање погледаних филмова...</div>
                    ) : errorWatched ? (
                        <div className="text-danger text-center">Грешка: {errorWatched.message}</div>
                    ) : watchedMovies.length > 0 ? (
                        <MovieList title="Гледали сте" movies={watchedMovies} genres={watchedMoviesGenres}  />
                    ) : (
                        <div className="text-light text-center">Немате погледаних филмова</div>
                    )}
                </section>

                {/* Follow-based Recommendations */}
                <section className="mb-5">
                    {loadingFollowBased ? (
                        <div className="text-light text-center">Учитавање препорука...</div>
                    ) : errorFollowBased ? (
                        <div className="text-danger text-center">Грешка приликом учитавања препорука: {errorFollowBased.message}</div>
                    ) : followBasedMovies.length > 0 ? (
                        <MovieList title="Зато што пратите" movies={followBasedMovies} genres={followBasedMoviesGenres} />
                    ) : (
                        <div className="text-light text-center">Нема препорука</div>
                    )}
                </section>

                {/* User-based Recommendations */}
                <section className="mb-5">
                    {loadingUserBased ? (
                        <div className="text-light text-center">Учитавање препорука од других корисника...</div>
                    ) : errorUserBased ? (
                        <div className="text-danger text-center">Грешка приликом учитавања препорука од других корисника: {errorUserBased.message}</div>
                    ) : userBasedMovies.length > 0 ? (
                        <MovieList title="Шта су други гледали" movies={userBasedMovies} genres={userBasedMoviesGenres} />
                    ) : (
                        <div className="text-light text-center">Нема препорука</div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Homepage;
