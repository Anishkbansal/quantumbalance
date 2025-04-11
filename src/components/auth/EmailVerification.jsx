import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/constants';

/**
 * Email Verification Component
 * Handles requesting and submitting verification codes
 */
const EmailVerification = ({ email, onVerified }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Request a verification code
  const requestCode = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/send-verification`, { email });
      
      if (response.data.success) {
        setResendCooldown(60); // Start 60 second cooldown
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Verify the code
  const verifyCode = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, { 
        email, 
        code 
      });
      
      if (response.data.success) {
        setSuccess(true);
        if (onVerified && typeof onVerified === 'function') {
          onVerified(response.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Request verification code on first render
  useEffect(() => {
    requestCode();
  }, []);

  return (
    <div className="w-full max-w-md">
      <div className="bg-navy-800 rounded-lg p-6 shadow-lg border border-navy-700">
        {success ? (
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-900/30 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Email Verified!</h3>
            <p className="text-navy-300">
              Your email has been successfully verified.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-medium text-white mb-4">Verify Your Email</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-navy-300 mb-2">
                We've sent a verification code to:
              </p>
              <p className="text-gold-500 font-medium">
                {email}
              </p>
            </div>
            
            <form onSubmit={verifyCode}>
              <div className="mb-4">
                <label htmlFor="code" className="block text-navy-300 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="w-full p-3 bg-navy-700 border border-navy-600 rounded-md text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={loading || resendCooldown > 0}
                  className="text-sm text-navy-300 hover:text-gold-500 disabled:text-navy-500 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend Code'}
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="px-4 py-2 bg-gold-500 text-navy-900 rounded-md font-medium hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 