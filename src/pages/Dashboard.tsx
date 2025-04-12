import React, { useState, useEffect, useCallback } from 'react';
import { differenceInDays, parseISO, format, formatDistanceStrict } from 'date-fns';
import { Activity, Clock, Settings, MessageSquare, AlertCircle, Volume2, Play, Pause, User as UserIcon, Check, ChevronDown, ChevronUp, Music, Package, AudioWaveform } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import WellnessTracker from '../components/WellnessTracker';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import UserMessaging from '../components/messaging/UserMessaging';
import UnreadIndicator from '../components/messaging/UnreadIndicator';
import SonicLibrary from '../components/dashboard/SonicLibrary';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import { API_URL } from '../config/constants';

// Define the User interface
interface User {
  _id: string;
  name: string;
  email: string;
  packageType: string;
  activePackage: any | null;
  profile?: {
    avatar?: string;
    bio?: string;
  };
  isAdmin?: boolean;
  isVerified?: boolean;
}

// Interface for auth context
interface AuthContextType {
  user: User | null;
  updateUser: (userData: Partial<User>) => void;
  login: (username: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Interface for prescription frequency with condition
interface PrescriptionFrequency {
  value: string[];
  purpose: string;
  condition: string;
  order: number;
  audioId?: string | { _id: string; name: string; condition: string; frequencies: string[] } | null;
}

// Interface for audio file
interface AudioFile {
  filename: string;
  title: string;
  path: string;
  size: number;
  lastModified: Date;
}

// Interface for prescriptions
interface Prescription {
  _id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  category: string;
  isCompleted: boolean;
  frequency?: string;
}

// Interface for grouped prescriptions by condition
interface GroupedPrescription {
  condition: string;
  frequencies: PrescriptionFrequency[];
}

// Interface for package time info
interface PackageTimeInfo {
  days: number;
  hours: number;
  formattedDate: string;
}

// Interface for active package details
interface PackageInfo {
  _id: string;
  name: string;
  description: string;
  packageType: string;
  price: number;
  features: string[];
  expiryDate: string;
}

interface ActivePackageResponse {
  success: boolean;
  message?: string;
  packageInfo?: PackageInfo;
  timeRemaining?: PackageTimeInfo;
}

// Mock prescriptions data
const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    _id: "1",
    title: "Morning Meditation",
    description: "Start your day with a calm and focused mind",
    category: "meditation",
    duration: "10:00",
    audioUrl: "/audios/meditation1.mp3",
    isCompleted: false
  },
  {
    _id: "2",
    title: "Stress Relief",
    description: "Quick session to reduce stress and anxiety",
    category: "relaxation",
    duration: "15:00",
    audioUrl: "/audios/stress-relief.mp3",
    isCompleted: false
  },
  {
    _id: "3",
    title: "Deep Sleep",
    description: "Prepare your mind and body for restful sleep",
    category: "sleep",
    duration: "20:00",
    audioUrl: "/audios/deep-sleep.mp3",
    isCompleted: false
  }
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'wellness' | 'messages' | 'sonic-library'>('prescriptions');
  const [error] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [groupedPrescriptions, setGroupedPrescriptions] = useState<GroupedPrescription[]>([]);
  const [expandedConditions, setExpandedConditions] = useState<{[key: string]: boolean}>({});
  const [activePackage, setActivePackage] = useState<PackageInfo | null>(null);
  const [packageTimeRemaining, setPackageTimeRemaining] = useState<PackageTimeInfo | null>(null);
  const [expandedFrequencies, setExpandedFrequencies] = useState<{[key: string]: boolean}>({});
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [showWellnessReminder, setShowWellnessReminder] = useState<boolean>(false);
  const [defaultAudioFiles, setDefaultAudioFiles] = useState<AudioFile[]>([]);
  const [audioDetails, setAudioDetails] = useState<{[key: string]: { name: string, condition: string, frequencies: string[] }}>({});
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [secureTokens, setSecureTokens] = useState<{[key: string]: string}>({});
  const [mediaSession, setMediaSession] = useState<MediaSession | null>(null);
  
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Function to fetch active package
  const fetchActivePackage = useCallback(async () => {
    try {
      if (!user) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      setLoading(true);
      const response = await fetch(
        `${API_URL}/packages/user/active`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data: ActivePackageResponse = await response.json();
      
      if (data.success && data.packageInfo) {
        setActivePackage(data.packageInfo);
        setPackageTimeRemaining(data.timeRemaining || null);
      } else {
        console.log('No active package or package expired:', data.message);
        setActivePackage(null);
        setPackageTimeRemaining(null);
        
        // If user previously had a package but now doesn't, update user state
        if (user.packageType !== 'none') {
          updateUser({
            ...user,
            packageType: 'none'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching active package:', error);
      setActivePackage(null);
      setPackageTimeRemaining(null);
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);
  
  // Function to fetch prescriptions
  const fetchPrescriptions = useCallback(async () => {
    try {
      if (!user) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      setLoading(true);
      const response = await fetch(
        `${API_URL}/prescription/active`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.prescription) {
        // Group frequencies by condition
        if (data.prescription.frequencies && data.prescription.frequencies.length > 0) {
          const groupedByCondition: {[key: string]: PrescriptionFrequency[]} = {};
          
          // Group frequencies by their condition
          data.prescription.frequencies.forEach((freq: PrescriptionFrequency) => {
            if (!groupedByCondition[freq.condition]) {
              groupedByCondition[freq.condition] = [];
            }
            groupedByCondition[freq.condition].push(freq);
          });
          
          // Sort frequencies by order within each condition
          // Convert to array of grouped prescriptions
          const groupedResult = Object.entries(groupedByCondition).map(([condition, frequencies]) => ({
            condition,
            frequencies
          }));
          
          setGroupedPrescriptions(groupedResult);
          
          // Initialize all conditions as expanded
          const initialExpandState: {[key: string]: boolean} = {};
          groupedResult.forEach(group => {
            initialExpandState[group.condition] = true;
          });
          setExpandedConditions(initialExpandState);
        } else {
          setGroupedPrescriptions([]);
        }
      } else {
        console.log('No active prescription found:', data.message);
        setGroupedPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setGroupedPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Fetch default audio files
  const fetchDefaultAudioFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(
        `${API_URL}/audio/default`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setDefaultAudioFiles(data.audioFiles);
      }
    } catch (error) {
      console.error('Error fetching default audio files:', error);
    }
  }, []);
  
  // Fetch data on mount
  useEffect(() => {
    if (user && localStorage.getItem('token')) {
      fetchActivePackage();
      fetchPrescriptions();
      fetchDefaultAudioFiles();
      checkWellnessReminder();
    }
  }, [user, fetchActivePackage, fetchPrescriptions, fetchDefaultAudioFiles]);
  
  useEffect(() => {
    // Check for messages in location state
    if (location.state?.message) {
      setMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [location.state]);
  
  // Function to handle audio playback
  const handlePlayAudio = (audioPath: string, audioTitle: string) => {
    console.log('Playing audio:', audioPath, 'Title:', audioTitle);
    
    // If clicking the already playing audio, pause it
    if (currentlyPlaying === audioPath) {
      if (audioRef) {
        audioRef.pause();
      }
      setCurrentlyPlaying(null);
      return;
    }
    
    // Stop any currently playing audio before setting up the new one
    if (audioRef) {
      // Remove all existing event listeners to prevent memory leaks
      audioRef.pause();
      
      // Important: first set currently playing to null to reset UI state
      setCurrentlyPlaying(null);
      
      // Small delay to ensure UI updates before playing new audio
      setTimeout(() => {
        setupAndPlayNewAudio(audioPath, audioTitle);
      }, 10);
    } else {
      // No audio playing, play immediately
      setupAndPlayNewAudio(audioPath, audioTitle);
    }
  };

  // Add this function for secure audio streaming
  const getSecureAudioURL = (audioPath: string, audioTitle: string) => {
    // Only apply secure streaming to API files (custom uploads)
    if (!audioPath.includes('/api/audio-files/')) {
      return audioPath; // Return as-is for system files
    }
    
    // Generate a unique token for this play session
    const token = uuidv4();
    const timestamp = Date.now();
    // Expire token after 5 minutes
    const expiry = timestamp + (5 * 60 * 1000);
    
    // Create an encrypted token that ties this request to the current user and session
    const dataToEncrypt = JSON.stringify({
      path: audioPath,
      user: user?._id || 'anonymous',
      title: audioTitle,
      timestamp,
      expiry,
      token
    });
    
    // Encrypt using AES (would use a server-stored key in production)
    const encryptedData = CryptoJS.AES.encrypt(
      dataToEncrypt, 
      'YOUR_SECURE_KEY_REPLACE_IN_PRODUCTION'
    ).toString();
    
    // Store token for validation
    setSecureTokens(prev => ({...prev, [token]: audioPath}));
    
    // Build URL with auth token
    const secureURL = `${audioPath}?auth=${encodeURIComponent(encryptedData)}&token=${token}`;
    
    return secureURL;
  };

  // Replace the setupAndPlayNewAudio function
  const setupAndPlayNewAudio = (audioPath: string, audioTitle: string) => {
    console.log('Setting up audio:', audioPath, 'Title:', audioTitle);
    
    // Validate audio path
    if (!audioPath) {
      console.error('Invalid audio path: empty path provided');
      setMessage('Error: Invalid audio path');
      return;
    }
    
    // Get the secure URL for API-based audio files
    const secureAudioPath = getSecureAudioURL(audioPath, audioTitle);
    
    // Format checking and compatibility detection
    const isCustomAudio = audioPath.includes('/api/audio-files/');
    const fileExtension = audioPath.split('.').pop()?.toLowerCase();
    
    // Check if file might be an unsupported format like .ogg or .opus
    const potentiallyUnsupportedFormat = isCustomAudio || 
      (fileExtension && ['ogg', 'opus'].includes(fileExtension));
    
    // If clicking the already playing audio, pause it
    if (currentlyPlaying === audioPath) {
      if (audioRef) {
        audioRef.pause();
      }
      setCurrentlyPlaying(null);
      return;
    }
    
    // Clean up previous event listeners if audioRef exists
    if (audioRef) {
      audioRef.pause();
      audioRef.removeEventListener('ended', () => {});
      audioRef.removeEventListener('error', () => {});
      audioRef.removeEventListener('timeupdate', () => {});
      audioRef.removeEventListener('loadedmetadata', () => {});
      
      // Important: first set currently playing to null to reset UI state
      setCurrentlyPlaying(null);
      
      // Small delay to ensure UI updates before playing new audio
      setTimeout(() => {
        initializeSecureAudio(secureAudioPath, audioPath, audioTitle);
      }, 10);
    } else {
      // No audio playing, play immediately
      initializeSecureAudio(secureAudioPath, audioPath, audioTitle);
    }
  };

  // Create a new function to initialize secure audio
  const initializeSecureAudio = (secureAudioPath: string, originalPath: string, audioTitle: string) => {
    // Create a new audio element
    const audio = new Audio();
    
    // Apply loop setting if set
    audio.loop = isLooping;
    
    // Create named event handlers so they can be properly removed later
    const endedHandler = () => {
      if (!isLooping) {
        setCurrentlyPlaying(null);
        setAudioProgress(0);
      }
    };
    
    // Create more detailed error handler
    const errorHandler = (e: Event) => {
      console.error('Audio playback error:', e);
      // Log detailed info about the audio path for debugging
      console.error('Failed audio source details:', {
        path: secureAudioPath,
        title: audioTitle,
        isCustom: secureAudioPath.includes('/api/audio-files/')
      });
      
      // Check if the issue might be a CORS problem (common with custom audio from API)
      if (secureAudioPath.includes('/api/audio-files/')) {
        const corsMessage = 'Server audio file access error. This might be a permissions issue.';
        console.error(corsMessage);
        setMessage(corsMessage);
      } 
      // Check if the audio format is supported by this browser
      else if (secureAudioPath.includes('.ogg') || secureAudioPath.includes('.opus')) {
        setMessage('This audio format may not be supported by your browser. Try Chrome or Firefox.');
      } 
      // For default system audio files that should work
      else if (secureAudioPath.startsWith('/audios/')) {
        setMessage('The audio file could not be found. Please try a different file.');
      }
      else {
        setMessage('Error playing audio. Please try another file.');
      }
      
      setCurrentlyPlaying(null);
      setAudioProgress(0);
    };
    
    const updateProgressHandler = () => {
      setAudioProgress(audio.currentTime);
    };
    
    const loadedMetadataHandler = () => {
      setAudioDuration(audio.duration);
      
      // Set up media session API for playback controls
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: audioTitle,
          artist: 'Quantum Balance',
          album: 'Healing Frequencies',
        });
        
        // Add action handlers
        navigator.mediaSession.setActionHandler('play', () => {
          audio.play();
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause();
        });
        
        // Set current media session
        setMediaSession(navigator.mediaSession);
      }
    };
    
    // Add event listeners
    audio.addEventListener('ended', endedHandler);
    audio.addEventListener('error', errorHandler);
    audio.addEventListener('timeupdate', updateProgressHandler);
    audio.addEventListener('loadedmetadata', loadedMetadataHandler);
    
    // Security measures to prevent easy downloading
    audio.setAttribute('controlsList', 'nodownload');
    audio.crossOrigin = "anonymous"; // This helps with CORS but also prevents access to audio data
    
    // Disable right-click menu on audio element
    audio.oncontextmenu = () => false;
    
    // Set proper preload
    audio.preload = "auto";
    
    // Set src last
    audio.src = secureAudioPath;
    
    // Force browser to load
    audio.load();
    
    // For API audio, check if fetch works before playing
    if (secureAudioPath.includes('/api/audio-files/')) {
      // Create a HEAD request to check if the file exists and is accessible
      const checkHeaders = new Headers();
      checkHeaders.append('Range', 'bytes=0-0'); // Just request the first byte to check
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (token) {
        checkHeaders.append('Authorization', `Bearer ${token}`);
      }
      
      fetch(secureAudioPath, {
        method: 'HEAD',
        headers: checkHeaders
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Access error: ${response.status}`);
        }
        startSecurePlayback(audio, originalPath);
      })
      .catch(err => {
        console.error('Audio access error:', err);
        // Try once more with direct authorization header
        if (token) {
          console.log('Retrying with authorization header...');
          const plainPath = originalPath.split('?')[0]; // Remove any query params
          const retryHeaders = new Headers();
          retryHeaders.append('Authorization', `Bearer ${token}`);
          
          fetch(plainPath, {
            method: 'HEAD',
            headers: retryHeaders
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Access error on retry: ${response.status}`);
            }
            // Set direct URL without token params but with auth header
            audio.src = plainPath;
            startSecurePlayback(audio, originalPath);
          })
          .catch(retryErr => {
            console.error('Audio access error on retry:', retryErr);
            setMessage('Error accessing audio. Please ensure you have an active package.');
            setCurrentlyPlaying(null);
          });
        } else {
          setMessage('Error accessing audio. Please ensure you have permission.');
          setCurrentlyPlaying(null);
        }
      });
    } else {
      startSecurePlayback(audio, originalPath);
    }
  };

  // Function to start secure playback
  const startSecurePlayback = (audio: HTMLAudioElement, originalPath: string) => {
    setAudioRef(audio);
    setCurrentlyPlaying(originalPath);
    setAudioProgress(0);
    
    // For custom API audio files, we need to attach authorization headers that the Audio element
    // doesn't support natively - using XMLHttpRequest
    if (originalPath.includes('/api/audio-files/') && localStorage.getItem('token')) {
      // Create a new XHR request to handle authentication
      const xhr = new XMLHttpRequest();
      xhr.open('GET', originalPath);
      xhr.responseType = 'blob';
      
      // Set auth header
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          // Create blob URL from the response
          const blob = new Blob([xhr.response], { type: 'audio/mpeg' });
          const blobUrl = URL.createObjectURL(blob);
          
          // Use the blob URL for the audio element
          audio.src = blobUrl;
          
          // Clean up the blob URL when audio is done
          audio.onended = function() {
            URL.revokeObjectURL(blobUrl);
          };
          
          // Play the audio
          audio.play().catch(err => handlePlaybackError(err));
        } else {
          console.error('Error loading audio via XHR:', xhr.status);
          setMessage(`Error loading audio: ${xhr.statusText}`);
          setCurrentlyPlaying(null);
        }
      };
      
      xhr.onerror = function() {
        console.error('XHR error loading audio');
        setMessage('Network error while loading audio');
        setCurrentlyPlaying(null);
      };
      
      xhr.send();
    } else {
      // Standard playback for local files
      // Play with a delay to ensure loading
      setTimeout(() => {
        audio.play().catch(err => handlePlaybackError(err));
      }, 500);
    }
    
    // Handle playback errors
    const handlePlaybackError = (err: any) => {
      console.error('Error playing audio:', err);
      
      if (err.name === "NotSupportedError") {
        setMessage('Your browser does not support this audio format or the file cannot be found.');
      } else if (err.name === "AbortError") {
        setMessage('Audio playback was aborted. Please try again.');
      } else if (err.name === "NetworkError") {
        setMessage('Network error while loading audio. Check your connection.');
      } else {
        setMessage(`Error playing audio: ${err.message || 'Unknown error'}`);
      }
      
      setCurrentlyPlaying(null);
    };
  };

  // Add cleanup effect for audio element when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.removeEventListener('ended', () => {});
        audioRef.removeEventListener('error', () => {});
        audioRef.removeEventListener('timeupdate', () => {});
        audioRef.removeEventListener('loadedmetadata', () => {});
        setCurrentlyPlaying(null);
      }
    };
  }, []);

  // Add effect to update audio reference loop property when isLooping changes
  useEffect(() => {
    if (audioRef) {
      audioRef.loop = isLooping;
    }
  }, [isLooping, audioRef]);

  // Format time in mm:ss format
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to restart current audio
  const handleRestartAudio = () => {
    if (!audioRef) return;
    audioRef.currentTime = 0;
    audioRef.play().catch(err => {
      console.error('Error restarting audio:', err);
    });
  };

  // Function to toggle loop mode
  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  // Function to generate a new prescription
  const generatePrescription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage("Authentication error. Please log in again.");
        return;
      }
      
      // Safety check - verify user has a package and questionnaire before attempting to generate
      if (!user?.healthQuestionnaire) {
        setMessage("You need to complete a health questionnaire first.");
        return;
      }
      
      if (!activePackage) {
        setMessage("You need an active package to generate a prescription.");
        return;
      }
      
      const response = await fetch(
        `${API_URL}/prescription/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessage("Prescription generated successfully!");
        // Refresh prescriptions
        fetchPrescriptions();
      } else {
        setMessage(`Error: ${data.message || 'Failed to generate prescription'}`);
        console.error('Error generating prescription:', data.message);
      }
    } catch (error) {
      console.error('Error generating prescription:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded state for a condition
  const toggleConditionExpand = (condition: string) => {
    setExpandedConditions(prev => ({
      ...prev,
      [condition]: !prev[condition]
    }));
  };

  const toggleFrequencyExpand = (frequencyId: string) => {
    setExpandedFrequencies(prev => ({
      ...prev,
      [frequencyId]: !prev[frequencyId]
    }));
  };

  // Check if wellness reminder should be shown
  const checkWellnessReminder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(
        `${API_URL}/wellness/check-last-entry`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success && response.data.shouldPrompt) {
        setShowWellnessReminder(true);
      }
    } catch (error) {
      console.error('Error checking wellness reminder:', error);
    }
  };

  // Function to fetch audio file details
  const fetchAudioDetails = async (audioId: string) => {
    try {
      if (!audioId) return null;
      
      // Check if we already have this audio's details
      if (audioDetails[audioId]) {
        return audioDetails[audioId];
      }
      
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await fetch(
        `http://localhost:5000/api/audio-files/${audioId}/details`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.success && data.audioFile) {
        // Save the details for later use
        setAudioDetails(prev => ({
          ...prev,
          [audioId]: {
            name: data.audioFile.name,
            condition: data.audioFile.condition,
            frequencies: data.audioFile.frequencies
          }
        }));
        
        return data.audioFile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching audio details:', error);
      return null;
    }
  };

  // Helper function to get audio name
  const getAudioName = (freq: PrescriptionFrequency) => {
    if (!freq.audioId) return `Frequencies: ${freq.value.join(', ')} Hz`;
    
    // If audioId is an object with name property, use it
    if (typeof freq.audioId === 'object' && freq.audioId && freq.audioId.name) {
      return freq.audioId.name;
    }
    
    // If we have cached details for this audio ID, use that
    if (typeof freq.audioId === 'string' && audioDetails[freq.audioId]) {
      return audioDetails[freq.audioId].name;
    }
    
    // Default case - use frequencies
    return `Frequencies: ${freq.value.join(', ')} Hz`;
  };

  // Add this useEffect to fetch audio details for any audioIds that are strings
  useEffect(() => {
    const fetchMissingAudioDetails = async () => {
      if (!groupedPrescriptions || groupedPrescriptions.length === 0) return;

      // Collect all audioIds that are strings (not objects) and we don't have details for
      const audioIdsToFetch = new Set<string>();
      
      groupedPrescriptions.forEach(group => {
        group.frequencies.forEach(freq => {
          if (freq.audioId && typeof freq.audioId === 'string' && !audioDetails[freq.audioId]) {
            audioIdsToFetch.add(freq.audioId);
          }
        });
      });
      
      // Fetch details for each audio file - convert Set to Array for compatibility
      const audioIdsArray = Array.from(audioIdsToFetch);
      for (const audioId of audioIdsArray) {
        await fetchAudioDetails(audioId);
      }
    };
    
    fetchMissingAudioDetails();
  }, [groupedPrescriptions, audioDetails]);

  // Render the prescriptions section
  const renderPrescriptionsSection = () => {
    if (!activePackage) {
      return (
        <div className="text-center py-8">
          <p className="text-navy-300">Please purchase a package to access prescriptions.</p>
        </div>
      );
    }

    return (
      <div>
        {/* Prescription Frequencies */}
        {groupedPrescriptions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gold-500 mb-4">Your Prescribed Frequencies</h3>
            {groupedPrescriptions.map((group, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <div className="bg-navy-750 rounded-lg border border-navy-600 overflow-hidden shadow-lg">
                  {/* Condition Header - Clickable to expand/collapse */}
                  <div 
                    className="bg-gradient-to-r from-navy-700 to-navy-750 p-4 flex justify-between items-center cursor-pointer border-l-4 border-gold-500"
                    onClick={() => toggleConditionExpand(group.condition)}
                  >
                    <h3 className="text-lg font-medium text-white">{group.condition}</h3>
                    <div className="flex items-center">
                      <span className="text-navy-300 text-sm mr-3">
                        {group.frequencies.length} {group.frequencies.length === 1 ? 'frequency set' : 'frequency sets'}
                      </span>
                      {expandedConditions[group.condition] ? 
                        <ChevronUp className="w-5 h-5 text-gold-500" /> : 
                        <ChevronDown className="w-5 h-5 text-gold-500" />
                      }
                    </div>
                  </div>
                  
                  {/* Frequencies for this condition */}
                  {expandedConditions[group.condition] && (
                    <div className="p-4">
                      {group.frequencies.map((freq, index) => {
                        const frequencyId = `${group.condition}-${index}`;
                        return (
                          <div 
                            key={frequencyId}
                            className="mb-4 last:mb-0 p-3 bg-navy-800 rounded-lg border border-navy-700 hover:border-gold-500 transition-colors shadow-md"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center mr-2">
                                  <Music className="w-4 h-4 text-gold-500" />
                                </div>
                                <h4 className="font-medium text-white">
                                  {freq.audioId ? getAudioName(freq) : "Frequency for " + freq.condition}
                                  {freq.audioId && (
                                    <span className="ml-2 text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                      Custom audio
                                    </span>
                                  )}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                {freq.audioId && currentlyPlaying === (freq.audioId 
                                  ? `http://localhost:5000/api/audio-files/${typeof freq.audioId === 'object' ? freq.audioId._id : freq.audioId}` 
                                  : `/audios/freq_${freq.value[0]}.mp3`) && (
                                  <>
                                    {/* Restart button */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestartAudio();
                                      }}
                                      className="w-8 h-8 rounded-full flex items-center justify-center bg-navy-700 text-gold-500 hover:bg-navy-600"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 2v6h6"></path>
                                        <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
                                      </svg>
                                    </button>
                                    
                                    {/* Loop button */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleLoop();
                                      }}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isLooping ? 'bg-gold-500 text-navy-900' : 'bg-navy-700 text-gold-500 hover:bg-navy-600'
                                      }`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 2l4 4-4 4"></path>
                                        <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                                        <path d="M7 22l-4-4 4-4"></path>
                                        <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                                      </svg>
                                    </button>
                                  </>
                                )}
                                
                                {/* Play button - only show if audio is assigned */}
                                {freq.audioId && (
                                  <button 
                                    onClick={() => {
                                      const audioId = freq.audioId 
                                        ? (typeof freq.audioId === 'object' ? freq.audioId._id : freq.audioId)
                                        : null;
                                      
                                      handlePlayAudio(
                                        audioId 
                                          ? `http://localhost:5000/api/audio-files/${audioId}` 
                                          : `/audios/freq_${freq.value[0]}.mp3`, 
                                        getAudioName(freq)
                                      );
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                      currentlyPlaying === (freq.audioId 
                                        ? `http://localhost:5000/api/audio-files/${typeof freq.audioId === 'object' ? freq.audioId._id : freq.audioId}` 
                                        : `/audios/freq_${freq.value[0]}.mp3`) 
                                        ? 'bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20' 
                                        : 'bg-navy-700 text-gold-500 hover:bg-navy-600'
                                    }`}
                                  >
                                    {currentlyPlaying === (freq.audioId 
                                      ? `http://localhost:5000/api/audio-files/${typeof freq.audioId === 'object' ? freq.audioId._id : freq.audioId}` 
                                      : `/audios/freq_${freq.value[0]}.mp3`) ? 
                                      <Pause className="w-5 h-5" /> : 
                                      <Play className="w-5 h-5" />
                                    }
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Audio progress bar and timer - only show if playing */}
                            {freq.audioId && currentlyPlaying === (freq.audioId 
                              ? `http://localhost:5000/api/audio-files/${typeof freq.audioId === 'object' ? freq.audioId._id : freq.audioId}` 
                              : `/audios/freq_${freq.value[0]}.mp3`) && (
                              <div className="mt-3 mb-3">
                                <div className="flex justify-between text-xs text-navy-300 mb-1">
                                  <span>{formatTime(audioProgress)}</span>
                                  <span>{formatTime(audioDuration)}</span>
                                </div>
                                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gold-500 transition-all"
                                    style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {/* Show pending message if no audio is assigned */}
                            {!freq.audioId && (
                              <div className="mt-3 mb-3">
                                <div className="flex items-center text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                                  <Clock className="w-5 h-5 mr-2 text-amber-500" />
                                  <p>Your prescription is being processed. Our healthcare specialist will assign custom audio for this condition within 24 hours.</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Collapsible description - only show when audio is assigned */}
                            {freq.audioId && (
                              <div className="overflow-hidden text-sm">
                                {expandedFrequencies[frequencyId] ? (
                                  <div>
                                    <p className="text-navy-300">{freq.purpose}</p>
                                    <button
                                      onClick={() => toggleFrequencyExpand(frequencyId)}
                                      className="mt-2 text-gold-500 hover:text-gold-400 text-xs flex items-center"
                                    >
                                      Show less <ChevronUp className="w-3 h-3 ml-1" />
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-navy-300 truncate">{freq.purpose}</p>
                                    <button
                                      onClick={() => toggleFrequencyExpand(frequencyId)}
                                      className="mt-2 text-gold-500 hover:text-gold-400 text-xs flex items-center"
                                    >
                                      Show more <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                              
                            <div className="flex justify-between items-center mt-3 text-sm border-t border-navy-700 pt-2">
                              <span className="flex items-center gap-1 text-gold-500/70">
                                <Clock className="w-4 h-4" /> 3 minutes daily
                              </span>
                              {freq.audioId && (
                                <span className="flex items-center gap-1 text-emerald-500/70">
                                  <AudioWaveform className="w-4 h-4" /> Custom audio available
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Default Audio Files - Don't show to single session users */}
        {user?.packageType !== 'single' && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gold-500 mb-4">Available Audio Therapies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultAudioFiles.map((audio, index) => (
                <div 
                  key={index}
                  className="bg-navy-800 rounded-lg p-4 border border-navy-700 hover:border-gold-500 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium truncate">{audio.title}</h4>
                    <div className="flex items-center space-x-2">
                      {currentlyPlaying === audio.path && (
                        <>
                          {/* Restart button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestartAudio();
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-navy-700 text-gold-500 hover:bg-navy-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 2v6h6"></path>
                              <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
                            </svg>
                          </button>
                          
                          {/* Loop button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLoop();
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isLooping ? 'bg-gold-500 text-navy-900' : 'bg-navy-700 text-gold-500 hover:bg-navy-600'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 2l4 4-4 4"></path>
                              <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                              <path d="M7 22l-4-4 4-4"></path>
                              <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                            </svg>
                          </button>
                        </>
                      )}
                      
                      {/* Play button */}
                      <button
                        onClick={() => handlePlayAudio(audio.path, audio.title)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          currentlyPlaying === audio.path
                            ? 'bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20' 
                            : 'bg-navy-700 text-gold-500 hover:bg-navy-600'
                        }`}
                      >
                        {currentlyPlaying === audio.path ? 
                          <Pause className="w-5 h-5" /> : 
                          <Play className="w-5 h-5" />
                        }
                      </button>
                    </div>
                  </div>
                  <div className="text-navy-300 text-sm">
                    <p>Size: {Math.round(audio.size / 1024 / 1024)}MB</p>
                    <p>Last modified: {new Date(audio.lastModified).toLocaleDateString()}</p>
                  </div>

                  {/* Audio progress bar and timer - only show if playing */}
                  {currentlyPlaying === audio.path && (
                    <div className="mt-1 mb-3">
                      <div className="flex justify-between text-xs text-navy-300 mb-1">
                        <span>{formatTime(audioProgress)}</span>
                        <span>{formatTime(audioDuration)}</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gold-500 transition-all"
                          style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add this to render the messages content
  const renderMessagesSection = () => {
    return <UserMessaging />;
  };
  
  // Update the main render section to use the DashboardTabs component
  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-4 rounded-md bg-green-900/50 text-green-300 flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gold-500 mb-2">Your Dashboard</h1>
            <p className="text-navy-300">Welcome to your personalized quantum healing dashboard</p>
          </div>
          
          {/* User Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="text-right mr-4">
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-navy-300 text-sm">{user?.email}</p>
            </div>
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-gold-500">
              {user?.profile?.avatar ? (
                <img 
                  src={user.profile.avatar}
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-navy-700">
                  <UserIcon className="h-6 w-6 text-navy-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="flex flex-wrap mb-8">
          <div className="w-full lg:w-1/2 p-4">
            <div className="bg-navy-800 rounded-lg shadow-md p-6 border border-navy-700">
              <div className="mb-4 border-b border-navy-700 pb-4">
                <p className="text-navy-300 mb-1">Current Package:</p>
                <h2 className="text-xl font-bold text-gold-500 capitalize">
                  {loading ? 'Loading...' : (activePackage ? activePackage.name : 'No Active Package')}
                </h2>
              </div>
              
              {activePackage && packageTimeRemaining ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-navy-300">Expires in:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-gold-500 text-lg font-semibold">{packageTimeRemaining.days}</span>
                        <span className="text-navy-300 text-xs">days</span>
                      </div>
                      <span className="text-navy-400">:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-gold-500 text-lg font-semibold">{packageTimeRemaining.hours}</span>
                        <span className="text-navy-300 text-xs">hours</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-navy-300 text-sm">
                      {packageTimeRemaining.formattedDate}
                    </span>
                  </div>
                  
                  <div className="w-full bg-navy-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-gold-600 to-gold-400 h-full rounded-full"
                      style={{ 
                        width: `${Math.max(
                          5, 
                          Math.min(
                            100, 
                            100 - (packageTimeRemaining.days / 30) * 100
                          )
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-navy-300 mb-4">
                    You don't have an active package or your package has expired.
                  </p>
                  <button 
                    onClick={() => navigate('/packages')}
                    className="bg-gold-500 hover:bg-gold-600 text-navy-900 py-2 px-4 rounded-md"
                  >
                    Purchase a Package
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs navigation - use DashboardTabs component */}
        <DashboardTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          hasUnreadMessages={false} // TODO: Implement unread message functionality
          isPremiumUser={user?.packageType === 'premium'}
        />
        
        {/* Tab Content */}
        <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
          {activeTab === 'prescriptions' && (
            loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
              </div>
            ) : (
              renderPrescriptionsSection()
            )
          )}
          
          {activeTab === 'wellness' && <WellnessTracker />}
          
          {activeTab === 'sonic-library' && <SonicLibrary isPremium={user?.packageType === 'premium'} />}
          
          {activeTab === 'messages' && renderMessagesSection()}
        </div>
        
        {/* Wellness Reminder Modal */}
        {showWellnessReminder && !loading && user && !user.isAdmin && user.packageType !== 'none' && (
          <div className="fixed inset-0 bg-navy-900/80 flex items-center justify-center z-50 p-4">
            <WellnessTracker 
              showReminderOnly={true}
              onClose={() => setShowWellnessReminder(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 