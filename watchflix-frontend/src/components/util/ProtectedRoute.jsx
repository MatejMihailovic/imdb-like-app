import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthProvider';

const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { auth } = useContext(AuthContext);

  if (!auth || !auth.accessToken) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
