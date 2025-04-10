import React, { useState } from 'react';
import { Music, Clock, AudioWaveform, ChevronDown, ChevronUp } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface AudioCardProps {
  audioId: string;
  audioName: string;
  audioCondition: string;
  frequencies?: string[];
  isPremium?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

const AudioCard: React.FC<AudioCardProps> = ({
  audioId,
  audioName,
  audioCondition,
  frequencies = [],
  isPremium = false,
  onPlay,
  onPause
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="mb-4 last:mb-0 p-3 bg-navy-800 rounded-lg border border-navy-700 hover:border-gold-500 transition-colors shadow-md">
      <div className="flex items-start mb-2">
        <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center mr-2 mt-0.5">
          <Music className="w-4 h-4 text-gold-500" />
        </div>
        <div className="flex-1">
          <AudioPlayer 
            audioUrl={`http://localhost:5000/api/audio-files/${audioId}`}
            audioTitle={audioName}
            onPlay={onPlay}
            onPause={onPause}
          />
          
          {/* Condition Label */}
          <div className="text-navy-300 text-sm mb-2">
            Condition: <span className="text-gold-500">{audioCondition}</span>
          </div>
          
          {/* Collapsible details */}
          <div className="overflow-hidden text-sm">
            {isExpanded ? (
              <div>
                <p className="text-navy-300 mb-2">
                  Frequencies: {frequencies && frequencies.length > 0 
                    ? frequencies.join(', ') 
                    : 'None specified'}
                </p>
                <button
                  onClick={toggleExpand}
                  className="mt-2 text-gold-500 hover:text-gold-400 text-xs flex items-center"
                >
                  Show less <ChevronUp className="w-3 h-3 ml-1" />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-navy-300 truncate">
                  Frequencies: {frequencies && frequencies.length > 0 
                    ? frequencies.join(', ') 
                    : 'None specified'}
                </p>
                <button
                  onClick={toggleExpand}
                  className="mt-2 text-gold-500 hover:text-gold-400 text-xs flex items-center"
                >
                  Show more <ChevronDown className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3 text-sm border-t border-navy-700 pt-2">
              <span className="flex items-center gap-1 text-gold-500/70">
                <Clock className="w-4 h-4" /> 3 minutes daily
              </span>
              <span className="flex items-center gap-1 text-emerald-500/70">
                <AudioWaveform className="w-4 h-4" /> 
                {isPremium ? 'Premium audio' : 'Standard audio'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioCard; 