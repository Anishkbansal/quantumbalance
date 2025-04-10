import React from 'react';

interface ProfileInformationProps {
  isEditing: boolean;
  user: any;
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({
  isEditing,
  user,
  formData,
  handleChange
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gold-500 mb-4">Personal Information</h3>
      
      <div className="grid grid-cols-1 gap-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy-300 mb-1">
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-md text-navy-100 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          ) : (
            <div className="px-3 py-2 bg-navy-800 border border-navy-700 rounded-md text-navy-200">
              {user?.name || 'Not set'}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy-300 mb-1">
            Email Address
          </label>
          {isEditing ? (
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled={true}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-md text-navy-500 focus:outline-none cursor-not-allowed"
            />
          ) : (
            <div className="px-3 py-2 bg-navy-800 border border-navy-700 rounded-md text-navy-200">
              {user?.email || 'Not set'}
            </div>
          )}
          {isEditing && (
            <p className="text-xs text-navy-400 mt-1">
              Email address cannot be changed
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-navy-300 mb-1">
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-md text-navy-100 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="+1 (555) 123-4567"
            />
          ) : (
            <div className="px-3 py-2 bg-navy-800 border border-navy-700 rounded-md text-navy-200">
              {user?.phone || 'Not set'}
            </div>
          )}
          <p className="text-xs text-navy-400 mt-1">
            For account recovery and important notifications
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation; 