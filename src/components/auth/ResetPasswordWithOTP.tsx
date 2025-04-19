import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface ResetPasswordWithOTPProps {
  email: string;
  isAdmin?: boolean;
  onBack?: () => void;
}

const ResetPasswordWithOTP: React.FC<ResetPasswordWithOTPProps> = ({ 
  email, 
  isAdmin = false,
  onBack 
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Handle OTP verification
  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Just verify OTP format for now, actual verification happens with password reset
      if (otp.length < 6) {
        throw new Error('Please enter a valid verification code');
      }
      
      // If this was admin and we need extra validation, we'd do it here
      
      // Move to password step
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password reset
  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the real API endpoint
      const response = await axios.post('/api/auth/reset-password', {
        email,
        code: otp,
        password
      });
      
      if (response.data.success) {
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
  // Go back to OTP step
  const goBackToOTP = () => {
    setStep('otp');
    setError(null);
  };
  
  if (success) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-900/30 mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Password Reset Successful</h2>
        <p className="text-navy-300 mb-6">
          Your password has been updated successfully. You'll be redirected to the login page in a moment.
        </p>
        <Link 
          to="/login" 
          className="text-gold-500 hover:text-gold-400 font-medium"
        >
          Sign In Now
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {step === 'otp' ? (
        <form onSubmit={verifyOTP}>
          <div className="mb-6">
            <label htmlFor="otp" className="block text-sm font-medium text-navy-300 mb-2">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              className="w-full px-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <p className="mt-1 text-sm text-navy-400">
              Enter the 6-digit code sent to your email
            </p>
          </div>
          
          <div className="mb-6">
            <button
              type="submit"
              className="w-full py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-navy-900 border-t-transparent rounded-full mr-2"></div>
                  Verifying Code...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={resetPassword}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-navy-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-navy-500" />
              </div>
              <input
                id="password"
                type="password"
                className="w-full pl-10 pr-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <p className="mt-1 text-sm text-navy-400">
              Must be at least 8 characters
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-navy-500" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                className="w-full pl-10 pr-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <button
              type="submit"
              className="w-full py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-navy-900 border-t-transparent rounded-full mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={goBackToOTP}
              className="text-gold-500 hover:text-gold-400 font-medium"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Verification Code
            </button>
          </div>
        </form>
      )}
      
      {onBack && (
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onBack}
            className="text-gold-500 hover:text-gold-400 font-medium"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Email
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordWithOTP; 