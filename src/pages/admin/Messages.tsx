import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminMessaging from '../../components/messaging/AdminMessaging';
import { useNavigate } from 'react-router-dom';

const AdminMessages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  if (!user) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gold-500">User Messages</h1>
        <p className="text-navy-300">
          Manage communications with users. Click on a conversation to view and reply to messages.
        </p>
      </div>
      
      <div className="bg-navy-800 rounded-lg shadow-md border border-navy-700">
        <AdminMessaging />
      </div>
    </div>
  );
};

export default AdminMessages; 