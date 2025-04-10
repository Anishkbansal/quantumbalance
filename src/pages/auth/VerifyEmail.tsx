import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MailCheck, CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VerifyEmail: React.FC = () => {
  const { 
    user, 
    verifyEmail, 
    resendVerificationCode, 
    isVerified, 
    pendingVerificationEmail,
    loading: authLoading 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Initialize email from auth context or user object
  useEffect(() => {
    if (pendingVerificationEmail) {
      setEmail(pendingVerificationEmail);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [pendingVerificationEmail, user]);

  // Handle countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if already verified
  useEffect(() => {
    if (isVerified) {
      navigate(from, { replace: true });
    }
  }, [isVerified, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await verifyEmail(email, code);
      setSuccess(true);
      // The redirect will happen in the useEffect when isVerified changes
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    setLoading(true);
    
    try {
      await resendVerificationCode(email);
      setResendCooldown(60); // Start 60 second cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Email Verified!</h2>
            <p className="text-navy-300 mb-6">
              Your email has been successfully verified. You now have full access to all features.
            </p>
            <p className="text-navy-400 text-sm">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Verify Your Email</h1>
          <p className="text-navy-300 mt-2">
            Enter the verification code sent to your email
          </p>
        </div>
        
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mb-6 p-4 bg-navy-700 rounded-lg flex items-start">
            <Mail className="h-6 w-6 text-gold-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-white mb-1">Check your inbox</h3>
              <p className="text-navy-300 text-sm">
                Please enter the 6-digit verification code to verify your email address.
              </p>
              <p className="mt-2 text-gold-500 font-medium text-sm">
                {email}
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="code" className="block text-sm font-medium text-navy-300 mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                className="w-full p-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-center tracking-wider font-mono text-lg"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                maxLength={6}
              />
              <p className="mt-2 text-sm text-navy-400">
                For demo purposes, use code: 123456
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <button
                type="submit"
                className="py-3 px-6 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition flex-1 flex items-center justify-center"
                disabled={loading || authLoading}
              >
                {loading || authLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-navy-900 border-t-transparent rounded-full mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <MailCheck className="w-5 h-5 mr-2" />
                    Verify Email
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || authLoading || resendCooldown > 0}
                className={`py-3 px-6 border font-medium rounded-lg transition flex items-center justify-center ${
                  resendCooldown > 0 || loading || authLoading
                    ? 'border-navy-600 text-navy-500 cursor-not-allowed'
                    : 'border-gold-500 text-gold-500 hover:bg-navy-700'
                }`}
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-navy-700 text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-navy-300 hover:text-gold-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 