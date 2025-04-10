import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, Shield, Package, Mail, Calendar, Eye, EyeOff, AlertCircle, CheckCircle, Phone, MapPin, Activity, Stethoscope, Clipboard, RefreshCw, X, ChevronLeft, ChevronRight, Music, Upload, FolderOpen } from 'lucide-react';
import WellnessGraph from '../../components/WellnessGraph';

// User interface
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  profile: {
    avatar?: string;
    bio?: string;
  };
  country?: string;
  packageType: string;
  isAdmin: boolean;
  isVerified: boolean;
  joiningDate: string;
  healthQuestionnaire?: any;
  activePrescriptionId?: string;
}

// User details interface
interface UserDetails {
  user: AdminUser;
  prescription: {
    _id: string;
    title: string;
    description: string;
    frequencies: {
      value: string | string[];
      purpose: string;
      condition: string;
      audioId?: string | null;
    }[];
    timing: string;
    condition: string;
    status: string;
    createdAt: string;
  } | null;
  wellnessEntries: {
    _id: string;
    date: string;
    sleep: number;
    water: number;
    energy: number;
    wellbeing: number;
  }[];
}

// Add new interface for package info
interface UserPackage {
  packageType: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

// Add new interface for wellness data filter
interface WellnessDataFilter {
  range: '7days' | '30days' | '3months' | '6months';
}

// Add new interface for prescription frequency
interface PrescriptionFrequency {
  _id?: string;
  value: string[];
  purpose: string;
  condition: string;
  order?: number;
  audioId?: string | null;
}

// Add new interface for grouped prescriptions
interface GroupedPrescription {
  condition: string;
  frequencies: PrescriptionFrequency[];
}

// Add phone number formatting function
const formatPhoneNumber = (phone: string, country?: string) => {
  if (!phone) return 'Not provided';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format based on country
  switch (country?.toUpperCase()) {
    case 'US':
      // US format: (123) 456-7890
      if (digitsOnly.length === 10) {
        return `(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6)}`;
      }
      break;
    case 'IN':
      // India format: 12345 67890
      if (digitsOnly.length === 10) {
        return `${digitsOnly.substring(0, 5)} ${digitsOnly.substring(5)}`;
      }
      break;
    case 'GB':
      // UK format: 01234 567890
      if (digitsOnly.length === 11) {
        return `${digitsOnly.substring(0, 5)} ${digitsOnly.substring(5)}`;
      }
      break;
    case 'AU':
      // Australia format: 0412 345 678
      if (digitsOnly.length === 10) {
        return `${digitsOnly.substring(0, 4)} ${digitsOnly.substring(4, 7)} ${digitsOnly.substring(7)}`;
      }
      break;
    case 'DE':
      // Germany format: 01234 567890
      if (digitsOnly.length === 11) {
        return `${digitsOnly.substring(0, 5)} ${digitsOnly.substring(5)}`;
      }
      break;
    default:
      // Default format: +1234567890
      return `+${digitsOnly}`;
  }
  
  // If no specific format matches, return with country code
  return `+${digitsOnly}`;
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'health' | 'prescription' | 'wellness'>('info');
  const [wellnessFilter, setWellnessFilter] = useState<WellnessDataFilter>({ range: '7days' });
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null);
  const [showAudioPopup, setShowAudioPopup] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<PrescriptionFrequency | null>(null);
  // New states for audio file management
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [audioFileLoading, setAudioFileLoading] = useState(false);
  const [audioSearch, setAudioSearch] = useState('');
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioCondition, setAudioCondition] = useState('');
  const [audioFrequencies, setAudioFrequencies] = useState('');
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [audioUploadLoading, setAudioUploadLoading] = useState(false);
  const [showExistingFiles, setShowExistingFiles] = useState(false);
  // Add a state to track users who need audio
  const [usersNeedingAudio, setUsersNeedingAudio] = useState<Set<string>>(new Set());

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Make API request with auth header
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          withCredentials: true,
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        
        setUsers(response.data.users);
        
        // For each user with activePrescriptionId, check if they have frequencies without audio
        const usersWithPrescriptions = response.data.users.filter((user: AdminUser) => user.activePrescriptionId);
        const needAudioSet = new Set<string>();
        
        // For each user with a prescription, fetch basic prescription data
        await Promise.all(
          usersWithPrescriptions.map(async (user: AdminUser) => {
            try {
              const prescriptionResponse = await axios.get(
                `http://localhost:5000/api/prescription/${user.activePrescriptionId}/basic`,
                {
                  headers: { Authorization: token ? `Bearer ${token}` : '' }
                }
              );
              
              if (prescriptionResponse.data.frequencies) {
                // Check if any frequency doesn't have an audioId
                const needsAudio = prescriptionResponse.data.frequencies.some(
                  (freq: any) => !freq.audioId
                );
                
                if (needsAudio) {
                  needAudioSet.add(user._id);
                }
              }
            } catch (error) {
              console.error(`Error checking prescription for user ${user._id}:`, error);
            }
          })
        );
        
        setUsersNeedingAudio(needAudioSet);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.message || 'Error fetching users');
        // Set empty array if API call fails
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch user details when active user changes
  useEffect(() => {
    if (activeUserId) {
      fetchUserDetails(activeUserId);
    } else {
      setUserDetails(null);
    }
  }, [activeUserId]);

  // Fetch user details function
  const fetchUserDetails = async (userId: string) => {
    try {
      setDetailsLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Make API request with auth header
      const response = await axios.get(`http://localhost:5000/api/auth/users/${userId}`, {
        withCredentials: true,
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      setUserDetails(response.data);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || 'Error fetching user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle user details visibility
  const toggleUserDetails = (userId: string) => {
    if (activeUserId === userId) {
      setActiveUserId(null);
      setUserPackage(null);
    } else {
      setActiveUserId(userId);
      fetchUserPackage(userId);
    }
  };

  // Close modal
  const closeModal = () => {
    setActiveUserId(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Update fetchUserPackage function
  const fetchUserPackage = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/${userId}/package`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPackage(response.data);
    } catch (error) {
      console.error('Error fetching user package:', error);
      // If API fails, create package info from user data
      if (userDetails?.user) {
        setUserPackage({
          packageType: userDetails.user.packageType,
          purchaseDate: userDetails.user.joiningDate, // Use joining date as purchase date
          expiryDate: new Date(new Date(userDetails.user.joiningDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from joining
          status: 'active'
        });
      }
    }
  };

  // Add function to handle tab navigation
  const handleTabNavigation = (direction: 'left' | 'right') => {
    const tabs: ('info' | 'health' | 'prescription' | 'wellness')[] = ['info', 'health', 'prescription', 'wellness'];
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'left') {
      setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
    } else {
      setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
    }
  };

  // Add function to fetch audio files
  const fetchAudioFiles = async () => {
    try {
      setAudioFileLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/audio-files', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: audioSearch }
      });
      setAudioFiles(response.data);
    } catch (error) {
      console.error('Error fetching audio files:', error);
    } finally {
      setAudioFileLoading(false);
    }
  };

  // Add function to link audio file to prescription frequency
  const linkAudioToFrequency = async (audioId: string) => {
    try {
      if (!selectedFrequency || !activeUserId) return;
      
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/prescriptions/${userDetails?.prescription?._id}/link-audio`,
        {
          frequencyId: selectedFrequency._id,
          audioId: audioId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Refresh user details to show updated audio link
      fetchUserDetails(activeUserId);
      setShowAudioPopup(false);
      setSelectedFrequency(null);
    } catch (error) {
      console.error('Error linking audio file:', error);
    }
  };

  // Add function to handle file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !audioFileName || !audioCondition) {
      setAudioUploadError('Please fill all required fields');
      return;
    }
    
    setAudioUploadLoading(true);
    setAudioUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('name', audioFileName);
      formData.append('condition', audioCondition);
      formData.append('frequencies', audioFrequencies);
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/audio-files/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // If upload successful, link to the prescription frequency
      if (response.data._id) {
        await linkAudioToFrequency(response.data._id);
      }
      
      // Reset form
      setAudioFile(null);
      setAudioFileName('');
      setAudioCondition('');
      setAudioFrequencies('');
      setShowAudioUpload(false);
      
      // Refresh audio files list
      fetchAudioFiles();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setAudioUploadError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setAudioUploadLoading(false);
    }
  };

  // Function to check for existing files before upload
  const checkExistingFiles = async () => {
    if (!audioFileName) {
      setAudioUploadError('Please enter a file name');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/audio-files/check`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { filename: audioFileName }
      });
      
      if (response.data.exists) {
        setAudioUploadError(`A file with name "${audioFileName}" already exists`);
      } else {
        setAudioUploadError(null);
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
    }
  };

  // Fetch audio files when search changes
  useEffect(() => {
    if (showExistingFiles) {
      fetchAudioFiles();
    }
  }, [audioSearch, showExistingFiles]);

  // Add a function to check if any frequency needs audio
  const hasFrequencyWithoutAudio = (user: AdminUser, userDetails: UserDetails | null): boolean => {
    // If no user details or no prescription, return false
    if (!userDetails || !userDetails.prescription) return false;
    
    // Check if any frequency doesn't have an audioId
    return userDetails.prescription.frequencies.some(freq => !freq.audioId);
  };

  const renderPrescriptionsSection = () => {
    if (!userDetails?.prescription) {
      return (
        <div className="text-center py-8">
          <p className="text-navy-300">No prescription data available</p>
        </div>
      );
    }

    // Group frequencies by condition
    const groupedByCondition: {[key: string]: PrescriptionFrequency[]} = {};
    userDetails.prescription.frequencies.forEach((freq: any) => {
      if (!groupedByCondition[freq.condition]) {
        groupedByCondition[freq.condition] = [];
      }
      groupedByCondition[freq.condition].push(freq as PrescriptionFrequency);
    });

    const groupedPrescriptions = Object.entries(groupedByCondition).map(([condition, frequencies]) => ({
      condition,
      frequencies
    }));

    return (
      <div className="space-y-6">
        {groupedPrescriptions.map((group, index) => (
          <div key={index} className="bg-navy-750 rounded-lg border border-navy-600 overflow-hidden">
            {/* Condition Header */}
            <div className="bg-gradient-to-r from-navy-700 to-navy-750 p-4 border-l-4 border-gold-500">
              <h3 className="text-lg font-medium text-white">{group.condition}</h3>
            </div>

            {/* Frequencies List */}
            <div className="p-4 space-y-4">
              {group.frequencies.map((freq, freqIndex) => (
                <div key={freqIndex} className="bg-navy-800 rounded-lg p-4 border border-navy-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        Frequencies: {freq.value.join(', ')} Hz
                      </h4>
                      <p className="text-navy-300 text-sm">{freq.purpose}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFrequency(freq);
                        setShowAudioPopup(true);
                      }}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                        freq.audioId ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-gold-500/20 text-gold-500 hover:bg-gold-500/30'
                      } transition-colors`}
                    >
                      <Music className="w-4 h-4" />
                      {freq.audioId ? 'Change Audio' : 'Link Audio'}
                    </button>
                  </div>
                  
                  {/* Display linked audio if exists */}
                  {freq.audioId && (
                    <div className="mt-3 p-2 bg-navy-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Music className="w-4 h-4 text-gold-500 mr-2" />
                          <span className="text-sm text-navy-300">Audio File Linked</span>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={`http://localhost:5000/api/audio-files/${freq.audioId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-navy-600 text-white text-xs rounded hover:bg-navy-500 transition-colors"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Audio Link Popup */}
        {showAudioPopup && selectedFrequency && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-navy-800 rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-navy-700">
                <h3 className="text-xl font-semibold text-gold-500">Link Audio File</h3>
                <button
                  onClick={() => {
                    setShowAudioPopup(false);
                    setSelectedFrequency(null);
                    setShowExistingFiles(false);
                    setShowAudioUpload(false);
                    setAudioSearch('');
                  }}
                  className="text-navy-300 hover:text-white p-2 rounded-full hover:bg-navy-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-navy-750 p-4 rounded-lg mb-4">
                  <h4 className="text-white font-medium mb-2">Selected Frequency</h4>
                  <p className="text-navy-300">
                    {selectedFrequency.value.join(', ')} Hz - {selectedFrequency.condition}
                  </p>
                </div>

                {!showExistingFiles && !showAudioUpload ? (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowAudioUpload(true)}
                      className="w-full py-3 bg-navy-700 hover:bg-navy-600 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload New Audio File
                    </button>

                    <button 
                      onClick={() => {
                        setShowExistingFiles(true);
                        fetchAudioFiles();
                      }}
                      className="w-full py-3 bg-navy-700 hover:bg-navy-600 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-5 h-5" />
                      Select from Existing Files
                    </button>
                  </div>
                ) : showAudioUpload ? (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Upload New Audio File</h4>
                    
                    {audioUploadError && (
                      <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
                        {audioUploadError}
                      </div>
                    )}
                    
                    <form onSubmit={handleFileUpload} className="space-y-4">
                      <div>
                        <label className="text-navy-300 text-sm block mb-1">File Name*</label>
                        <input
                          type="text"
                          value={audioFileName}
                          onChange={(e) => setAudioFileName(e.target.value)}
                          onBlur={checkExistingFiles}
                          placeholder="Enter a name for this audio file"
                          className="w-full px-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-navy-300 text-sm block mb-1">Health Condition*</label>
                        <input
                          type="text"
                          value={audioCondition}
                          onChange={(e) => setAudioCondition(e.target.value)}
                          placeholder="E.g., Anxiety, Depression, Sleep"
                          className="w-full px-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-navy-300 text-sm block mb-1">Frequencies (comma separated)</label>
                        <input
                          type="text"
                          value={audioFrequencies}
                          onChange={(e) => setAudioFrequencies(e.target.value)}
                          placeholder="E.g., 432, 528, 639"
                          className="w-full px-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-navy-300 text-sm block mb-1">Audio File* (mp3, wav, opus, etc.)</label>
                        <input
                          type="file"
                          onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                          accept="audio/*"
                          className="w-full px-3 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                          required
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAudioUpload(false)}
                          className="px-4 py-2 bg-navy-700 text-navy-300 rounded-lg hover:bg-navy-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={audioUploadLoading}
                          className="px-4 py-2 bg-gold-500 text-navy-900 rounded-lg hover:bg-gold-400 flex items-center"
                        >
                          {audioUploadLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            'Upload & Link'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium mb-2">Select Audio File</h4>
                    
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-navy-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name, condition or frequencies"
                        className="w-full pl-10 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                        value={audioSearch}
                        onChange={(e) => setAudioSearch(e.target.value)}
                      />
                    </div>
                    
                    {audioFileLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-gold-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : audioFiles.length === 0 ? (
                      <div className="text-center py-6 text-navy-300">
                        No audio files found. Try a different search or upload a new file.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {audioFiles.map((file) => (
                          <div
                            key={file._id}
                            className="bg-navy-700 rounded-lg p-3 hover:bg-navy-650 cursor-pointer transition-colors"
                            onClick={() => linkAudioToFrequency(file._id)}
                          >
                            <h5 className="text-white font-medium mb-1">{file.name}</h5>
                            <div className="text-navy-300 text-sm flex items-center">
                              <Music className="w-3 h-3 mr-1" />
                              <span className="line-clamp-1">
                                {file.frequencies?.join(', ')}
                              </span>
                            </div>
                            <div className="text-navy-400 text-xs mt-1">{file.condition}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowExistingFiles(false)}
                      className="px-4 py-2 bg-navy-700 text-navy-300 rounded-lg hover:bg-navy-600 inline-block"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">User Management</h1>
        <p className="text-navy-300">View and manage all users in the system</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-navy-500" />
        </div>
        <input
          type="text"
          placeholder="Search users by name, email or username"
          className="w-full pl-10 py-2 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-gold-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-navy-300">No users found</div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-navy-800 rounded-lg border border-navy-700 overflow-hidden hover:border-gold-500/50 transition-colors cursor-pointer"
              onClick={() => toggleUserDetails(user._id)}
            >
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center overflow-hidden border border-navy-600 mr-4">
                    {user.profile?.avatar ? (
                      <img src={user.profile.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-navy-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg flex items-center">
                      {user.name}
                      {usersNeedingAudio.has(user._id) && (
                        <span 
                          className="ml-2 w-3 h-3 rounded-full bg-blue-500 block" 
                          title="User has prescription frequencies without linked audio files"
                        ></span>
                      )}
                    </h3>
                    <div className="text-navy-300 text-sm">@{user.username}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-4">
                  <div className="flex items-center text-navy-300 text-sm">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-navy-300 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {formatDate(user.joiningDate)}</span>
                  </div>
                  <div className="flex items-center text-navy-300 text-sm">
                    <Package className="h-4 w-4 mr-1" />
                    <span className="capitalize">{user.packageType} Package</span>
                  </div>
                </div>

                <div className="flex mt-4 md:mt-0 space-x-2">
                  {user.isAdmin && (
                    <span className="px-2 py-1 bg-gold-500/20 text-gold-500 text-xs rounded-full flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs rounded-full flex items-center ${
                      user.isVerified
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}
                  >
                    {user.isVerified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for user details */}
      {activeUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="bg-navy-800 p-4 border-b border-navy-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gold-500">User Details</h3>
              <button
                onClick={closeModal}
                className="text-navy-300 hover:text-white p-2 rounded-full hover:bg-navy-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {detailsLoading ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="animate-spin h-8 w-8 border-4 border-gold-500 border-t-transparent rounded-full"></div>
                </div>
              ) : userDetails ? (
                <div className="p-6">
                  {/* Tab Navigation - Also fixed */}
                  <div className="sticky top-0 bg-navy-800 z-10 pb-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleTabNavigation('left')}
                        className="p-2 text-navy-300 hover:text-gold-500 rounded-full hover:bg-navy-700"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setActiveTab('info')}
                          className={`px-4 py-2 rounded-lg ${
                            activeTab === 'info'
                              ? 'bg-gold-500 text-navy-900'
                              : 'text-navy-300 hover:bg-navy-700'
                          }`}
                        >
                          User Info
                        </button>
                        <button
                          onClick={() => setActiveTab('health')}
                          className={`px-4 py-2 rounded-lg ${
                            activeTab === 'health'
                              ? 'bg-gold-500 text-navy-900'
                              : 'text-navy-300 hover:bg-navy-700'
                          }`}
                        >
                          Health
                        </button>
                        <button
                          onClick={() => setActiveTab('prescription')}
                          className={`px-4 py-2 rounded-lg ${
                            activeTab === 'prescription'
                              ? 'bg-gold-500 text-navy-900'
                              : 'text-navy-300 hover:bg-navy-700'
                          }`}
                        >
                          Prescription
                        </button>
                        <button
                          onClick={() => setActiveTab('wellness')}
                          className={`px-4 py-2 rounded-lg ${
                            activeTab === 'wellness'
                              ? 'bg-gold-500 text-navy-900'
                              : 'text-navy-300 hover:bg-navy-700'
                          }`}
                        >
                          Wellness
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleTabNavigation('right')}
                        className="p-2 text-navy-300 hover:text-gold-500 rounded-full hover:bg-navy-700"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-2">
                    {activeTab === 'info' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* User Basic Info */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-navy-300 text-sm block mb-1">Phone:</span>
                              <div className="flex items-center text-white">
                                <Phone className="h-4 w-4 mr-2 text-navy-400" />
                                {formatPhoneNumber(userDetails?.user.phone || '', userDetails?.user.country)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-navy-300 text-sm block mb-1">User ID:</span>
                              <code className="text-xs bg-navy-800 p-1 rounded text-navy-300 block overflow-x-auto">
                                {userDetails?.user._id}
                              </code>
                            </div>
                          </div>
                          
                          {/* Package Information */}
                          <div className="space-y-4">
                            <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
                              <h4 className="text-gold-500 font-medium mb-3 flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Package Information
                              </h4>
                              
                              {userDetails?.user.packageType ? (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-navy-300 text-sm">Package Type:</span>
                                    <span className="text-white capitalize font-medium">{userDetails.user.packageType}</span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-navy-300 text-sm">Purchase Date:</span>
                                    <span className="text-white">{formatDate(userDetails.user.joiningDate)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-navy-300 text-sm">Status:</span>
                                    <span className="text-green-400 font-medium">Active</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-navy-300 py-4">
                                  No package information available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'health' && userDetails && (
                      <div>
                        <h4 className="text-gold-500 font-medium mb-4 border-b border-navy-700 pb-2 flex items-center">
                          <Clipboard className="h-4 w-4 mr-2" />
                          Health Questionnaire
                        </h4>
                        {userDetails.user.healthQuestionnaire ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-white text-sm font-medium mb-2">Health Concerns</h5>
                              {userDetails.user.healthQuestionnaire.healthConcerns?.length > 0 ? (
                                <ul className="list-disc list-inside text-navy-300 space-y-1">
                                  {userDetails.user.healthQuestionnaire.healthConcerns.map((concern: any, idx: number) => (
                                    <li key={idx} className="text-sm">
                                      {concern.description} {concern.type && `(${concern.type})`} 
                                      {concern.severity && <span className="text-xs text-gold-500 ml-1">Severity: {concern.severity}/4</span>}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-navy-400 text-sm">No health concerns provided</p>
                              )}
                              
                              <h5 className="text-white text-sm font-medium mt-4 mb-2">Pain Locations</h5>
                              {userDetails.user.healthQuestionnaire.painLocations?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {userDetails.user.healthQuestionnaire.painLocations.map((location: string, idx: number) => (
                                    <span key={idx} className="bg-navy-700 text-xs text-navy-300 px-2 py-1 rounded-full">
                                      {location}
                                    </span>
                                  ))}
                                  {userDetails.user.healthQuestionnaire.otherPainLocation && (
                                    <span className="bg-navy-700 text-xs text-navy-300 px-2 py-1 rounded-full">
                                      {userDetails.user.healthQuestionnaire.otherPainLocation}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-navy-400 text-sm">No pain locations specified</p>
                              )}
                            </div>
                            
                            <div>
                              <h5 className="text-white text-sm font-medium mb-2">Emotional State</h5>
                              <p className="text-navy-300 text-sm mb-4">
                                {userDetails.user.healthQuestionnaire.emotionalState || 'Not specified'}
                              </p>
                              
                              <h5 className="text-white text-sm font-medium mb-2">Lifestyle Factors</h5>
                              {userDetails.user.healthQuestionnaire.lifestyleFactors?.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mb-4">
                                  {userDetails.user.healthQuestionnaire.lifestyleFactors.map((factor: string, idx: number) => (
                                    <span key={idx} className="bg-navy-700 text-xs text-navy-300 px-2 py-1 rounded-full">
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-navy-400 text-sm mb-4">No lifestyle factors specified</p>
                              )}
                              
                              <h5 className="text-white text-sm font-medium mb-2">Healing Goals</h5>
                              {userDetails.user.healthQuestionnaire.healingGoals?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {userDetails.user.healthQuestionnaire.healingGoals.map((goal: string, idx: number) => (
                                    <span key={idx} className="bg-navy-700 text-xs text-navy-300 px-2 py-1 rounded-full">
                                      {goal}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-navy-400 text-sm">No healing goals specified</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-navy-800 rounded-lg text-center text-navy-300">
                            No health questionnaire submitted
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'prescription' && userDetails && (
                      <div>
                        <h4 className="text-gold-500 font-medium mb-4 border-b border-navy-700 pb-2 flex items-center">
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Active Prescription
                        </h4>
                        
                        {userDetails.prescription ? (
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="text-white font-medium">{userDetails.prescription.title}</h5>
                                <p className="text-navy-300 text-sm">{userDetails.prescription.description}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                userDetails.prescription.status === 'active' 
                                  ? 'bg-green-900/20 text-green-400' 
                                  : 'bg-navy-700 text-navy-300'
                              }`}>
                                {userDetails.prescription.status}
                              </span>
                            </div>
                            
                            <div className="mb-4">
                              <h6 className="text-navy-300 text-sm mb-2">Frequencies:</h6>
                              {renderPrescriptionsSection()}
                            </div>
                            
                            <div className="text-navy-300 text-sm">
                              <span className="text-navy-400">Timing:</span> {userDetails.prescription.timing}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-navy-800 rounded-lg text-center text-navy-300">
                            No active prescription
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'wellness' && userDetails && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-gold-500 font-medium flex items-center">
                            <Activity className="h-4 w-4 mr-2" />
                            Wellness Data
                          </h4>
                          <select
                            value={wellnessFilter.range}
                            onChange={(e) => setWellnessFilter({ range: e.target.value as WellnessDataFilter['range'] })}
                            className="bg-navy-700 text-navy-300 rounded-lg px-3 py-1 text-sm"
                          >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="3months">Last 3 Months</option>
                            <option value="6months">Last 6 Months</option>
                          </select>
                        </div>
                        
                        {userDetails.wellnessEntries.length > 0 ? (
                          <WellnessGraph 
                            wellnessEntries={userDetails.wellnessEntries}
                            dateRange={wellnessFilter.range}
                          />
                        ) : (
                          <div className="p-4 bg-navy-800 rounded-lg text-center text-navy-300">
                            No wellness data available
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Refresh button - Fixed at bottom */}
                  <div className="sticky bottom-0 mt-6 pb-4 pt-2 bg-navy-800 border-t border-navy-700">
                    <button 
                      onClick={() => {
                        fetchUserDetails(activeUserId);
                        fetchUserPackage(activeUserId);
                      }}
                      className="flex items-center text-navy-300 hover:text-gold-500 text-sm bg-navy-800 px-3 py-1.5 rounded-lg hover:bg-navy-700 float-right"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Refresh Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-navy-300">
                  Error loading user details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 