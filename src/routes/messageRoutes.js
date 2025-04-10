import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as messageService from '../services/messageService.js';
import User from '../models/User.js';

const router = express.Router();

// Get all conversations for admin
router.get('/admin/conversations', protect, adminOnly, async (req, res) => {
  try {
    const result = await messageService.getAdminConversations(req.user._id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting admin conversations:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// For a user to send a message to admin
router.post('/to-admin', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }
    
    // Find an admin to message (in this case, we only have one admin)
    const admin = await User.findOne({ isAdmin: true });
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const result = await messageService.sendMessage(req.user._id, admin._id, content);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error sending message to admin:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// For admin to send a message to a user
router.post('/admin/to-user/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const result = await messageService.sendMessage(req.user._id, userId, content);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error sending message to user:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get conversation between admin and user
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`User ${req.user._id} (admin: ${req.user.isAdmin}) requesting conversation with user ${userId}`);
    
    // If a regular user is requesting, they can only see their own conversations with admin
    if (!req.user.isAdmin && userId !== req.user._id.toString()) {
      console.log('Unauthorized: Non-admin trying to access another user conversation');
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only view your own conversations' });
    }
    
    // For user: get conversation with admin
    if (!req.user.isAdmin) {
      // Find the admin
      const admin = await User.findOne({ isAdmin: true });
      
      if (!admin) {
        console.log('Admin not found for user conversation');
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
      
      console.log(`User ${req.user._id} fetching conversation with admin ${admin._id}`);
      const result = await messageService.getConversation(req.user._id, admin._id);
      return res.status(result.success ? 200 : 400).json(result);
    } 
    // For admin: get conversation with specific user
    else {
      const user = await User.findById(userId);
      
      if (!user) {
        console.log(`Admin tried to access conversation with non-existent user ${userId}`);
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      console.log(`Admin ${req.user._id} fetching conversation with user ${userId}`);
      const result = await messageService.getConversation(req.user._id, userId);
      return res.status(result.success ? 200 : 400).json(result);
    }
  } catch (error) {
    console.error('Error getting conversation:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark a message as read
router.put('/read/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    if (!messageId || typeof messageId !== 'string' || messageId.trim() === '') {
      console.error('Missing or invalid messageId parameter');
      return res.status(400).json({ success: false, message: 'Valid message ID is required' });
    }
    
    console.log(`User ${userId} marking message ${messageId} as read`);
    console.log(`User details - isAdmin: ${req.user.isAdmin}, name: ${req.user.name}, email: ${req.user.email}`);
    
    // Debug message format
    console.log(`Message ID contains _msg_: ${messageId.includes('_msg_')}`);
    if (messageId.includes('_msg_')) {
      const parts = messageId.split('_msg_');
      console.log(`Parts after splitting by _msg_: [${parts.join(', ')}]`);
    }
    
    // Call the service function
    const result = await messageService.markMessageAsRead(messageId, userId);
    
    console.log(`Result from markMessageAsRead: ${JSON.stringify(result)}`);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// Get count of unread messages
router.get('/unread/count', protect, async (req, res) => {
  try {
    const result = await messageService.getUnreadMessageCount(req.user._id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark all messages in a conversation as read
router.put('/conversation/:conversationId/read', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId || typeof conversationId !== 'string' || conversationId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Valid conversation ID is required' });
    }
    
    console.log(`User ${req.user._id} marking all messages in conversation ${conversationId} as read`);
    
    const result = await messageService.markAllMessagesInConversationAsRead(conversationId, req.user._id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 