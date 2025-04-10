import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Basic authentication protection
const ProtectedRoute: React.FC = () => {
  const { user, loading, requiresVerification } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="animate-spin h-10 w-10 border-4 border-gold-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // The deeper VerificationRequired component will handle checking email verification
  return <Outlet />;
};

export default ProtectedRoute; 