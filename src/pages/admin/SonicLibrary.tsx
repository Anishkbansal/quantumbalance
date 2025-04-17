import React, { useState, useEffect } from 'react';
import { Music, Search, Plus, X, Upload, Trash, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Filter, Play, Pause, Download } from 'lucide-react';
import { API_URL } from '../../config/constants';
import axios from 'axios';
import AudioPlayer from '../../components/audio/AudioPlayer';

interface AudioFile {
  _id: string;
  name: string;
  condition: string;
  frequencies: string[];
  contentType: string;
  size: number;
  createdAt: string;
}

const SonicLibrary: React.FC = () => {
  // State for audio files
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [filteredAudioFiles, setFilteredAudioFiles] = useState<AudioFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for audio upload
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioCondition, setAudioCondition] = useState('');
  const [audioFrequencies, setAudioFrequencies] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // State for expanded details
  const [expandedAudioId, setExpandedAudioId] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Fetch all audio files
  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('Authentication token missing');
        setError('Authentication required - please log in again');
        return;
      }

      // Log for debugging
      console.log('Fetching audio files with token:', token.substring(0, 10) + '...');

      const response = await axios.get(`${API_URL}/audio-files`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Audio files response:', response.status);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
        return;
      }

      setAudioFiles(response.data);
      setFilteredAudioFiles(response.data);
      
      // Get all conditions (allowing duplicates) and sort them
      const allConditions = response.data.map((file: AudioFile) => file.condition);
      // Remove duplicates without using Set spread operator
      const uniqueConditions = allConditions.filter((value, index, self) => 
        self.indexOf(value) === index
      ).sort();
      setConditions(uniqueConditions);
      
    } catch (error: any) {
      console.error('Error fetching audio files:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          setError('Session expired - please log in again');
        } else if (error.response.status === 403) {
          setError('Not authorized to access audio files - admin rights required');
        } else {
          setError(error.response.data?.message || `Error (${error.response.status}): ${error.response.statusText}`);
        }
      } else if (error.request) {
        setError('No response from server - please check your network connection');
      } else {
        setError('Error fetching audio files: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter audio files based on search term and condition
  useEffect(() => {
    if (audioFiles.length === 0) return;
    
    let filtered = [...audioFiles];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        file => 
          file.name.toLowerCase().includes(lowerCaseSearch) ||
          file.condition.toLowerCase().includes(lowerCaseSearch) ||
          (file.frequencies && file.frequencies.some(freq => freq.toLowerCase().includes(lowerCaseSearch)))
      );
    }
    
    // Filter by condition
    if (selectedCondition) {
      filtered = filtered.filter(file => file.condition === selectedCondition);
    }
    
    setFilteredAudioFiles(filtered);
  }, [searchTerm, selectedCondition, audioFiles]);

  // Load audio files on component mount
  useEffect(() => {
    fetchAudioFiles();
  }, []);

  // Reset form fields
  const resetForm = () => {
    setAudioFile(null);
    setAudioFileName('');
    setAudioCondition('');
    setAudioFrequencies('');
    setUploadError(null);
  };

  // Toggle file details expansion
  const toggleExpand = (audioId: string) => {
    if (expandedAudioId === audioId) {
      setExpandedAudioId(null);
    } else {
      setExpandedAudioId(audioId);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      
      // Auto-fill filename based on the uploaded file (without extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      if (!audioFileName) {
        setAudioFileName(fileName);
      }
    }
  };

  // Check if file name already exists
  const checkExistingFileName = async () => {
    if (!audioFileName.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/audio-files/check`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { filename: audioFileName }
      });
      
      if (response.data.exists) {
        setUploadError(`A file with name "${audioFileName}" already exists`);
        return true;
      }
      
      setUploadError(null);
      return false;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!audioFile) {
      setUploadError('Please select an audio file to upload');
      return;
    }
    
    if (!audioFileName.trim()) {
      setUploadError('Please enter a name for the audio file');
      return;
    }
    
    if (!audioCondition.trim()) {
      setUploadError('Please enter a condition for the audio file');
      return;
    }
    
    // Check for duplicate filename
    const exists = await checkExistingFileName();
    if (exists) return;
    
    // Prepare form data
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    formData.append('name', audioFileName);
    formData.append('condition', audioCondition);
    
    if (audioFrequencies.trim()) {
      formData.append('frequencies', audioFrequencies);
    }
    
    // Log upload attempt for debugging
    console.log('Uploading audio file:', {
      name: audioFileName,
      condition: audioCondition,
      fileType: audioFile.type,
      fileSize: audioFile.size
    });
    
    setUploadLoading(true);
    setUploadError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUploadError('Authentication required - please log in again');
        setUploadLoading(false);
        return;
      }
      
      console.log('Upload token:', token.substring(0, 10) + '...');
      
      const response = await axios.post(`${API_URL}/audio-files/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        // Add timeout and onUploadProgress for better UX
        timeout: 120000, // 120 seconds timeout (2 minutes)
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });
      
      console.log('Upload response:', response.data);
      
      // Reset form and show success message
      resetForm();
      setShowUploadForm(false);
      setSuccessMessage('Audio file uploaded successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh audio files list
      fetchAudioFiles();
      
    } catch (error: any) {
      console.error('Error uploading audio file:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          setUploadError('Session expired - please log in again');
        } else if (error.response.status === 403) {
          setUploadError('Not authorized to upload audio files - admin rights required');
        } else if (error.response.status === 500) {
          setUploadError('Server error - please try again with a smaller file or different format');
        } else {
          setUploadError(error.response.data?.message || `Error (${error.response.status}): ${error.response.statusText}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        setUploadError('Upload timed out. The file might be too large or the server is busy.');
      } else if (error.request) {
        setUploadError('No response received from server. Please check your connection and try again.');
      } else {
        setUploadError(error.message || 'Error uploading file');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete audio file
  const handleDeleteFile = async (audioId: string) => {
    if (!window.confirm('Are you sure you want to delete this audio file?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/audio-files/${audioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Show success message
      setSuccessMessage('Audio file deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh audio files list
      fetchAudioFiles();
      
    } catch (error: any) {
      console.error('Error deleting audio file:', error);
      setError(error.response?.data?.message || 'Error deleting file');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-navy-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gold-500">Sonic Library</h1>
          <button
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              resetForm();
            }}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 py-2 px-4 rounded-md flex items-center"
          >
            {showUploadForm ? (
              <>
                <X className="w-5 h-5 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Add Audio File
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-900/30 border border-green-800 text-green-300 p-4 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-navy-800 rounded-lg p-6 mb-8 border border-navy-700">
            <h2 className="text-xl font-semibold text-white mb-4">Upload New Audio File</h2>
            
            {uploadError && (
              <div className="mb-4 bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-md flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-navy-300 mb-1">Audio File*</label>
                  <div className="flex items-center">
                    <label className="cursor-pointer bg-navy-700 hover:bg-navy-600 text-white py-2 px-4 rounded-md flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      {audioFile ? 'Change File' : 'Select File'}
                      <input
                        type="file"
                        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/x-m4a,audio/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {audioFile && (
                      <span className="ml-3 text-navy-300">
                        {audioFile.name} ({formatFileSize(audioFile.size)})
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="audioFileName" className="block text-navy-300 mb-1">Name*</label>
                  <input
                    id="audioFileName"
                    type="text"
                    value={audioFileName}
                    onChange={(e) => setAudioFileName(e.target.value)}
                    onBlur={checkExistingFileName}
                    placeholder="Enter a unique name for this audio file"
                    className="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:border-gold-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="audioCondition" className="block text-navy-300 mb-1">Condition*</label>
                  <input
                    id="audioCondition"
                    type="text"
                    value={audioCondition}
                    onChange={(e) => setAudioCondition(e.target.value)}
                    placeholder="Medical condition this audio addresses"
                    className="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:border-gold-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="audioFrequencies" className="block text-navy-300 mb-1">Frequencies</label>
                  <input
                    id="audioFrequencies"
                    type="text"
                    value={audioFrequencies}
                    onChange={(e) => setAudioFrequencies(e.target.value)}
                    placeholder="Comma-separated list of frequencies (e.g. 432, 528, 639)"
                    className="w-full py-2 px-3 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:border-gold-500"
                  />
                  <p className="text-navy-400 text-xs mt-1">Enter frequencies as comma-separated values (optional)</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    resetForm();
                  }}
                  className="bg-navy-700 hover:bg-navy-600 text-white py-2 px-4 rounded-md mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="bg-gold-500 hover:bg-gold-600 text-navy-900 py-2 px-4 rounded-md flex items-center"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Audio
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-navy-800 rounded-lg p-6 mb-6 border border-navy-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, condition, or frequencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:border-gold-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-navy-400" />
            </div>
            
            <div className="md:w-64">
              <div className="relative">
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 bg-navy-750 border border-navy-600 rounded-md text-white focus:outline-none focus:border-gold-500 appearance-none"
                >
                  <option value="">All Conditions</option>
                  {conditions.map((condition, index) => (
                    <option key={index} value={condition}>{condition}</option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-2.5 w-5 h-5 text-navy-400" />
                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-navy-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Audio Files List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
          ) : filteredAudioFiles.length === 0 ? (
            <div className="col-span-3 text-center text-navy-300 p-8">
              {searchTerm || selectedCondition
                ? 'No audio files found matching your search'
                : 'No audio files in the library yet'}
            </div>
          ) : (
            <>
              {filteredAudioFiles.map((file) => (
                <div
                  key={file._id}
                  className="bg-navy-800 rounded-lg p-5 border border-navy-700 hover:border-navy-600 transition-colors flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                      <p className="text-sm text-navy-300">{file.condition}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleExpand(file._id)}
                        className="p-2 rounded-md bg-navy-700 hover:bg-navy-600 text-gold-500 transition-colors"
                      >
                        {expandedAudioId === file._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="p-2 rounded-md bg-navy-700 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Audio Player */}
                  <div className="mt-3 mb-2">
                    <AudioPlayer 
                      audioUrl={`${API_URL}/audio-files/${file._id}`}
                      audioTitle={file.name}
                      onPlay={() => setCurrentlyPlaying(file._id)}
                      onPause={() => setCurrentlyPlaying(null)}
                    />
                  </div>
                  
                  {/* File details */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-navy-400">
                      <span>Size: {formatFileSize(file.size)}</span>
                      <span>Type: {file.contentType.split('/')[1]?.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-navy-400 mt-1">
                      Added: {formatDate(file.createdAt)}
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {expandedAudioId === file._id && (
                    <div className="mt-4 pt-3 border-t border-navy-700">
                      <h4 className="font-medium text-white mb-2">Frequencies:</h4>
                      {file.frequencies && file.frequencies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {file.frequencies.map((freq, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-navy-700 text-navy-300 px-2 py-1 rounded-md"
                            >
                              {freq}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-navy-400">No frequencies specified</p>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <a
                          href={`${API_URL}/audio-files/${file._id}`}
                          download={`${file.name}.${file.contentType.split('/')[1]}`}
                          className="flex items-center text-xs text-gold-500 hover:text-gold-400"
                        >
                          <Download size={14} className="mr-1" />
                          Download File
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SonicLibrary; 