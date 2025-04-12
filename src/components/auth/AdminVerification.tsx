import React, { useState, useEffect } from 'react';
import { Alert, Shield, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminVerification: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  
  const { 
    error, 
    verifyAdminLogin, 
    resendAdminVerificationCode, 
    pendingAdminEmail 
  } = useAuth();
  
  useEffect(() => {
    if (error && error.includes('expired')) {
      setCodeExpired(true);
    }
  }, [error]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code
    if (!verificationCode.trim() || verificationCode.length < 6) {
      return;
    }
    
    setIsSubmitting(true);
    setCodeExpired(false);
    
    try {
      if (pendingAdminEmail) {
        await verifyAdminLogin(pendingAdminEmail, verificationCode);
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!pendingAdminEmail || resendLoading) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    setCodeExpired(false);
    
    try {
      await resendAdminVerificationCode(pendingAdminEmail);
      setResendSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error resending code:', err);
    } finally {
      setResendLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto p-6 bg-navy-800 rounded-lg shadow-xl border border-navy-700">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 text-gold-500">
        <Shield className="h-8 w-8" />
      </div>
      
      <h2 className="text-2xl font-semibold text-white mb-2 text-center">
        Admin Security Verification
      </h2>
      
      <p className="text-navy-300 mb-6 text-center">
        For security reasons, we've sent a verification code to your email.
      </p>
      
      {error && !resendSuccess && (
        <div className="w-full mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-start">
          <Alert className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      {resendSuccess && (
        <div className="w-full mb-4 p-3 bg-green-900/30 border border-green-800 rounded-md flex items-start">
          <MailCheck className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-300">A new verification code has been sent to your email.</p>
        </div>
      )}
      
      {codeExpired && (
        <div className="w-full mb-4 p-3 bg-orange-900/30 border border-orange-800 rounded-md flex items-start">
          <Alert className="w-5 h-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-orange-300">
            Your verification code has expired. Please request a new one.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="verificationCode" className="block text-sm font-medium text-navy-300 mb-1">
            Verification Code
          </label>
          <input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full px-4 py-2 bg-navy-750 border border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-white text-center tracking-widest text-xl"
            placeholder="Enter 6-digit code"
            maxLength={6}
            autoComplete="one-time-code"
            required
          />
          <p className="mt-1 text-xs text-navy-400">
            Enter the 6-digit code sent to {pendingAdminEmail}
          </p>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !verificationCode}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              isSubmitting || !verificationCode
                ? 'bg-navy-600 text-navy-400 cursor-not-allowed'
                : 'bg-gold-500 hover:bg-gold-600 text-navy-900'
            } transition-colors flex justify-center items-center`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-navy-900 border-t-transparent rounded-full mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify & Login'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="mt-4 text-gold-500 hover:text-gold-400 text-sm w-full flex justify-center items-center"
          >
            {resendLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-gold-500 border-t-transparent rounded-full mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Resend verification code
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminVerification; 