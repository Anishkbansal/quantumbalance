import React, { useState } from 'react';

interface ProfilePictureProps {
  name: string;
  profileUrl: string | null;
  isEditing: boolean;
  onFileChange: (file: File) => void;
}

export default function ProfilePicture({ 
  name, 
  profileUrl, 
  isEditing, 
  onFileChange 
}: ProfilePictureProps) {
  const handleProfilePictureClick = () => {
    if (!isEditing) return;
    document.getElementById("profile-picture-input")?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('Image must be smaller than 5MB');
      return;
    }
    
    onFileChange(file);
  };
  
  return (
    <div className="flex flex-col items-center mb-6">
      <div 
        className={`h-32 w-32 rounded-full overflow-hidden border-4 border-navy-600 relative ${
          isEditing ? 'cursor-pointer hover:opacity-80' : ''
        }`}
        onClick={handleProfilePictureClick}
      >
        {profileUrl ? (
          <img 
            src={profileUrl} 
            alt="Profile" 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-navy-700 text-gold-500 text-3xl font-bold">
            {name?.charAt(0) || 'U'}
          </div>
        )}
        
        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm">Change Photo</span>
          </div>
        )}
      </div>
      
      {isEditing && (
        <input
          id="profile-picture-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
      
      <h2 className="text-xl font-bold text-gold-500 mt-4">{name}</h2>
    </div>
  );
} 