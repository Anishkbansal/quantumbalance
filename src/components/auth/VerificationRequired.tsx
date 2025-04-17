import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Component to protect routes that require verification
const VerificationRequired: React.FC = () => {
  const { user, loading, isVerified } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="animate-spin h-10 w-10 border-4 border-gold-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not verified and not an admin, redirect to verify email page
  if (!isVerified && !user.isAdmin) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // If user is authenticated and verified (or is admin), render protected content
  return <Outlet />;
};

export default VerificationRequired; 