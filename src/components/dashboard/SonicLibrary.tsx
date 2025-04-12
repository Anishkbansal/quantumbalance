import React, { useState, useEffect, useCallback } from 'react';
import { Search, Music, ChevronDown, ChevronUp } from 'lucide-react';
import AudioCard from '../audio/AudioCard';
import { API_URL } from '../../config/constants';

interface AudioFile {
  _id: string;
  name: string;
  condition: string;
  frequencies: string[];
  contentType: string;
  size: number;
  createdAt: string;
}

interface SonicLibraryProps {
  isPremium: boolean;
}

const SonicLibrary: React.FC<SonicLibraryProps> = ({ isPremium }) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [groupedByCondition, setGroupedByCondition] = useState<{[key: string]: AudioFile[]}>({});
  const [expandedConditions, setExpandedConditions] = useState<{[key: string]: boolean}>({});

  // Fetch premium audio files
  const fetchPremiumAudioFiles = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_URL}/audio/premium-library`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to fetch audio files');
        return;
      }

      if (data.success && data.audioFiles && Array.isArray(data.audioFiles)) {
        // Sort alphabetically by name with proper type annotations
        const sortedFiles = data.audioFiles.sort((a: AudioFile, b: AudioFile) =>
          (a.name || '').localeCompare(b.name || '')
        );
        
        setAudioFiles(sortedFiles);
        
        // Group audio files by condition
        const grouped: {[key: string]: AudioFile[]} = {};
        
        sortedFiles.forEach((file: AudioFile) => {
          const condition = file.condition || 'Other';
          if (!grouped[condition]) {
            grouped[condition] = [];
          }
          grouped[condition].push(file);
        });
        
        setGroupedByCondition(grouped);
        
        // Set all conditions as expanded by default
        const initialExpandState: {[key: string]: boolean} = {};
        Object.keys(grouped).forEach(condition => {
          initialExpandState[condition] = true;
        });
        setExpandedConditions(initialExpandState);
      } else {
        setError(data.message || 'Failed to fetch audio files');
      }
    } catch (error) {
      console.error('Error fetching premium audio files:', error);
      setError('Error fetching audio files. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter audio files based on search term
  useEffect(() => {
    if (!audioFiles || audioFiles.length === 0) return;
    
    if (searchTerm.trim() === '') {
      // Group the files again by condition when search is cleared
      const grouped: {[key: string]: AudioFile[]} = {};
      audioFiles.forEach((file: AudioFile) => {
        const condition = file.condition || 'Other';
        if (!grouped[condition]) {
          grouped[condition] = [];
        }
        grouped[condition].push(file);
      });
      setGroupedByCondition(grouped);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = audioFiles.filter(
        (file: AudioFile) => 
          (file.name ? file.name.toLowerCase().includes(lowerCaseSearch) : false) ||
          (file.condition ? file.condition.toLowerCase().includes(lowerCaseSearch) : false) ||
          (file.frequencies && Array.isArray(file.frequencies) ? 
            file.frequencies.some(freq => freq && freq.toLowerCase().includes(lowerCaseSearch)) 
            : false)
      );
      
      // Update grouped files based on filtered results
      const groupedFiltered: {[key: string]: AudioFile[]} = {};
      filtered.forEach((file: AudioFile) => {
        const condition = file.condition || 'Other';
        if (!groupedFiltered[condition]) {
          groupedFiltered[condition] = [];
        }
        groupedFiltered[condition].push(file);
      });
      setGroupedByCondition(groupedFiltered);
    }
  }, [searchTerm, audioFiles]);

  // Fetch audio files on mount
  useEffect(() => {
    if (isPremium) {
      fetchPremiumAudioFiles();
    }
  }, [isPremium, fetchPremiumAudioFiles]);

  // Toggle expanded state for a condition
  const toggleConditionExpand = (condition: string) => {
    setExpandedConditions(prev => ({
      ...prev,
      [condition]: !prev[condition]
    }));
  };

  // Handle when an audio starts playing
  const handleAudioStartPlaying = (audioId: string) => {
    setCurrentlyPlaying(audioId);
  };

  // Handle when an audio stops playing
  const handleAudioStopPlaying = () => {
    setCurrentlyPlaying(null);
  };

  // If not premium, show upgrade message
  if (!isPremium) {
    return (
      <div className="bg-navy-800 rounded-lg p-6 text-center">
        <Music className="w-16 h-16 text-gold-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Sonic Library Premium Feature</h2>
        <p className="text-navy-300 mb-4">
          The Sonic Library is available exclusively for premium users.
          Upgrade your package to access our complete collection of sonic prescriptions.
        </p>
        <button 
          onClick={() => window.location.href = '/packages'}
          className="bg-gold-500 hover:bg-gold-600 text-navy-900 py-2 px-4 rounded-md font-medium"
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-lg p-6">
      <div>
        <h2 className="text-xl font-bold text-gold-500 mb-4">Sonic Library</h2>
        <p className="text-navy-300 mb-4">
          Access our complete collection of sonic prescriptions.
          These therapeutic audio files are designed to address various health concerns.
        </p>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search by name, condition, or frequency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 bg-navy-750 border border-navy-600 rounded-lg text-white placeholder-navy-400"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-navy-400" />
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 text-red-300 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
          </div>
        )}
        
        {/* No Results Message */}
        {!loading && Object.keys(groupedByCondition).length === 0 && (
          <div className="text-center py-8 text-navy-300">
            No audio files found. Try adjusting your search.
          </div>
        )}
        
        {/* Audio Files Grouped by Condition */}
        {!loading && Object.keys(groupedByCondition).length > 0 && Object.entries(groupedByCondition).map(([condition, files]) => (
          <div key={condition} className="mb-6 last:mb-0">
            <div className="bg-navy-750 rounded-lg border border-navy-600 overflow-hidden shadow-lg">
              {/* Condition Header - Clickable to expand/collapse */}
              <div 
                className="bg-gradient-to-r from-navy-700 to-navy-750 p-4 flex justify-between items-center cursor-pointer border-l-4 border-gold-500"
                onClick={() => toggleConditionExpand(condition)}
              >
                <h3 className="text-lg font-medium text-white">{condition}</h3>
                <div className="flex items-center">
                  <span className="text-navy-300 text-sm mr-3">
                    {files.length} {files.length === 1 ? 'audio file' : 'audio files'}
                  </span>
                  {expandedConditions[condition] ? 
                    <ChevronUp className="w-5 h-5 text-gold-500" /> : 
                    <ChevronDown className="w-5 h-5 text-gold-500" />
                  }
                </div>
              </div>
              
              {/* Audio files for this condition */}
              {expandedConditions[condition] && (
                <div className="p-4">
                  {files.map((file: AudioFile) => (
                    <AudioCard
                      key={file._id}
                      audioId={file._id}
                      audioName={file.name}
                      audioCondition={file.condition}
                      frequencies={file.frequencies}
                      isPremium={true}
                      onPlay={() => handleAudioStartPlaying(file._id)}
                      onPause={handleAudioStopPlaying}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SonicLibrary; 