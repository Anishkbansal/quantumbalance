import React, { useState, useEffect } from 'react';
import { Music, Search, Plus, X, Upload, Trash, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { API_URL } from '../../config/constants';
import axios from 'axios';

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

  // Fetch all audio files
  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(`${API_URL}/audio-files`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAudioFiles(response.data);
      setFilteredAudioFiles(response.data);
      
      // Get all conditions (allowing duplicates) and sort them
      const allConditions = response.data.map((file: AudioFile) => file.condition);
      setConditions(allConditions.sort());
      
    } catch (error: any) {
      console.error('Error fetching audio files:', error);
      setError(error.response?.data?.message || 'Error fetching audio files');
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
    
    setUploadLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audio-files/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
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
      setUploadError(error.response?.data?.message || 'Error uploading file');
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
                        accept="audio/*"
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
        <div className="bg-navy-800 rounded-lg p-6 border border-navy-700">
          <h2 className="text-xl font-semibold text-white mb-4">Audio Files</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-navy-300 mt-4">Loading audio files...</p>
            </div>
          ) : filteredAudioFiles.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-navy-500 mx-auto mb-4" />
              <p className="text-navy-300">
                {searchTerm || selectedCondition 
                  ? 'No audio files match your search criteria' 
                  : 'No audio files found in the database'}
              </p>
              {(searchTerm || selectedCondition) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCondition('');
                  }}
                  className="mt-2 text-gold-500 hover:text-gold-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-4 p-3 bg-navy-750 rounded-md text-navy-300 font-medium text-sm hidden md:grid">
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Condition</div>
                <div className="col-span-1">Size</div>
                <div className="col-span-2">Date Added</div>
                <div className="col-span-1">Actions</div>
              </div>
              
              {filteredAudioFiles.map((file) => (
                <div key={file._id} className="border border-navy-700 rounded-md overflow-hidden">
                  {/* Mobile View */}
                  <div className="md:hidden bg-navy-750 p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-medium">{file.name}</h3>
                      <button
                        onClick={() => toggleExpand(file._id)}
                        className="text-navy-300 hover:text-gold-500"
                      >
                        {expandedAudioId === file._id ? 
                          <ChevronUp className="w-5 h-5" /> : 
                          <ChevronDown className="w-5 h-5" />
                        }
                      </button>
                    </div>
                    <p className="text-navy-300 text-sm mt-1">{file.condition}</p>
                    
                    {expandedAudioId === file._id && (
                      <div className="mt-3 pt-3 border-t border-navy-700">
                        <p className="text-navy-300 text-sm flex justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(file.size)}</span>
                        </p>
                        <p className="text-navy-300 text-sm flex justify-between mt-1">
                          <span>Date Added:</span>
                          <span>{formatDate(file.createdAt)}</span>
                        </p>
                        {file.frequencies && file.frequencies.length > 0 && (
                          <p className="text-navy-300 text-sm mt-1">
                            <span className="block font-medium">Frequencies:</span>
                            <span className="block mt-1">{file.frequencies.join(', ')} Hz</span>
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-navy-700">
                          <a 
                            href={`${API_URL}/audio-files/${file._id}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-navy-700 hover:bg-navy-600 text-white py-1 px-3 rounded text-sm"
                          >
                            Listen
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file._id)}
                            className="bg-red-900/30 hover:bg-red-800/50 text-red-300 py-1 px-3 rounded text-sm flex items-center"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-8 gap-4 p-4 items-center">
                    <div className="col-span-2 text-white">{file.name}</div>
                    <div className="col-span-2 text-navy-300">{file.condition}</div>
                    <div className="col-span-1 text-navy-300">{formatFileSize(file.size)}</div>
                    <div className="col-span-2 text-navy-300">{formatDate(file.createdAt)}</div>
                    <div className="col-span-1 flex space-x-2">
                      <a 
                        href={`${API_URL}/audio-files/${file._id}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-navy-700 hover:bg-navy-600 text-white p-2 rounded"
                        title="Listen to audio"
                      >
                        <Music className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="bg-red-900/30 hover:bg-red-800/50 text-red-300 p-2 rounded"
                        title="Delete audio"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details for Desktop */}
                  {expandedAudioId === file._id && (
                    <div className="hidden md:block p-4 bg-navy-750 border-t border-navy-700">
                      {file.frequencies && file.frequencies.length > 0 && (
                        <p className="text-navy-300">
                          <span className="font-medium">Frequencies:</span> {file.frequencies.join(', ')} Hz
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SonicLibrary; 