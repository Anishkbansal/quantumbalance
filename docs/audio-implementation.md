# Audio Management System Implementation

## Overview
This document outlines the implementation of the audio file management system for the Quantum Balance application. The system allows administrators to upload, manage, and link audio files to user prescriptions.

## Features
- Upload audio files (supports multiple formats: mp3, wav, opus, etc.)
- Store files directly in MongoDB
- Search audio files by name, health condition, or frequencies
- Link audio files to specific health conditions in user prescriptions
- Check for duplicate files before upload
- Download linked audio files

## Implementation Notes
- Uses multer v1.4.5-lts.1 for file uploads
- Compatible with Mongoose v7+
- Authentication via authMiddleware.js

## Database Schema

### AudioFile Model (src/models/AudioFile.js)
```javascript
const audioFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    trim: true
  },
  frequencies: {
    type: [String],
    default: []
  },
  fileData: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
```

### Prescription Schema Update
The existing Prescription schema uses the `audioId` field in the frequency subdocument to reference audio files:

```javascript
// In the frequencySchema
audioId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'AudioFile',
  default: null
}
```

## API Endpoints

### Audio Files

- `GET /api/audio-files` - Get all audio files with optional search
- `GET /api/audio-files/check` - Check if a file with a specific name exists
- `POST /api/audio-files/upload` - Upload a new audio file
- `GET /api/audio-files/:id` - Get a specific audio file by ID
- `DELETE /api/audio-files/:id` - Delete an audio file (admin only)

### Prescriptions

- `GET /api/prescriptions/:id` - Get a prescription by ID
- `POST /api/prescriptions/:id/link-audio` - Link an audio file to a prescription frequency
- `DELETE /api/prescriptions/:id/unlink-audio/:frequencyId` - Remove audio link from a prescription frequency

## User Interface

### Audio File Upload
The upload form includes:
- File name (required, checked for duplicates)
- Health condition (required)
- Frequencies (optional, comma separated)
- File upload (required, accepts all audio formats)

### Audio File Selection
The selection interface includes:
- Search functionality (by name, condition, or frequencies)
- List of matching audio files
- Ability to link directly to prescription frequencies

### Prescription Display
The prescription interface shows:
- Grouped frequencies by health condition
- Status indicator for linked audio files
- Download option for linked audio files
- Option to change linked audio files

## Implementation Process
1. Created AudioFile model for MongoDB
2. Added API routes for audio file management
3. Updated prescription routes to support audio linking
4. Enhanced UI to support file upload, selection, and display
5. Added duplicate file checking
6. Implemented search functionality

## Security Considerations
- All API endpoints require authentication via the authMiddleware.js protect function
- Admin-only operations are secured with the adminOnly middleware
- File size limitations (50MB maximum)
- File type validation (audio only)

## Troubleshooting
- If authentication fails, check that token is being passed correctly
- When ObjectId conversion fails, ensure you're using `new mongoose.Types.ObjectId()`
- For file upload issues, verify that multer is configured correctly

## Future Enhancements
- Audio preview functionality
- Batch upload of audio files
- Additional metadata for audio files
- Advanced audio file analytics
- Storage optimization for large files 