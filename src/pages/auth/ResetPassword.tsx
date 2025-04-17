import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Token validation
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifying(true);
        setError(null);
        
        // Check if token is provided
        if (!token) {
          setError('Invalid password reset link');
          setTokenValid(false);
          return;
        }
        
        // For the initial load, we'll just assume the token is valid
        // The actual validation will happen when the user submits the form
        setTokenValid(true);
        
      } catch (err: any) {
        console.error('Error verifying reset token:', err);
        setError(err.message || 'Invalid or expired reset link');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleSubmit = async (e: React.FormEvent) => {
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
        token,
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
      
      // If token is invalid, mark it as invalid to show the proper UI
      if (err.response?.status === 400 && err.response?.data?.message?.includes('token')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-navy-300">Verifying your reset link...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
          <p className="text-navy-300 mt-2">
            Create a new strong password for your account
          </p>
        </div>
        
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          {!tokenValid ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-900/30 mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Invalid Reset Link</h2>
              <p className="text-navy-300 mb-6">
                {error || 'The password reset link is invalid or has expired.'}
              </p>
              <Link 
                to="/forgot-password" 
                className="inline-flex items-center px-4 py-2 bg-gold-500 text-navy-900 rounded-lg hover:bg-gold-400 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Request New Link
              </Link>
            </div>
          ) : success ? (
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
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
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
              </form>
              
              <div className="text-center mt-6">
                <p className="text-navy-300">
                  <Link to="/login" className="text-gold-500 hover:text-gold-400 font-medium">
                    <ArrowLeft className="w-4 h-4 inline mr-1" />
                    Back to Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 