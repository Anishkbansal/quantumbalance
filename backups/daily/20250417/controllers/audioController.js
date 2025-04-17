import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all default audio files from the AudioDefault directory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDefaultAudioFiles = async (req, res) => {
  try {
    const audioPath = path.join(process.cwd(), 'public', 'AudioDefault');
    
    // Check if user has an active package
    const user = req.user;
    if (!user.activePackageId) {
      return res.status(403).json({
        success: false,
        message: 'Active package required to access audio files'
      });
    }
    
    // Check if package is expired
    const now = new Date();
    const packageExpiry = new Date(user.packageExpiry);
    if (packageExpiry <= now) {
      return res.status(403).json({
        success: false,
        message: 'Package has expired'
      });
    }
    
    // Read directory and get audio files
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
    
    return res.status(200).json({
      success: true,
      audioFiles
    });
  } catch (error) {
    console.error('Error getting default audio files:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving audio files',
      error: error.message
    });
  }
};

export default {
  getDefaultAudioFiles
}; 