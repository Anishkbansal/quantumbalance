import React from 'react';
import CommonAudioPlayer from '../audio/AudioPlayer';

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
  const isPlaying = currentlyPlaying === prescription._id;

  return (
    <div className="mt-4">
      <CommonAudioPlayer 
        audioUrl={prescription.audioUrl}
        audioTitle={prescription.title}
        onPlay={() => {
          if (!isPlaying) {
            onTogglePlay(prescription._id);
          }
        }}
        onPause={() => {
          if (isPlaying) {
            onTogglePlay(prescription._id);
          }
        }}
      />
    </div>
  );
};

export default AudioPlayer; 