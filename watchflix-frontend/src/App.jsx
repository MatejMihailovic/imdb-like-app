import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/accounts/Profile';
import SubscriptionPlans from './components/accounts/SubscriptionPlans';
import NotFound from './components/util/NotFound';
import Homepage from './components/Homepage';
import Header from './components/util/Header';
import ProtectedRoute from './components/util/ProtectedRoute';
import MovieDetail from './components/movies/MovieDetail';
import ActorDetail from './components/ActorDetail';
import DirectorDetail from './components/DirectorDetail';
import MoviesPage from './components/movies/MoviesPage';
import AdminPage from './components/AdminPage';

export default function App() {
  const location = useLocation();

  const hideHeaderPaths = ['/', '/register'];
  const hideHeader = hideHeaderPaths.includes(location.pathname);

  return (
    <div className="bg-dark text-light" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/register" element={<Register/>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Homepage/>} />
          <Route path="/admin" element={<AdminPage/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/subscription-plans" element={<SubscriptionPlans/>} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/actors/:id"  element={<ActorDetail />} />
          <Route path="/directors/:id" element={<DirectorDetail/>} />
        </Route>

        {/* If no other routes are hooked, throw 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}