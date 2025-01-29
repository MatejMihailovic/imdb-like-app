import { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import axiosPrivate from "../../api/axios";

const Login = () => {
  const { auth, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.username) {
      navigate("/home");
    }
  }, [auth, navigate]);

  const checkAdminStatus = async (username) => {
    try {
      const response = await axiosPrivate.get(`/user-profiles/${username}/is-admin/`);
      return response.data.is_admin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);

    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      const isAdmin = await checkAdminStatus(username);
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
      setErrorMessage('');
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-4 text-center">
          <h1><strong>WATCHFLIX</strong></h1>
          <h4 className="text-warning mb-6">Највећа колекција филмова</h4>
          
          <h2 className="text-center mb-4 mt-4">Пријава</h2>
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div data-mdb-input-init className="form-outline mb-4">
              <input
                type="text"
                id="form2Example1"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label className="form-label" htmlFor="form2Example1">Корисничко име</label>
            </div>

            <div data-mdb-input-init className="form-outline mb-4">
              <input
                type="password"
                id="form2Example2"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="form-label" htmlFor="form2Example2">Лозинка</label>
            </div>

            <div className="row mb-4">
              <div className="col d-flex justify-content-center">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="form2Example31" />
                  <label className="form-check-label" htmlFor="form2Example31"> Упамти ме </label>
                </div>
              </div>

              <div className="col">
                <a href="#!">Заборавили сте шифру?</a>
              </div>
            </div>

            <div className="row mb-4">
              <button type="submit" className="btn btn-primary btn-block mb-4">Пријавите се</button>
            </div>
            <div className="text-center">
              <p>Немате налог? <Link to="/register">Креирајте налог</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
