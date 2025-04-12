import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Send, AlertCircle, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '../../config/constants';

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  readBySender: boolean;
  readByRecipient: boolean;
  createdAt: string;
}

const UserMessaging: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Check if user has an active package
  const hasActivePackage = user?.packageType && user.packageType !== 'none';
  
  // Add typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Read-only typing indicator state for demo purposes
  // In a real app, this would be updated via websocket
  // We set it to false to prevent confusing behavior
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  
  // Fetch conversation with admin
  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Find the admin (for user, we're always talking to the admin)
      const response = await axios.get(`${API_URL}/messages/conversation/${user._id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        console.log(`Fetched ${response.data.messages.length} messages`);
        setMessages(response.data.messages);
        
        // Only count unread messages from admin to user
        const unreadMessagesFromAdmin = response.data.messages.filter(
          (msg: Message) => 
            msg.recipient === user._id && // User is recipient (admin sent it)
            !msg.readByRecipient // Message is unread
        );
        
        console.log(`Found ${unreadMessagesFromAdmin.length} unread messages from admin`);
        setUnreadCount(unreadMessagesFromAdmin.length);
      } else {
        setError(response.data.message || 'Failed to load messages');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Use Intersection Observer to detect when messages come into view
  useEffect(() => {
    if (!messages.length || !user) return;
    
    // Only observe messages that are:
    // 1. Sent TO the current user (user is recipient)
    // 2. Not already marked as read
    const messagesToObserve = messages.filter(
      msg => msg.recipient === user._id && !msg.readByRecipient
    );
    
    if (messagesToObserve.length === 0) return;
    
    console.log(`Setting up observer for ${messagesToObserve.length} unread messages`);
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6 // Require 60% visibility to consider "read"
    };
    
    // Track which messages we've started the read timer for
    const readTimers: {[key: string]: NodeJS.Timeout} = {};
    
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (!messageId) return;
          
          // Find the message
          const message = messages.find(m => m._id === messageId);
          if (!message) return;
          
          // Double-check this is a message TO the current user and it's unread
          if (message.recipient === user._id && !message.readByRecipient) {
            console.log(`Message ${messageId} is visible (${Math.round(entry.intersectionRatio * 100)}%)`);
            
            // Only start a timer if we haven't already for this message
            if (!readTimers[messageId] && !visibleMessages.has(messageId)) {
              console.log(`Starting timer to mark message ${messageId} as read`);
              readTimers[messageId] = setTimeout(() => {
                console.log(`User has seen message ${messageId} for required time - marking as read`);
                markMessageAsRead(messageId);
              }, 2000); // 2 seconds of visibility required - more like real social media platforms
            }
          }
        } else {
          // If message scrolls out of view before being marked as read, reset timer
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId && readTimers[messageId]) {
            console.log(`Message ${messageId} scrolled out of view, canceling read timer`);
            clearTimeout(readTimers[messageId]);
            delete readTimers[messageId];
          }
        }
      });
    }, options);
    
    // Only observe message elements for unread messages addressed to current user
    messagesToObserve.forEach(message => {
      const el = messageRefs.current[message._id];
      if (el) {
        console.log(`Observing unread message: ${message._id}`);
        observer.observe(el);
      }
    });
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Intersection Observer and timers');
      observer.disconnect();
      Object.values(readTimers).forEach(timer => clearTimeout(timer));
    };
  }, [messages, user, visibleMessages]);
  
  // Mark a single message as read
  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;
    
    // Find the message
    const message = messages.find(msg => msg._id === messageId);
    if (!message) {
      console.error(`Message with ID ${messageId} not found in local state`);
      return;
    }
    
    // Only proceed if:
    // 1. Message is to the current user
    // 2. Message is not already marked as read
    // 3. Message is not already being processed
    if (message.recipient !== user._id || 
        message.readByRecipient || 
        visibleMessages.has(messageId)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log(`User marking message ${messageId} as read - recipient: ${message.recipient}, current user: ${user._id}`);
      
      // Validate message ID format
      if (messageId.includes('_msg_')) {
        const parts = messageId.split('_msg_');
        const conversationId = parts[0];
        // Check if the conversation ID part is a valid MongoDB ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
          console.error(`Invalid conversation ID format in message ID: ${messageId}`);
          return;
        }
      }
      
      // Track that we're processing this message (mark it in the UI immediately)
      setVisibleMessages(prev => {
        const newSet = new Set(prev);
        newSet.add(messageId);
        return newSet;
      });
      
      // Update message in local state immediately for better UX
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, readByRecipient: true } 
            : msg
        )
      );
      
      // Update unread count locally for better UX
      if (unreadCount > 0) {
        setUnreadCount(prevCount => prevCount - 1);
      }
      
      // Make API call to mark message as read
      await axios.post(
        `${API_URL}/messages/read/${messageId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
      // Don't show error to user for background task, but revert UI change
      setVisibleMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };
  
  // Send a message to admin
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim() || !hasActivePackage) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Send message to admin via API
      const response = await axios.post(
        `${API_URL}/messages/to-admin`,
        { content: newMessage.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        // Reset form and update UI
        setNewMessage('');
        fetchMessages(); // Refresh messages to include the new one
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error sending message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Check for unread messages
  const checkUnreadMessages = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/messages/unread/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Don't show error to user for this background task
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Initial data loading
  useEffect(() => {
    if (user && hasActivePackage) {
      fetchMessages();
      checkUnreadMessages();
      
      // Set up polling for new messages (every 30 seconds)
      const intervalId = setInterval(() => {
        fetchMessages();
        checkUnreadMessages();
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);
  
  // Mark all messages in the conversation as read
  const markAllAsRead = async () => {
    if (!user || messages.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Get the conversation ID from the first message
      // In our system, all messages in this view belong to the same conversation
      const firstMessage = messages[0];
      let conversationId;
      
      if (firstMessage._id.includes('_msg_')) {
        // If using composite IDs
        conversationId = firstMessage._id.split('_msg_')[0];
      } else {
        // If message doesn't have a conversation ID embedded,
        // we can use the user's ID since all their messages are in one conversation with admin
        conversationId = user._id;
      }
      
      // Update UI immediately for better UX
      const unreadMessagesFromAdmin = messages.filter(
        msg => msg.recipient === user._id && !msg.readByRecipient
      );
      
      unreadMessagesFromAdmin.forEach(msg => {
        setVisibleMessages(prev => {
          const newSet = new Set(prev);
          newSet.add(msg._id);
          return newSet;
        });
      });
      
      // Update messages in state
      setMessages(prev => 
        prev.map(msg => 
          msg.recipient === user._id 
            ? { ...msg, readByRecipient: true } 
            : msg
        )
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Make API call to mark all messages in conversation as read
      await axios.post(
        `${API_URL}/messages/conversation/${conversationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      // Don't show error to user, just fetch messages again to sync state
      fetchMessages();
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Format timestamp and add message status
  const formatMessageTimeAndStatus = (message: Message, currentUserId: string) => {
    const time = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
    
    // Determine correct icon for message status
    let statusIcon = null;
    let statusLabel = '';
    
    // If current user is the sender of the message
    if (message.sender === currentUserId) {
      if (message.readByRecipient) {
        statusIcon = <CheckCheck className="h-3 w-3 text-green-500" />;
        statusLabel = 'Read';
      } else {
        statusIcon = <Check className="h-3 w-3 text-navy-400" />;
        statusLabel = 'Delivered';
      }
    } else if (!message.readByRecipient) {
      // If current user is the recipient and hasn't read the message
      statusIcon = <div className="bg-green-500 rounded-full h-2 w-2" />;
      statusLabel = 'New';
    }
    
    return { time, statusIcon, statusLabel };
  };
  
  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // In a real app, this is where you would send a websocket message
    // to the admin to let them know the user is typing
    
    // NOTE: We don't show "Admin is typing" here because without websockets,
    // we have no way to know when the admin is actually typing
  };
  
  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);
  
  if (!user) {
    return <div className="p-4 text-navy-300">Please log in to use messaging</div>;
  }
  
  if (!hasActivePackage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-white">Messaging Unavailable</h3>
        <p className="text-navy-300">You need an active package to access messaging.</p>
        <button 
          onClick={() => window.location.href = '/packages'}
          className="mt-4 px-4 py-2 bg-gold-500 text-navy-900 rounded hover:bg-gold-400 transition-colors"
        >
          View Packages
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-navy-800 rounded-lg shadow overflow-hidden border border-navy-700">
      {/* Header */}
      <div className="bg-navy-700 text-white p-4 flex items-center border-b border-navy-600">
        <div className="h-10 w-10 rounded-full bg-gold-500 flex items-center justify-center mr-3">
          <span className="text-navy-900 font-bold">A</span>
        </div>
        <div>
          <h3 className="font-semibold">Admin</h3>
          <p className="text-xs text-navy-300">Support & Assistance</p>
        </div>
        {unreadCount > 0 && (
          <div className="ml-auto flex items-center">
            <div className="bg-green-500 rounded-full px-2 py-1 text-xs text-white font-bold mr-2">
              {unreadCount} new
            </div>
            <button 
              onClick={markAllAsRead}
              className="text-xs bg-navy-600 hover:bg-navy-500 text-white py-1 px-2 rounded transition-colors"
            >
              Mark All Read
            </button>
          </div>
        )}
      </div>
      
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-navy-900">
        {/* Message status legend */}
        <div className="bg-navy-800 p-2 rounded-lg mb-4 text-xs text-navy-300 flex flex-wrap gap-4">
          <div className="flex items-center">
            <Check className="h-3 w-3 text-navy-400 mr-1" />
            <span>Delivered</span>
          </div>
          <div className="flex items-center">
            <CheckCheck className="h-3 w-3 text-green-500 mr-1" />
            <span>Read by admin</span>
          </div>
          <div className="flex items-center">
            <div className="rounded-full h-2 w-2 bg-green-500 mr-1"></div>
            <span>New unread message</span>
          </div>
        </div>
        
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 p-4 border border-red-500 rounded-lg bg-red-900/20 mb-4">
            <div className="font-bold mb-1">Error</div>
            <div>{error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-navy-300 p-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isNewDay = index === 0 || 
                new Date(message.createdAt).toDateString() !== new Date(messages[index-1].createdAt).toDateString();
              
              const isNewMessage = index > 0 && 
                new Date(message.createdAt).getTime() - new Date(messages[index-1].createdAt).getTime() > 60 * 60 * 1000;
              
              // Create truly unique key combining message ID and index
              const uniqueKey = `message_${message._id}_${index}`;
              
              // Get message time and status display
              const { time, statusIcon, statusLabel } = formatMessageTimeAndStatus(message, user?._id || '');
              
              const isFromCurrentUser = message.sender === user?._id;
              
              return (
                <React.Fragment key={uniqueKey}>
                  {isNewDay && (
                    <div className="flex justify-center my-4">
                      <div className="px-3 py-1 bg-navy-700 rounded-full text-xs text-navy-300">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  
                  {isNewMessage && !isNewDay && (
                    <div className="flex justify-center my-4">
                      <div className="px-3 py-1 bg-navy-700 rounded-full text-xs text-navy-300">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      ref={el => (messageRefs.current[message._id] = el)}
                      data-message-id={message._id}
                      className={`max-w-[75%] rounded-lg p-3 ${
                        isFromCurrentUser
                          ? 'bg-gold-500 text-navy-900'
                          : 'bg-navy-700 text-white'
                      } ${
                        !message.readByRecipient && message.recipient === user?._id 
                          ? 'border-l-4 border-green-500 shadow-md shadow-green-500/10' 
                          : ''
                      } transition-all duration-300`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="flex items-center justify-end mt-1">
                        <div
                          className={`text-xs mr-1 ${
                            isFromCurrentUser ? 'text-navy-800' : 'text-navy-400'
                          }`}
                          title={new Date(message.createdAt).toLocaleString()}
                        >
                          {time}
                        </div>
                        
                        {statusIcon && (
                          <div className="ml-1" title={statusLabel}>
                            {statusIcon}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={sendMessage} className="border-t border-navy-700 p-4 bg-navy-800">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 border border-navy-600 bg-navy-750 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-gold-500 text-navy-900 px-4 py-2 rounded-r-lg hover:bg-gold-400 transition-colors flex items-center justify-center"
            disabled={!newMessage.trim() || loading}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserMessaging; 