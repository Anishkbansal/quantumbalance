import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProfileHeaderProps {
  isEditing: boolean;
  error: string | null;
  success: string | null;
  handleEditToggle: () => void;
  handleSaveChanges: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  error,
  success,
  handleEditToggle,
  handleSaveChanges
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-navy-100">My Profile</h2>
        
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleEditToggle}
              className="px-3 py-1 bg-navy-700 hover:bg-navy-600 text-navy-300 text-sm rounded transition-colors focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-3 py-1 bg-gold-500 hover:bg-gold-600 text-navy-900 text-sm rounded transition-colors focus:outline-none"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <button
            onClick={handleEditToggle}
            className="px-3 py-1 bg-navy-700 hover:bg-navy-600 text-navy-300 text-sm rounded transition-colors focus:outline-none"
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start">
          <AlertCircle className="text-red-500 mr-2 h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded flex items-start">
          <CheckCircle2 className="text-green-500 mr-2 h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}
      
      {isEditing && (
        <div className="p-3 bg-navy-800 border border-navy-600 rounded mb-4">
          <p className="text-sm text-navy-300">
            Edit your profile information below. Click "Save Changes" when you're done.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader; 