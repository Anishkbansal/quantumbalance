import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

// Global audio manager to ensure only one audio plays at a time
export const globalAudioManager = {
  currentAudio: null as HTMLAudioElement | null,
  currentId: null as string | null,
  listeners: [] as Function[],
  
  play(audio: HTMLAudioElement, id: string) {
    // Stop current playing audio if any
    if (this.currentAudio && this.currentAudio !== audio) {
      this.currentAudio.pause();
    }
    
    // Set new current audio
    this.currentAudio = audio;
    this.currentId = id;
    
    // Notify listeners
    this.notifyListeners();
  },
  
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    this.currentAudio = null;
    this.currentId = null;
    
    // Notify listeners
    this.notifyListeners();
  },
  
  addListener(callback: Function) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  },
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentId));
  },
  
  isPlaying(id: string) {
    return this.currentId === id && this.currentAudio && !this.currentAudio.paused;
  }
};

// Make it accessible globally for easier cross-component access
if (typeof window !== 'undefined') {
  (window as any).globalAudioManager = globalAudioManager;
}

interface AudioPlayerProps {
  audioUrl: string;
  audioTitle: string;
  onPlay?: () => void;
  onPause?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioTitle,
  onPlay,
  onPause
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioId = useRef<string>(audioUrl); // Use the URL as a unique ID

  // Setup audio and global audio manager listeners
  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    
    // Set CORS attributes to prevent download and enable streaming
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    
    // Set the source after attaching event listeners
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    
    // Set the audio source
    audio.src = audioUrl;
    
    // Add listener for global audio manager
    const removeListener = globalAudioManager.addListener((playingId: string | null) => {
      // Update isPlaying state based on global audio manager
      setIsPlaying(playingId === audioId.current);
    });
    
    // Clean up on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleError);
        
        // Remove global audio manager listener
        removeListener();
        
        // If this is the current playing audio, stop it
        if (globalAudioManager.currentId === audioId.current) {
          globalAudioManager.stop();
        }
      }
    };
  }, [audioUrl]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      globalAudioManager.stop();
      setIsPlaying(false);
      if (onPause) onPause();
    } else {
      audioRef.current.play()
        .then(() => {
          globalAudioManager.play(audioRef.current!, audioId.current);
          setIsPlaying(true);
          if (onPlay) onPlay();
        })
        .catch(err => {
          console.error('Error playing audio:', err);
          setError('Could not play audio. Try again or use headphones.');
        });
    }
  };

  // Handle audio ended event
  const handleEnded = () => {
    if (!isLooping) {
      globalAudioManager.stop();
      setIsPlaying(false);
      setAudioProgress(0);
    }
  };

  // Update progress state on timeupdate
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
  };

  // Set duration once metadata is loaded
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setAudioDuration(audioRef.current.duration);
    setError(null);
  };

  // Handle audio error
  const handleError = (e: Event) => {
    console.error('Audio error:', e);
    setIsPlaying(false);
    setError('Error loading audio file. Please try again.');
  };

  // Function to restart current audio
  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Error restarting audio:', err);
      });
    }
  };

  // Function to toggle loop mode
  const handleToggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLooping(!isLooping);
    
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  // Format time in mm:ss format
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update loop property when isLooping changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  return (
    <div className="audio-player">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h4 className="font-medium text-white">
            {audioTitle}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          {isPlaying && (
            <>
              {/* Restart button */}
              <button 
                onClick={handleRestart}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-navy-700 text-gold-500 hover:bg-navy-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v6h6"></path>
                  <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
                </svg>
              </button>
              
              {/* Loop button */}
              <button 
                onClick={handleToggleLoop}
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
            onClick={togglePlayPause}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20' 
                : 'bg-navy-700 text-gold-500 hover:bg-navy-600'
            }`}
          >
            {isPlaying ? 
              <Pause className="w-5 h-5" /> : 
              <Play className="w-5 h-5" />
            }
          </button>
        </div>
      </div>
      
      {/* Audio player - hidden but needed for browser support */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Error message */}
      {error && (
        <div className="text-amber-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      {/* Audio progress bar and timer - always show progress bar */}
      <div className="mt-2 mb-3">
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
    </div>
  );
};

export default AudioPlayer; 