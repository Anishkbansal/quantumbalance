import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import ResetPasswordWithOTP from '../../components/auth/ResetPasswordWithOTP';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
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
        // Show OTP form instead of success message
        setShowOtpForm(true);
        // Set isAdmin if the user is an admin (from backend response)
        if (response.data.isAdmin) {
          setIsAdmin(response.data.isAdmin);
        }
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
  
  const goBackToEmail = () => {
    setShowOtpForm(false);
    setIsAdmin(false);
    setError(null);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
          <p className="text-navy-300 mt-2">
            {!showOtpForm 
              ? 'Enter your email address and we\'ll send you a verification code'
              : 'Enter the verification code sent to your email'}
          </p>
        </div>
        
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          {showOtpForm ? (
            <ResetPasswordWithOTP 
              email={email} 
              isAdmin={isAdmin}
              onBack={goBackToEmail}
            />
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
                        Sending Verification Code...
                      </>
                    ) : (
                      'Send Verification Code'
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