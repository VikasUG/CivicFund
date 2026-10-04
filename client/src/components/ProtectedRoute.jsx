import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from '../context';

const ProtectedRoute = ({ allowedUserTypes, children }) => {
  const { userType } = useStateContext();

  if (!allowedUserTypes.includes(userType)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
