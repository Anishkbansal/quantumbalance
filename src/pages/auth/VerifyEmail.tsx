import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EmailVerification from '../../components/auth/EmailVerification';

const VerifyEmail: React.FC = () => {
  const { 
    user, 
    isVerified, 
    pendingVerificationEmail,
    updateUser
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  // Get email from auth context or user object
  const email = pendingVerificationEmail || user?.email || '';
  
  // Redirect if already verified
  useEffect(() => {
    if (isVerified) {
      navigate(from, { replace: true });
    }
  }, [isVerified, navigate, from]);

  // Handle successful verification
  const handleVerified = (data: any) => {
    if (data.user) {
      updateUser(data.user);
      
      // Allow some time for the success message to be seen
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Verify Your Email</h1>
          <p className="text-navy-300 mt-2">
            We need to verify your email before you can continue
          </p>
        </div>
        
        <EmailVerification 
          email={email} 
          onVerified={handleVerified} 
        />
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center text-navy-300 hover:text-gold-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 