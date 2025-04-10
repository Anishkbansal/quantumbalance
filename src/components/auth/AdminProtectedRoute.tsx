import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Frontend-only implementation
// Simply renders children without any protection
const AdminProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to dashboard if not an admin
  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render protected admin content
  return <Outlet />;
};

export default AdminProtectedRoute; 