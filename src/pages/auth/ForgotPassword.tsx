import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the real API endpoint
      const response = await axios.post('/api/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
          <p className="text-navy-300 mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>
        
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          {success ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-navy-300 mb-6">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. 
                The link will expire in 1 hour.
              </p>
              <p className="text-navy-400 text-sm mb-6">
                If you don't see the email, please check your spam folder or 
                <button 
                  onClick={handleSubmit}
                  className="text-gold-500 hover:text-gold-400 font-medium ml-1"
                  disabled={loading}
                >
                  try again
                </button>.
              </p>
              <Link 
                to="/login" 
                className="text-gold-500 hover:text-gold-400 font-medium"
              >
                Return to Login
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
                  <label htmlFor="email" className="block text-sm font-medium text-navy-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-navy-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className="w-full pl-10 pr-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        Sending Reset Link...
                      </>
                    ) : (
                      'Send Reset Link'
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

export default ForgotPassword; 