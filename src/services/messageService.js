import Message, { Conversation } from '../models/Message.js';
import User from '../models/User.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Generate a secret key for a conversation between two users
const generateConversationKey = (userId1, userId2) => {
  // Sort IDs to ensure the same key is generated regardless of order
  const sortedIds = [userId1, userId2].sort().join('_');
  // Create a SHA-256 hash of the combined IDs
  return crypto.createHash('sha256').update(sortedIds).digest('hex');
};

// Send a message from one user to another using the conversation model
export const sendMessage = async (senderId, recipientId, content) => {
  try {
    // Verify both users exist
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    
    if (!sender || !recipient) {
      return { success: false, message: 'User not found' };
    }
    
    // Check if sender has an active package if they're not an admin
    const hasActivePackage = sender.isAdmin ? true : !(await sender.isPackageExpired());
    
    // Only regular users need an active package to send messages
    if (!sender.isAdmin && !hasActivePackage) {
      return { success: false, message: 'You need an active package to send messages' };
    }

    // Generate encryption key for this conversation
    const secretKey = generateConversationKey(senderId, recipientId);
    
    // Encrypt the message content
    const { encryptedContent, iv } = Message.encryptMessage(content, secretKey);

    // Find or create a conversation between these users
    const conversation = await Conversation.findOrCreateConversation(senderId, recipientId);
    
    // Add the new message to the conversation with proper read status
    conversation.messages.push({
      sender: senderId,
      content: encryptedContent,
      iv: iv,
      readBySender: true,     // Sender has seen their own message
      readByRecipient: false, // Recipient hasn't read it yet
      createdAt: new Date()
    });
    
    // Save the updated conversation
    await conversation.save();
    
    return { success: true, message: 'Message sent successfully' };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, message: 'Failed to send message' };
  }
};

// Get messages between two users
export const getConversation = async (userId1, userId2) => {
  try {
    // Verify both users exist
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);
    
    if (!user1 || !user2) {
      return { success: false, message: 'User not found' };
    }
    
    // Check if either user is admin or has an active package
    if (!user1.isAdmin && !user2.isAdmin) {
      const hasActivePackage = !(await user1.isPackageExpired());
      if (!hasActivePackage) {
        return { success: false, message: 'You need an active package to view messages' };
      }
    }
    
    // Sort participant IDs to ensure consistency
    const participantIds = [userId1, userId2].sort();
    
    // Find the conversation between these users
    const conversation = await Conversation.findOne({
      participants: { $all: participantIds }
    });
    
    // If no conversation exists, return empty messages array
    if (!conversation) {
      return { success: true, messages: [] };
    }
    
    // Generate encryption key for this conversation
    const secretKey = generateConversationKey(userId1, userId2);
    
    // Decrypt messages
    const decryptedMessages = conversation.messages.map((msg, index) => {
      const decryptedContent = Message.decryptMessage(msg.content, msg.iv, secretKey);
      return {
        _id: `${conversation._id}_msg_${index}`, // Create a unique ID for each message
        sender: msg.sender,
        recipient: msg.sender.toString() === userId1 ? userId2 : userId1, // Derive recipient
        content: decryptedContent,
        readBySender: msg.readBySender,
        readByRecipient: msg.readByRecipient,
        createdAt: msg.createdAt
      };
    });
    
    return { 
      success: true, 
      messages: decryptedMessages,
      conversationId: conversation._id
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return { success: false, message: 'Failed to retrieve messages' };
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId, userId) => {
  try {
    if (!messageId) {
      console.error('Message ID is required');
      return { success: false, message: 'Message ID is required' };
    }
    
    console.log(`Marking message as read - messageId: ${messageId}, userId: ${userId}`);
    
    // Check if the message ID is in the format conversationId_msg_index
    const msgPattern = /^(.+)_msg_(\d+)$/;
    const matches = messageId.match(msgPattern);
    
    if (matches) {
      console.log('Using special message ID format (conversationId_msg_index)');
      const conversationIdStr = matches[1];
      const messageIndex = parseInt(matches[2], 10);
      let conversationId;
      
      console.log(`Parsed - conversationId: ${conversationIdStr}, messageIndex: ${messageIndex}`);
      
      // Convert conversation ID string to ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(conversationIdStr)) {
        conversationId = conversationIdStr;
        console.log(`Valid ObjectId format: ${conversationId}`);
      } else {
        console.error(`Invalid ObjectId format: ${conversationIdStr}`);
        return { success: false, message: 'Invalid conversation ID format' };
      }
      
      // Find the conversation
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        console.error(`Conversation not found with ID: ${conversationId}`);
        return { success: false, message: 'Conversation not found' };
      }
      
      // Check if user is part of this conversation - use toString() for proper comparison
      const isParticipant = conversation.participants.some(
        participant => participant.toString() === userId.toString()
      );
      
      if (!isParticipant) {
        console.error(`User ${userId} is not a participant in conversation ${conversationId}`);
        return { success: false, message: 'User is not part of this conversation' };
      }
      
      console.log(`User ${userId} is a valid participant in conversation ${conversationId}`);
      
      // Check if message index is valid based on conversation's messages array
      if (messageIndex < 0 || messageIndex >= conversation.messages.length) {
        console.error(`Invalid message index: ${messageIndex}, total messages: ${conversation.messages.length}`);
        return { success: false, message: 'Message not found at the specified index' };
      }
      
      const message = conversation.messages[messageIndex];
      
      // Mark message as read based on whether user is sender or recipient
      if (message.sender.toString() === userId.toString()) {
        // User is the sender
        if (!message.readBySender) {
          message.readBySender = true;
          conversation.markModified('messages');
          await conversation.save();
          console.log(`Message ${messageIndex} marked as read by sender ${userId}`);
        } else {
          console.log(`Message ${messageIndex} already marked as read by sender ${userId}`);
        }
      } else {
        // User is the recipient
        if (!message.readByRecipient) {
          message.readByRecipient = true;
          conversation.markModified('messages');
          await conversation.save();
          console.log(`Message ${messageIndex} marked as read by recipient ${userId}`);
        } else {
          console.log(`Message ${messageIndex} already marked as read by recipient ${userId}`);
        }
      }
      
      return { success: true, message: 'Message marked as read' };
    } else {
      // Try direct message ID lookup
      console.log('Using direct message ID lookup');
      let messageObjectId;
      
      try {
        // Check if messageId is a valid ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(messageId)) {
          messageObjectId = messageId;
        } else {
          console.error('Message ID is not a valid ObjectId:', messageId);
          return { success: false, message: 'Invalid message ID format' };
        }
      } catch (err) {
        console.error('Error parsing message ID:', err);
        return { success: false, message: 'Invalid message ID format' };
      }
      
      // Find message directly inside a conversation
      const conversation = await Conversation.findOne({
        'messages._id': messageObjectId
      });
      
      if (!conversation) {
        console.error(`Conversation not found for message ${messageObjectId}`);
        return { success: false, message: 'Conversation not found for this message' };
      }
      
      // Check if user is part of this conversation
      const isParticipant = conversation.participants.some(
        participant => participant.toString() === userId.toString()
      );
      
      if (!isParticipant) {
        console.error(`User ${userId} is not a participant in conversation ${conversation._id}`);
        return { success: false, message: 'User is not part of this conversation' };
      }
      
      // Find the message in the conversation
      const messageIndex = conversation.messages.findIndex(
        msg => msg._id.toString() === messageObjectId.toString()
      );
      
      if (messageIndex === -1) {
        console.error(`Message ${messageObjectId} not found in conversation ${conversation._id}`);
        return { success: false, message: 'Message not found in conversation' };
      }
      
      const message = conversation.messages[messageIndex];
      
      // Mark message as read based on whether user is sender or recipient
      if (message.sender.toString() === userId.toString()) {
        // User is the sender
        if (!message.readBySender) {
          conversation.messages[messageIndex].readBySender = true;
          conversation.markModified('messages');
          await conversation.save();
          console.log(`Message ${messageObjectId} marked as read by sender ${userId}`);
        } else {
          console.log(`Message ${messageObjectId} already marked as read by sender ${userId}`);
        }
      } else {
        // User is the recipient
        if (!message.readByRecipient) {
          conversation.messages[messageIndex].readByRecipient = true;
          conversation.markModified('messages');
          await conversation.save();
          console.log(`Message ${messageObjectId} marked as read by recipient ${userId}`);
        } else {
          console.log(`Message ${messageObjectId} already marked as read by recipient ${userId}`);
        }
      }
      
      return { success: true, message: 'Message marked as read' };
    }
  } catch (error) {
    console.error('Error in markMessageAsRead:', error);
    return { success: false, message: `Server error: ${error.message}` };
  }
};

// Mark all messages in a conversation as read by a specific user
export const markAllMessagesInConversationAsRead = async (conversationId, userId) => {
  try {
    console.log(`User ${userId} marking all messages as read in conversation ${conversationId}`);
    
    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      console.error(`Conversation not found: ${conversationId}`);
      return { success: false, message: 'Conversation not found' };
    }
    
    // Check if user is part of this conversation
    const isParticipant = conversation.participants.some(p => p.toString() === userId);
    if (!isParticipant) {
      console.error(`User ${userId} is not part of conversation ${conversationId}`);
      return { success: false, message: 'User not part of this conversation' };
    }
    
    // Get the other participant (conversation partner)
    const conversationPartner = conversation.participants.find(
      p => p.toString() !== userId
    );
    
    if (!conversationPartner) {
      console.error(`Could not identify conversation partner for user ${userId}`);
      return { success: false, message: 'Invalid conversation structure' };
    }
    
    // Update read status for messages based on the user's role (sender or recipient)
    let updated = false;
    let readCount = 0;
    
    conversation.messages.forEach((message, index) => {
      const isSender = message.sender.toString() === userId;
      const isRecipient = message.sender.toString() === conversationPartner.toString();
      
      // User is sender of this message and hasn't marked it as read by sender
      if (isSender && !message.readBySender) {
        conversation.messages[index].readBySender = true;
        updated = true;
        readCount++;
      }
      
      // User is recipient of this message and hasn't marked it as read by recipient
      if (isRecipient && !message.readByRecipient) {
        conversation.messages[index].readByRecipient = true;
        updated = true;
        readCount++;
      }
    });
    
    if (updated) {
      await conversation.save();
      console.log(`Marked ${readCount} messages as read for user ${userId} in conversation ${conversationId}`);
    } else {
      console.log(`No unread messages for user ${userId} in conversation ${conversationId}`);
    }
    
    return { 
      success: true, 
      message: updated ? `${readCount} messages marked as read` : 'No unread messages found',
      updatedCount: readCount
    };
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return { success: false, message: `Server error: ${error.message}` };
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = async (userId) => {
  try {
    // Find all conversations involving this user
    const conversations = await Conversation.find({
      participants: userId
    });
    
    // Count unread messages where user is recipient (not sender)
    let count = 0;
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        // Only count messages where this user is the recipient and hasn't read it
        if (message.sender.toString() !== userId && !message.readByRecipient) {
          count++;
        }
      }
    }
    
    return { success: true, count };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, message: 'Failed to get unread count' };
  }
};

// Get all admin conversations for admin view
export const getAdminConversations = async (adminId) => {
  try {
    // Verify admin exists and is really an admin
    const admin = await User.findById(adminId);
    
    if (!admin || !admin.isAdmin) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // Find all conversations where admin is a participant
    const conversations = await Conversation.find({
      participants: adminId
    }).sort({ lastUpdated: -1 });
    
    // Get other participants (non-admin users) from each conversation
    const conversationData = await Promise.all(conversations.map(async (conversation) => {
      // Find the other participant (not the admin)
      const userId = conversation.participants.find(
        p => p.toString() !== adminId
      );
      
      if (!userId) return null; // Skip if no other participant found
      
      const user = await User.findById(userId, 'name email profilePicture');
      if (!user) return null; // Skip if user not found
      
      // Get the most recent message
      const lastMessage = conversation.messages.length > 0 
        ? conversation.messages[conversation.messages.length - 1]
        : null;
      
      // Count unread messages from this user to admin
      const unreadCount = conversation.messages.filter(
        msg => msg.sender.toString() === userId.toString() && !msg.readByRecipient
      ).length;
      
      // Generate conversation key for decryption (if needed)
      const secretKey = generateConversationKey(adminId, userId);
      
      let lastMessageContent = null;
      if (lastMessage) {
        // Decrypt the content for preview (limit to 50 chars)
        const decryptedContent = Message.decryptMessage(lastMessage.content, lastMessage.iv, secretKey);
        lastMessageContent = decryptedContent.length > 50 
          ? decryptedContent.substring(0, 50) + '...' 
          : decryptedContent;
      }
      
      return {
        user,
        lastMessage: lastMessage ? {
          content: lastMessageContent,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender
        } : null,
        unreadCount
      };
    }));
    
    // Remove null entries and return
    return { success: true, conversations: conversationData.filter(Boolean) };
  } catch (error) {
    console.error('Error getting admin conversations:', error);
    return { success: false, message: 'Failed to get conversations' };
  }
}; 