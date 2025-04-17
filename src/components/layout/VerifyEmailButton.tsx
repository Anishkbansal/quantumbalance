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
      className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors text-xs sm:text-sm whitespace-nowrap"
    >
      <MailCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="truncate">Verify Email Now</span>
    </button>
  );
};

export default VerifyEmailButton; 