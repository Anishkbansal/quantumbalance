import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/models';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/FormElements';
import { ErrorMessage, SuccessMessage } from '../components/ui/Messages';
import DeleteAccount from '../components/profile/DeleteAccount';
import ProfilePicture from '../components/profile/ProfilePicture';
import UserInfoForm from '../components/profile/UserInfoForm';
import { convertFileToBase64 } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { API_URL } from '../config/constants';

const Profile: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  // Cast the user to our extended type
  const user = authUser as unknown as User;
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setPreviewUrl(user.profilePicture || null);
      
      // Check if user has an active package for the delete account component
      const hasPackage = !!user.packageType && user.packageType !== 'none';
      setHasActivePackage(hasPackage);
    }
  }, [user]);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form if canceling edit
      setName(user?.name || '');
      setPhone(user?.phone || '');
      setPreviewUrl(user?.profilePicture || null);
      setImageFile(null);
      setError(null);
    }
    setIsEditing(!isEditing);
  };
  
  const handleFileChange = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };
  
  const saveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Define profileData with proper type
      let profileData: { 
        name: string; 
        phone: string; 
        profilePicture?: string 
      } = { name, phone };
      
      // If there's a new image file, convert it to base64
      if (imageFile) {
        const base64Image = await convertFileToBase64(imageFile);
        profileData.profilePicture = base64Image;
      }
      
      // Make API call to update profile - using the correct endpoint
      const response = await axios.post(`${API_URL}/auth/update-profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Profile updated successfully');
        
        // Update user context
        if (updateUser) {
          updateUser(response.data.user);
        }
        
        setIsEditing(false);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gold-500 mb-2">Your Profile</h1>
          <p className="text-navy-300">View and update your account information</p>
          
          <ErrorMessage className="mt-4">{error}</ErrorMessage>
          <SuccessMessage className="mt-4">{success}</SuccessMessage>
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleEditToggle}
              variant={isEditing ? 'secondary' : 'primary'}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
            
            {isEditing && (
              <Button
                onClick={saveProfile}
                variant="success"
                loading={loading}
                className="ml-2"
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
        
        {/* Profile content */}
        <Card>
          <ProfilePicture 
            name={user?.name || ''}
            profileUrl={previewUrl}
            isEditing={isEditing}
            onFileChange={handleFileChange}
          />
          
          <UserInfoForm
            name={name}
            setName={setName}
            email={user?.email || ''}
            phone={phone}
            setPhone={setPhone}
            isEditing={isEditing}
          />
        </Card>
        
        {/* Payment Methods */}
        <div className="mt-6">
          <Card>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 bg-navy-700 p-2 rounded-full">
                  <CreditCard size={20} className="text-gold-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Payment Methods</h3>
                  <p className="text-navy-300 text-sm">Manage your saved payment methods</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/profile/payment-methods')}
                variant="secondary"
                className="border-navy-600 hover:bg-navy-700 hover:text-gold-500"
              >
                Manage
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Delete Account */}
        <div className="mt-6">
          <DeleteAccount hasActivePackage={hasActivePackage} />
        </div>
      </div>
    </div>
  );
};

export default Profile;