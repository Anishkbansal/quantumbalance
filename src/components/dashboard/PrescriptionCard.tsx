import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface Prescription {
  _id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  category: string;
  isCompleted: boolean;
}

interface PrescriptionCardProps {
  prescription: Prescription;
  currentlyPlaying: string | null;
  onTogglePlay: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  currentlyPlaying,
  onTogglePlay,
  onToggleComplete
}) => {
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'meditation': 'text-indigo-400',
      'relaxation': 'text-green-400',
      'sleep': 'text-gold-400',
      'energy': 'text-amber-400',
      'focus': 'text-purple-400',
      'healing': 'text-teal-400',
    };
    return colorMap[category] || 'text-gray-400';
  };

  return (
    <div className={`bg-navy-800 rounded-xl overflow-hidden ${prescription.isCompleted ? 'border border-green-500/30' : ''}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white">
            {prescription.title}
          </h3>
          <button
            onClick={() => onToggleComplete(prescription._id)}
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              prescription.isCompleted ? 'bg-green-500 text-navy-900' : 'bg-navy-700 text-gray-400'
            }`}
          >
            {prescription.isCompleted && <Check className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-2">
          {prescription.description}
        </p>
        
        <div className="flex items-center gap-x-3 mb-2">
          <span className={`text-xs ${getCategoryColor(prescription.category)}`}>
            {prescription.category.charAt(0).toUpperCase() + prescription.category.slice(1)}
          </span>
          <span className="text-xs text-gray-500">
            {prescription.duration}
          </span>
          {prescription.isCompleted && (
            <span className="text-xs text-green-500 flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Completed
            </span>
          )}
        </div>
      
        <AudioPlayer
          prescription={prescription}
          currentlyPlaying={currentlyPlaying}
          onTogglePlay={onTogglePlay}
        />
      </div>
      
      <div className="px-6 py-3 bg-navy-750 border-t border-navy-700 flex items-center justify-between">
        <div className="flex items-center text-yellow-500 text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          <span>Best experienced with headphones</span>
        </div>
        
        <div className="text-xs text-gray-500">
          {prescription.isCompleted ? 'Last played 2 days ago' : 'New'}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionCard; 