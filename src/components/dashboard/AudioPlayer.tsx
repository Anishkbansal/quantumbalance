import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface Prescription {
  _id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  category: string;
  isCompleted: boolean;
}

interface AudioPlayerProps {
  prescription: Prescription;
  currentlyPlaying: string | null;
  onTogglePlay: (id: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  prescription,
  currentlyPlaying,
  onTogglePlay
}) => {
  const [volume, setVolume] = useState(80);
  const isPlaying = currentlyPlaying === prescription._id;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };

  return (
    <div className="flex items-center space-x-3 mt-4">
      <button
        onClick={() => onTogglePlay(prescription._id)}
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isPlaying ? 'bg-gold-500 text-navy-900' : 'bg-navy-700 text-gold-500'
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      
      <div className="flex items-center space-x-2 w-full">
        <Volume2 className="text-gray-400 w-4 h-4" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 accent-gold-500"
        />
        <div className="flex-1 h-1 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-500"
            style={{ width: isPlaying ? '45%' : '0%' }}
          ></div>
        </div>
        <span className="text-gray-400 text-sm">
          {isPlaying ? '01:45 / ' : '00:00 / '}{prescription.duration}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer; 