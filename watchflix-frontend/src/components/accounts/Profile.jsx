import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axiosPrivate from '../../api/axios';
import AuthContext from '../../context/AuthProvider';
import user_icon from '../../assets/img/user_icon.png';

const Profile = () => {
  const { auth } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  const username = auth?.username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosPrivate.get(`/user-profiles/${username}`);
        setProfile(response.data);
        setUpdatedProfile(response.data); // Initialize updatedProfile with current profile data
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosPrivate.put(`/user-profiles/${username}`, updatedProfile);
      setProfile(updatedProfile); // Update local state with new profile data
      setEditMode(false); // Exit edit mode
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChangePassword = () => {
    // Use navigate to redirect to the change password page
    navigate('/change-password');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Учитавање...</span>
        </div>
      </div>
    );
  }

  if (!profile) return <p className="text-center text-danger">Неуспешно учитавање профила</p>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg bg-dark text-light">
            <div className="card-header bg-dark text-white text-center">
              <h2>Кориснички профил</h2>
            </div>
            <div className="card-body">
              <div className="mb-4 text-center">
                <img
                  src={profile.avatar || user_icon}
                  alt="User Avatar"
                  className="rounded-circle img-thumbnail"
                  width="150"
                  height="150"
                />
              </div>

              {editMode ? (
                <form onSubmit={handleProfileUpdate}>
                  <h5 className="card-title text-center"><strong>{profile.user.username}</strong></h5>
                  <div className="form-group">
                    <label>Име</label>
                    <input
                      type="text"
                      name="first_name"
                      value={updatedProfile.first_name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Презиме</label>
                    <input
                      type="text"
                      name="last_name"
                      value={updatedProfile.user.last_name || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Датум рођења</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={updatedProfile.birth_date || ''}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-success mt-3">Сачувај промене</button>
                  <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary mt-3 ml-2">Откажи</button>
                </form>
              ) : (
                <>
                  <h5 className="card-title text-center"><strong>{profile.user.username}</strong></h5>
                  <p className="text-center">
                    <strong>Име:</strong> {profile.user.first_name}
                  </p>
                  <p className="text-center">
                    <strong>Презиме:</strong> {profile.user.last_name}
                  </p>
                  <p className="text-center">
                    <strong>Датум рођења:</strong> {profile.birth_date}
                  </p>

                  <p className="text-center mt-4">
                    <strong>План претплате:</strong> {profile.subscription_plan ? (
                      <> {profile.subscription_plan.name} </> 
                    ) : (
                      <p className="text-muted">Нисте претплаћени</p>
                    )}
                  </p>

                  <div className="text-center mt-4">
                    <button onClick={() => setEditMode(true)} className="btn btn-primary">Измени профил</button>
                    <button onClick={handleChangePassword} className="btn btn-warning ms-2">Промени лозинку</button>
                  </div>

                  {/* Followed Actors */}
                  <div className="text-center mt-4">
                    <h5>Пратите глумце</h5>
                    {profile.followed_actors && profile.followed_actors.length > 0 ? (
                      <div className="row">
                        {profile.followed_actors.map((actor) => (
                          <div className="col-md-6" key={actor.id}>
                            <div className="card border-light mb-3 shadow-sm bg-secondary">
                              <div className="card-body">
                                <Link to={`/actors/${actor.id}`} className="text-warning">
                                  <h6>{actor.first_name} {actor.last_name}</h6>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">Не пратите глумце</p>
                    )}
                  </div>

                  {/* Followed Directors */}
                  <div className="text-center mt-4">
                    <h5>Пратите режисере</h5>
                    {profile.followed_directors && profile.followed_directors.length > 0 ? (
                      <div className="row">
                        {profile.followed_directors.map((director) => (
                          <div className="col-md-6" key={director.id}>
                            <div className="card border-light mb-3 shadow-sm bg-secondary">
                              <div className="card-body">
                                <Link to={`/directors/${director.id}`} className="text-warning">
                                  <h6>{director.first_name} {director.last_name}</h6>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">Не пратите режисере</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
4