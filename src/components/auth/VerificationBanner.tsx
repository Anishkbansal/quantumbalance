import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MailCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface VerificationBannerProps {
  showBypass?: boolean; // For development or testing only
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ showBypass = false }) => {
  const navigate = useNavigate();
  const { user, resendVerificationCode } = useAuth();
  
  // Don't show banner if user is not logged in, is verified, or is admin
  if (!user || user.isVerified === true || user.isAdmin) {
    return null;
  }
  
  const handleVerifyClick = () => {
    navigate('/verify-email');
  };
  
  const handleResendClick = async () => {
    if (user.email) {
      try {
        await resendVerificationCode(user.email);
        // The user will be redirected to the verification page
        navigate('/verify-email');
      } catch (error) {
        console.error('Failed to resend verification code:', error);
      }
    }
  };
  
  return (
    <div className="bg-orange-600/90 border-b border-orange-700 py-3 px-4 w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-white mr-2 flex-shrink-0" />
          <div>
            <p className="text-white font-medium">
              Your email address is not verified
            </p>
            <p className="text-orange-100 text-sm">
              Please verify your email to access all features and receive important notifications.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleVerifyClick}
            className="px-4 py-1.5 bg-white text-orange-800 rounded-md font-medium hover:bg-orange-100 flex items-center transition-colors"
          >
            <MailCheck className="w-4 h-4 mr-1.5" />
            Verify Now
          </button>
          
          <button
            onClick={handleResendClick}
            className="px-4 py-1.5 bg-orange-700 text-white rounded-md font-medium hover:bg-orange-800 transition-colors"
          >
            Resend Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner; 