import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { axiosPrivate } from '../../api/axios';  

const Register = () => {
  const { auth, register } = useAuth();
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null); 
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (auth?.username) {
      alert("Већ сте пријављени!");
      navigate("/");
    }

    const fetchSubscriptionPlans = async () => {
      try {
        const response = await axiosPrivate.get(`/accounts/subscription-plans/`);
        setSubscriptionPlans(response.data || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchSubscriptionPlans();
  }, [auth, navigate]);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState(''); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      setMessage("Молимо вас да изаберете план претплате.");
      return;
    }

    const userData = {
      user: {
        username: username,
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName
      },
      birth_date: birthDate,
      subscription_plan: selectedPlan  
    };

    try {
      const result = await register(userData);
      if (result.success) {
        navigate("/");
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage("Дошло је до грешке током регистрације.");
      console.error(error);
    }
  };

  return (
    <div className="container mt-5 bg-dark text-light p-5 rounded"> {/* Dark background with padding and rounded corners */}
      <div className="row justify-content-center">
        <div className="col-md-8"> {/* Larger width */}
          <div className="card bg-dark text-light"> {/* Dark background for the card */}
            <div className="card-body">
              <h2 className="card-title text-center">Регистрација</h2>
              {message && <div className="alert alert-danger">{message}</div>}
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6"> {/* First Column */}
                    <div className="mb-3">
                      <label className="form-label">Корисничко име</label>
                      <input
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Емаил</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Лозинка</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6"> {/* Second Column */}
                    <div className="mb-3">
                      <label className="form-label">Име</label>
                      <input
                        type="text"
                        className="form-control"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Презиме</label>
                      <input
                        type="text"
                        className="form-control"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Датум рођења</label>
                      <input
                        type="date"
                        className="form-control"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Plan Selection */}
                <div className="mb-3">
                  <label className="form-label">Изаберите план претплате</label>
                  <div className="row">
                    {subscriptionPlans.map((plan) => (
                      <div key={plan.id} className="col-md-6 mb-3">
                        <div className={`card ${selectedPlan === plan.id ? 'border-primary' : ''}`}>
                          <div className="card-body">
                            <h5 className="card-title">{plan.name}</h5>
                            <ul className="list-group mb-3">
                              {plan.features.map((feature) => (
                                <li key={feature.id} className="list-group-item">
                                  {feature.description}
                                </li>
                              ))}
                            </ul>
                            <p className="card-text">Цена: {plan.price} $ месечно</p>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="subscriptionPlan"
                                value={plan.id}
                                onChange={() => setSelectedPlan(plan.id)}
                                checked={selectedPlan === plan.id}
                              />
                              <label className="form-check-label">
                                Изабери овај план
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Региструј се
                </button>
              </form>

              <div className="mt-3 text-center">
                <p>
                  Већ имате налог? <Link to="/">Пријавите се овде</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
