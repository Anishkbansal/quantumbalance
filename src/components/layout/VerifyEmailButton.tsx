import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Simple demo button with no backend logic
const VerifyEmailButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Only render if user exists AND is not verified
  if (!user || user.isVerified === true) {
    return null;
  }
  
  return (
    <button
      onClick={() => navigate('/verify-email')}
      className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors text-sm"
    >
      <MailCheck className="w-4 h-4" />
      <span>Verify Email Now</span>
    </button>
  );
};

export default VerifyEmailButton; 