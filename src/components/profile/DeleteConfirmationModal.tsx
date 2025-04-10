import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  hasActivePackage: boolean;
  onConfirm: (confirmationText?: string) => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  hasActivePackage,
  onConfirm,
  onCancel
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const expectedText = 'delete my account';
  const isValid = !hasActivePackage || confirmationText.toLowerCase() === expectedText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="bg-navy-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-navy-400 hover:text-navy-100"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="text-xl font-semibold text-red-500 mb-4">Confirm Account Deletion</h3>
        
        <div className="mb-6">
          <p className="text-navy-300 mb-4">
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </p>
          
          {hasActivePackage && (
            <div className="bg-navy-700 p-3 rounded mb-4 border border-gold-500/40">
              <p className="text-sm text-gold-300 font-medium mb-1">Warning: Active Package</p>
              <p className="text-xs text-navy-300">
                You currently have an active package. Deleting your account will result in the loss of all associated package benefits and data.
              </p>
            </div>
          )}
          
          {hasActivePackage && (
            <div className="mb-4">
              <label htmlFor="confirmationText" className="block text-sm font-medium text-navy-300 mb-1">
                Type "{expectedText}" to confirm
              </label>
              <input
                type="text"
                id="confirmationText"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-md text-navy-100 focus:outline-none focus:ring-1 focus:ring-gold-500"
                placeholder={`Type "${expectedText}" to confirm`}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-navy-300 rounded transition-colors focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(hasActivePackage ? confirmationText : undefined)}
            disabled={!isValid}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 