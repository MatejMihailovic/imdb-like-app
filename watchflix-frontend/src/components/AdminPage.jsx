import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthProvider';
import {axiosPrivate} from '../api/axios';
import { Spinner, Table, Button, InputGroup, FormControl } from 'react-bootstrap';

const AdminPage = () => {
    const { auth } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [movies, setMovies] = useState([]);
    const [imdbUrl, setImdbUrl] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userSearch, setUserSearch] = useState(''); 
    const [movieSearch, setMovieSearch] = useState(''); 
    const username = auth?.username;
    const navigate = useNavigate();

    useEffect(() => {
        if (username) {
            checkAdminStatus();
        } else {
            navigate('/login');
        }
    }, [username]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    };

    const checkAdminStatus = async () => {
        try {
            const response = await axiosPrivate.get(`/user-profiles/${username}/is-admin/`);
            if (response.data.is_admin) {
                setIsAdmin(true);
                fetchUsers();
                fetchMovies();
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axiosPrivate.get('/user-profiles/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchMovies = async () => {
        try {
            const response = await axiosPrivate.get('/movies/'); 
            setMovies(response.data);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };

    const deleteUser = async (username) => {
        const confirmDelete = window.confirm(`Да ли сте сигурни да желите да обришете корисника ${username}?`);
        if (confirmDelete) {
            try {
                await axiosPrivate.delete(`/user-profiles/${username}/`);
                setUsers(users.filter(user => user.user.username !== username));
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const deleteMovie = async (id, title) => {
        const confirmDelete = window.confirm(`Да ли сте сигурни да желите да обришете филм "${title}"?`);
        if (confirmDelete) {
            try {
                await axiosPrivate.delete(`/movies/${id}/`);
                setMovies(movies.filter(movie => movie.id !== id));
            } catch (error) {
                console.error('Error deleting movie:', error);
            }
        }
    };

    const addMovieByIMDb = async () => {
        try {
            const response = await axiosPrivate.post('/movie/add/', { imdb_url: imdbUrl });
            setMessage('Успешно додавање филма Tangled (2010)');
            setImdbUrl('');
            fetchMovies(); 
        } catch (error) {
            setMessage('Error adding movie from IMDb URL');
        }
    };

    const filteredUsers = users.filter(user =>
        user.user.username.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredMovies = movies.filter(movie =>
        movie.title.toLowerCase().includes(movieSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return isAdmin ? (
        <div className="container mt-5">
            <h1 className="mb-4 text-center">Admin Dashboard</h1>

            <h2 className="text-center">Корисници</h2>
            <InputGroup className="mb-3" style={{ maxWidth: '300px', margin: 'auto' }}>
                <FormControl
                    placeholder="Претражи по корисничком имену"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                />
            </InputGroup>
            <div className="d-flex justify-content-center">
                <div className="table-responsive mb-3" style={{ maxHeight: '300px', overflowY: 'scroll' }}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Корисничко име</th>
                                <th>Име</th>
                                <th>Презиме</th>
                                <th>Претплата</th>
                                <th>Креиран</th>
                                <th>Акције</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.user.username}</td>
                                    <td>{user.user.first_name}</td>
                                    <td>{user.user.last_name}</td>
                                    <td>{user.subscription_plan?.name}</td>
                                    <td>{formatDate(user.created_at)}</td>
                                    <td>
                                        <Button 
                                            variant="danger" 
                                            onClick={() => deleteUser(user.user.username)}
                                        >
                                            Уклони
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>

            <h2 className="text-center">Филмови</h2>
            <InputGroup className="mb-3" style={{ maxWidth: '300px', margin: 'auto' }}>
                <FormControl
                    placeholder="Претражи по наслову филма"
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                />
            </InputGroup>
            <div className="d-flex justify-content-center">
                <div className="table-responsive mb-3" style={{ maxHeight: '300px', overflowY: 'scroll' }}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Наслов</th>
                                <th>Година издања</th>
                                <th>Трајање</th>
                                <th>Акције</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovies.map(movie => (
                                <tr key={movie.id}>
                                    <td>{movie.title}</td>
                                    <td>{movie.release_year}</td>
                                    <td>{movie.duration} минута</td>
                                    <td>
                                        <Button 
                                            variant="danger" 
                                            onClick={() => deleteMovie(movie.id, movie.title)}
                                        >
                                            Уклони
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>
            <InputGroup className="mb-3" style={{ maxWidth: '600px', margin: 'auto' }}>
                <FormControl
                    placeholder="Paste IMDb URL here"
                    value={imdbUrl}
                    onChange={(e) => setImdbUrl(e.target.value)}
                />
                <Button variant="primary" onClick={addMovieByIMDb}>
                    Додај Филм
                </Button>
            </InputGroup>

            {message && <div className="alert alert-info">{message}</div>}
        </div>
    ) : null;
};

export default AdminPage;
