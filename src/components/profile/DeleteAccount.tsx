import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardHeader } from '../ui/Card';
import { Button, Input } from '../ui/FormElements';
import { ErrorMessage, SuccessMessage, WarningMessage } from '../ui/Messages';

interface DeleteAccountProps {
  hasActivePackage: boolean;
}

const CONFIRMATION_TEXT = 'delete my account';

export default function DeleteAccount({ hasActivePackage }: DeleteAccountProps) {
  const [showModal, setShowModal] = useState(false);
  const [deletionCode, setDeletionCode] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestCodeLoading, setRequestCodeLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const handleRequestDeletionCode = async () => {
    setRequestCodeLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Simulate API call to send code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCodeRequested(true);
      setSuccess('A verification code has been sent to your email.');
      
      // For development: auto-fill the code (remove in production)
      // setDeletionCode('123456');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setRequestCodeLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deletionCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate code verification
    setTimeout(() => {
      // Accept any code in development/testing environment
      setSuccess('Code verified. Please confirm deletion by typing the phrase below.');
      setCodeVerified(true);
      setLoading(false);
    }, 1000);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmationText.toLowerCase() !== CONFIRMATION_TEXT) {
      setError(`Please type "${CONFIRMATION_TEXT}" exactly to confirm deletion`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/delete-account',
        { deletionCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Account deleted successfully. Redirecting to login...');
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login after short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setShowModal(false);
    setDeletionCode('');
    setConfirmationText('');
    setError('');
    setSuccess('');
    setCodeRequested(false);
    setCodeVerified(false);
  };

  return (
    <Card>
      <CardHeader title="Delete Account" />
      
      <p className="text-navy-300 mb-4">
        This action is permanent and cannot be undone. All your data will be permanently removed.
      </p>
      
      {hasActivePackage && (
        <WarningMessage className="mb-4">
          <p className="font-semibold">
            Warning: You have an active package subscription
          </p>
          <p className="text-sm mt-1">
            Deleting your account will also remove all your active packages and subscriptions.
            You will lose access to all your prescriptions and healing data.
          </p>
        </WarningMessage>
      )}
      
      <Button
        onClick={() => setShowModal(true)}
        variant="danger"
      >
        Delete Account
      </Button>
      
      {/* Delete Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-navy-800 rounded-lg w-full max-w-md p-6 border border-navy-700 shadow-lg">
            <h3 className="text-xl font-bold text-gold-500 mb-4">Account Deletion</h3>
            
            <ErrorMessage className="mb-4">{error}</ErrorMessage>
            <SuccessMessage className="mb-4">{success}</SuccessMessage>
            
            <div className="bg-red-900/30 border border-red-700 rounded-md p-4 mb-6">
              <p className="text-white font-semibold mb-2">Warning: This action cannot be undone</p>
              <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
                <li>Your account will be permanently deleted</li>
                <li>All your personal data will be removed</li>
                {hasActivePackage && (
                  <li className="font-semibold">Your active packages and subscriptions will be lost</li>
                )}
                <li>All your prescriptions and health data will be deleted</li>
                <li>You cannot recover your account after deletion</li>
              </ul>
            </div>
            
            {!codeRequested ? (
              <div className="space-y-4">
                <p className="text-navy-300">
                  To proceed with account deletion, we'll send a verification code to your email.
                </p>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    onClick={() => resetState()}
                    variant="secondary"
                    disabled={requestCodeLoading}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleRequestDeletionCode}
                    variant="danger"
                    loading={requestCodeLoading}
                    disabled={requestCodeLoading}
                  >
                    Send Verification Code
                  </Button>
                </div>
              </div>
            ) : !codeVerified ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  id="deletionCode"
                  label="Enter Verification Code"
                  type="text"
                  value={deletionCode}
                  onChange={(e) => setDeletionCode(e.target.value)}
                  placeholder="Enter the code from your email"
                  helpText="This code has been sent to your registered email address"
                  disabled={loading}
                  required
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    onClick={() => resetState()}
                    variant="secondary"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="danger"
                    loading={loading}
                    disabled={loading}
                  >
                    Verify Code
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <Input
                  id="confirmationText"
                  label={`Type "${CONFIRMATION_TEXT}" to confirm deletion`}
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`Type "${CONFIRMATION_TEXT}" here`}
                  disabled={loading}
                  required
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    onClick={() => resetState()}
                    variant="secondary"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="danger"
                    loading={loading}
                    disabled={loading || confirmationText.toLowerCase() !== CONFIRMATION_TEXT}
                  >
                    Permanently Delete Account
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Card>
  );
} 