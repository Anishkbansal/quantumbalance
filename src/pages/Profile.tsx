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
import { CreditCard, UserIcon, Gift } from 'lucide-react';
import { API_URL } from '../config/constants';
import ProfileGiftCards from './Profile/GiftCards';

type TabType = 'profile' | 'giftcards' | 'payment';

const Profile: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  // Cast the user to our extended type
  const user = authUser as unknown as User;
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
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

  // Tab switcher
  const TabNavigation = () => (
    <div className="border-b border-navy-700 mb-6">
      <div className="flex -mb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm mr-4 ${
            activeTab === 'profile'
              ? 'border-gold-500 text-gold-500'
              : 'border-transparent text-navy-300 hover:text-navy-200 hover:border-navy-600'
          }`}
        >
          <UserIcon className="w-4 h-4 mr-2" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('giftcards')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm mr-4 ${
            activeTab === 'giftcards'
              ? 'border-gold-500 text-gold-500'
              : 'border-transparent text-navy-300 hover:text-navy-200 hover:border-navy-600'
          }`}
        >
          <Gift className="w-4 h-4 mr-2" />
          <span>Gift Cards</span>
        </button>
        <button
          onClick={() => navigate('/profile/payment-methods')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'payment'
              ? 'border-gold-500 text-gold-500'
              : 'border-transparent text-navy-300 hover:text-navy-200 hover:border-navy-600'
          }`}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          <span>Payment Methods</span>
        </button>
      </div>
    </div>
  );
  
  const renderProfileContent = () => (
    <>
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
      
      <div className="mt-6">
        <DeleteAccount hasActivePackage={hasActivePackage} />
      </div>
    </>
  );
  
  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <TabNavigation />
        
        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'giftcards' && <ProfileGiftCards />}
      </div>
    </div>
  );
};

export default Profile;