import fs from 'fs';
import path from 'path';

/**
 * Get all default audio files from the AudioDefault directory
 * @returns {Promise<Array>} Array of audio file objects
 */
export const getDefaultAudioFiles = () => {
  const audioPath = path.join(process.cwd(), 'public', 'AudioDefault');
  
  try {
    const files = fs.readdirSync(audioPath);
    
    // Filter for audio files and create objects with metadata
    const audioFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.ogg', '.opus', '.m4a', '.aac'].includes(ext);
      })
      .map(file => {
        const stats = fs.statSync(path.join(audioPath, file));
        return {
          filename: file,
          title: path.parse(file).name,
          path: `/AudioDefault/${file}`,
          size: stats.size,
          lastModified: stats.mtime
        };
      });
    
    return audioFiles;
  } catch (error) {
    console.error('Error reading audio directory:', error);
    return [];
  }
};

/**
 * Check if a user has an active package
 * @param {Object} user - User object with package information
 * @returns {boolean} - Whether user has active package
 */
export const hasActivePackage = (user) => {
  if (!user.activePackageId) return false;
  
  const now = new Date();
  const packageExpiry = new Date(user.packageExpiry);
  
  return packageExpiry > now;
};

export default {
  getDefaultAudioFiles,
  hasActivePackage
}; 