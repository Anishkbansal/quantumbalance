import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Conversation {
  user: User;
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
}

interface SharedMessagingProps {
  isAdmin: boolean;
}

const SharedMessaging: React.FC<SharedMessagingProps> = ({ isAdmin }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for messages and conversations
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for new message input
  const [newMessage, setNewMessage] = useState('');
  
  // State for optimistic UI updates and batched read operations
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const [processingMessageIds, setProcessingMessageIds] = useState<Set<string>>(new Set());
  const [pendingReads, setPendingReads] = useState<string[]>([]);
  const [lastBatchReadTime, setLastBatchReadTime] = useState(0);
  
  // Refs for scrolling and message elements
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store timers for cleanup
  const readTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const batchReadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Store previous message IDs to compare for changes
  const previousMessagesRef = useRef<string[]>([]);
  
  // Determine if we can show the messaging UI
  const hasActivePackage = isAdmin || (user?.packageType && user.packageType !== 'none');
  
  // Fetch conversations (for admin only)
  const fetchConversations = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/messages/admin/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Sort conversations by unread count (descending) and then by date (descending)
        const sortedConversations = response.data.conversations.sort((a: Conversation, b: Conversation) => {
          // First by unread count (descending)
          if (b.unreadCount !== a.unreadCount) {
            return b.unreadCount - a.unreadCount;
          }
          // Then by last message date (descending)
          return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
        });
        
        setConversations(sortedConversations);
        setFilteredConversations(sortedConversations);
        
        // If we have conversations but no active one, activate the first one
        if (sortedConversations.length > 0 && !activeConversation) {
          setActiveConversation(sortedConversations[0].user._id);
        }
      } else {
        setError(response.data.message || 'Failed to load conversations');
      }
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Error loading conversations');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages (different endpoint depending on admin/user mode)
  const fetchMessages = async (userId?: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url;
      if (isAdmin && userId) {
        // Admin fetching specific user conversation
        url = `${API_URL}/messages/conversation/${userId}`;
      } else {
        // User fetching their admin conversation
        url = `${API_URL}/messages/conversation/${user._id}`;
      }
      
      const response = await axios.get(
        url,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Sort messages by date
        const sortedMessages = response.data.messages.sort(
          (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        console.log(`Fetched ${sortedMessages.length} messages`);
        
        // Get unread messages count
        const unreadMessages = sortedMessages.filter(
          (msg: Message) => msg.recipient === user._id && !msg.readByRecipient
        );
        
        console.log(`${unreadMessages.length} unread messages`);
        
        setMessages(sortedMessages);
        
        // Only scroll to bottom if there are new messages
        if (sortedMessages.length > 0) {
          setTimeout(scrollToBottom, 100);
        }
      } else {
        setError(response.data.message || 'Failed to load messages');
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.message || 'Error loading messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Setup Intersection Observer to mark messages as read when they become visible
  useEffect(() => {
    if (!user || messages.length === 0) return;
    
    // Process any pending read messages in batches
    const processBatchReads = () => {
      // Only process if we have pending reads and enough time has passed (2 seconds)
      const now = Date.now();
      if (pendingReads.length === 0 || now - lastBatchReadTime < 2000) {
        return;
      }
      
      // Create a local copy and clear the pending list
      const messagesToProcess = [...pendingReads];
      setPendingReads([]);
      setLastBatchReadTime(now);
      
      console.log(`Processing batch of ${messagesToProcess.length} messages`);
      
      // Extract conversationId from first message
      if (messagesToProcess.length > 0) {
        let conversationId;
        const messageId = messagesToProcess[0];
        
        // Handle different message ID formats
        if (messageId.includes('_msg_')) {
          conversationId = messageId.split('_msg_')[0];
        } else if (messageId.includes('_')) {
          const parts = messageId.split('_');
          parts.pop(); // Remove the index part
          conversationId = parts.join('_');
        } else {
          // Try to extract from the actual message object
          const message = messages.find(msg => msg._id === messageId);
          if (message) {
            conversationId = isAdmin ? message.sender : message.recipient;
          } else {
            console.error(`Couldn't determine conversation ID for message ${messageId}`);
            return;
          }
        }
        
        // Verify valid MongoDB ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
          console.error(`Invalid conversation ID format: ${conversationId}`);
          return;
        }
        
        // Make a single API call for the batch
        const token = localStorage.getItem('token');
        axios.put(
          `${API_URL}/messages/conversation/${conversationId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(response => {
          if (response.data.success) {
            console.log(`Successfully marked ${response.data.updatedCount || 'all'} messages as read`);
            
            // Update unread count (for user mode) or conversations (for admin mode)
            if (isAdmin) {
              // Update conversation unread counts in admin mode
              if (activeConversation) {
                setConversations(prev => 
                  prev.map(conv => 
                    conv.user._id === activeConversation
                      ? { ...conv, unreadCount: 0 }
                      : conv
                  )
                );
                
                setFilteredConversations(prev => 
                  prev.map(conv => 
                    conv.user._id === activeConversation
                      ? { ...conv, unreadCount: 0 }
                      : conv
                  )
                );
              }
            } else {
              // Update global unread count in user mode
              checkUnreadMessages();
            }
          } else {
            console.error(`Error marking messages as read: ${response.data.message}`);
          }
        })
        .catch(error => {
          console.error('Error marking messages as read:', error);
        });
      }
    };
    
    // Set up timer to process batches every 2 seconds if needed
    if (batchReadTimerRef.current) {
      clearTimeout(batchReadTimerRef.current);
    }
    
    batchReadTimerRef.current = setInterval(() => {
      processBatchReads();
    }, 2000);
    
    // Check if message IDs have changed before creating a new observer
    const currentMessageIds = messages.map(msg => msg._id).join(',');
    const previousMessageIds = previousMessagesRef.current.join(',');
    
    // Only recreate the observer if messages have changed
    if (currentMessageIds !== previousMessageIds) {
      // Store the current message IDs for the next comparison
      previousMessagesRef.current = messages.map(msg => msg._id);
      
      // Clean up existing observer if there is one
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Create a new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Get the message ID from the element's data attribute
              const messageId = entry.target.getAttribute('data-message-id');
              
              if (messageId) {
                // Find the message
                const message = messages.find(msg => msg._id === messageId);
                
                // Only process unread messages sent to the current user
                if (message && 
                    message.recipient === user._id && 
                    !message.readByRecipient && 
                    !visibleMessages.has(messageId) && 
                    !processingMessageIds.has(messageId)) {
                    
                  // Add to visible messages so we don't process it again
                  setVisibleMessages(prev => {
                    const newSet = new Set(prev);
                    newSet.add(messageId);
                    return newSet;
                  });
                  
                  // Add to processing set to prevent duplicate processing
                  setProcessingMessageIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(messageId);
                    return newSet;
                  });
                  
                  // Update the message in local state for immediate feedback
                  setMessages(prev => 
                    prev.map(msg => 
                      msg._id === messageId 
                        ? { ...msg, readByRecipient: true } 
                        : msg
                    )
                  );
                  
                  // Add to pending reads batch
                  setPendingReads(prev => [...prev, messageId]);
                  
                  // Stop observing this message
                  if (observerRef.current) {
                    observerRef.current.unobserve(entry.target);
                  }
                }
              }
            }
          });
        },
        { threshold: 0.5 } // Consider message visible when 50% in view
      );
      
      // Observe all unread messages sent to the current user
      const messagesToObserve = messages.filter(message => 
        message.recipient === user._id && 
        !message.readByRecipient &&
        !visibleMessages.has(message._id) &&
        !processingMessageIds.has(message._id)
      );
      
      console.log(`Observing ${messagesToObserve.length} unread messages`);
      
      messagesToObserve.forEach(message => {
        const el = messageRefs.current[message._id];
        if (el && observerRef.current) {
          console.log(`Observing unread message: ${message._id}`);
          observerRef.current.observe(el);
        }
      });
    }
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Intersection Observer and timers');
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      Object.values(readTimers.current).forEach(timer => clearTimeout(timer));
      if (batchReadTimerRef.current) clearInterval(batchReadTimerRef.current);
    };
  }, [messages, user, activeConversation, isAdmin]);
  
  // Mark all messages in the conversation as read
  const markAllAsRead = async () => {
    if (!user || messages.length === 0) return;
    
    // For admin mode, we need an active conversation
    if (isAdmin && !activeConversation) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Extract conversation ID from message ID or use activeConversation
      let conversationId;
      
      if (isAdmin && activeConversation) {
        conversationId = activeConversation;
      } else if (messages.length > 0) {
        const messageId = messages[0]._id;
        
        // Handle different message ID formats
        if (messageId.includes('_msg_')) {
          conversationId = messageId.split('_msg_')[0];
        } else if (messageId.includes('_')) {
          const parts = messageId.split('_');
          parts.pop(); // Remove the index part
          conversationId = parts.join('_');
        } else {
          conversationId = messageId; // Assume the whole ID is the conversation ID
        }
      } else {
        console.error('No messages or conversation ID available');
        return;
      }
      
      // Verify that conversationId is a valid MongoDB ObjectId (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        console.error(`Invalid conversation ID format: ${conversationId}`);
        setError('Error: Invalid conversation format');
        return;
      }
      
      console.log(`Marking all messages as read in conversation ${conversationId}`);
      
      // Filter to only include unread messages that need to be marked as read
      const unreadMessages = messages.filter(
        msg => msg.recipient === user._id && 
               !msg.readByRecipient && 
               !visibleMessages.has(msg._id) &&
               !processingMessageIds.has(msg._id)
      );
      
      // If no unread messages, skip the API call
      if (unreadMessages.length === 0) {
        console.log('No new unread messages to mark as read');
        return;
      }
      
      console.log(`Found ${unreadMessages.length} unread messages to mark as read`);
      
      // Mark all visually for immediate UI feedback first
      const unreadMessageIds = unreadMessages.map(msg => msg._id);
      
      // Update visible messages set
      const newVisibleSet = new Set(visibleMessages);
      unreadMessageIds.forEach(id => {
        newVisibleSet.add(id);
      });
      setVisibleMessages(newVisibleSet);
      
      // Update all messages in local state immediately for better UX
      setMessages(prev => 
        prev.map(msg => ({
          ...msg,
          readByRecipient: msg.recipient === user._id ? true : msg.readByRecipient
        }))
      );
      
      // Update conversations list to reflect read status (for admin mode)
      if (isAdmin && activeConversation) {
        // Set unread count to 0 for current conversation
        setConversations(prev => 
          prev.map(conv => 
            conv.user._id === activeConversation
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
        
        setFilteredConversations(prev => 
          prev.map(conv => 
            conv.user._id === activeConversation
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
      
      // Now call API just once to mark all as read
      try {
        const response = await axios.put(
          `${API_URL}/messages/conversation/${conversationId}/read`, 
          {}, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (!response.data.success) {
          console.error(`Failed to mark all messages as read: ${response.data.message}`);
        } else {
          console.log(`Successfully marked ${response.data.updatedCount || 'all'} messages as read on server`);
          
          // For user mode, update the unread count
          if (!isAdmin) {
            checkUnreadMessages();
          }
        }
      } catch (err) {
        // Log error but don't disrupt user experience
        console.error('Error marking all messages as read:', err);
      }
    } catch (err) {
      console.error('Error in markAllAsRead function:', err);
    }
  };
  
  // Send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    // For admin mode, we need an active conversation
    if (isAdmin && !activeConversation) return;
    
    try {
      // Save current message before clearing input field
      const messageContent = newMessage.trim();
      
      // Clear input field immediately for better UX
      setNewMessage('');
      
      // Show optimistic update by adding a temporary message to UI
      const tempMessageId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        _id: tempMessageId,
        sender: user._id,
        recipient: isAdmin ? activeConversation! : 'admin', // For admin mode use active conversation, for user mode use 'admin'
        content: messageContent,
        readBySender: true,
        readByRecipient: false,
        createdAt: new Date().toISOString()
      };
      
      // Add to messages with optimistic update
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Scroll to bottom for better UX
      setTimeout(scrollToBottom, 100);
      
      // Send to server
      const token = localStorage.getItem('token');
      let url, payload;
      
      if (isAdmin && activeConversation) {
        // Admin sending to specific user
        url = `${API_URL}/messages/admin/to-user/${activeConversation}`;
        payload = { content: messageContent };
      } else {
        // User sending to admin
        url = `${API_URL}/messages/to-admin`;
        payload = { content: messageContent };
      }
      
      const response = await axios.post(
        url,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Instead of refreshing, just reload messages in the background
        if (isAdmin && activeConversation) {
          fetchMessages(activeConversation);
          // Also refresh conversations list to update last message
          fetchConversations();
        } else {
          fetchMessages();
        }
      } else {
        setError(response.data.message || 'Failed to send message');
        
        // Remove the optimistic message if there was an error
        setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending message');
      console.error('Error sending message:', err);
    }
  };
  
  // Check for unread messages (user mode only)
  const checkUnreadMessages = async () => {
    if (!user || isAdmin) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/messages/unread/count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Error checking unread messages:', err);
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle search for conversations (admin mode only)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    // Filter conversations by user name or email
    const filtered = conversations.filter(
      conv => 
        conv.user.name.toLowerCase().includes(term) || 
        conv.user.email.toLowerCase().includes(term)
    );
    
    setFilteredConversations(filtered);
  };
  
  // Select a conversation (admin mode only)
  const selectConversation = (userId: string) => {
    if (!isAdmin) return;
    
    setActiveConversation(userId);
    fetchMessages(userId);
  };
  
  // Format message time and status
  const formatMessageTimeAndStatus = (message: Message, currentUserId: string) => {
    const date = new Date(message.createdAt);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    const isUser = message.sender === currentUserId;
    let status = '';
    
    if (isUser) {
      status = message.readByRecipient ? '✓✓' : '✓';
    }
    
    return { time: formattedTime, status };
  };
  
  // Render user name with premium indicator if needed
  const PremiumUserName = ({ children }: { children: React.ReactNode }) => {
    return (
      <span className="flex items-center">
        {children}
        <span className="ml-1 inline-flex items-center py-0.5 text-xs font-medium bg-gold-500 text-navy-900 rounded-full px-1.5">
          Premium
        </span>
      </span>
    );
  };
  
  // Get user name by ID (admin mode only)
  const getUserNameById = (userId: string): string => {
    if (!isAdmin) return '';
    
    const conversation = conversations.find(conv => conv.user._id === userId);
    return conversation ? conversation.user.name : 'Unknown User';
  };
  
  // Initial data loading
  useEffect(() => {
    if (isAdmin) {
      fetchConversations();
    } else if (user && hasActivePackage) {
      fetchMessages();
      checkUnreadMessages();
      
      // Set up polling for user mode (every 2 minutes)
      const intervalId = setInterval(() => {
        fetchMessages();
        checkUnreadMessages();
      }, 120000);
      
      return () => clearInterval(intervalId);
    }
  }, [user, isAdmin, hasActivePackage]);
  
  // Fetch messages when active conversation changes (admin mode)
  useEffect(() => {
    if (isAdmin && activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [isAdmin, activeConversation]);
  
  // No access view
  if (!hasActivePackage && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center">
        <div className="bg-navy-800 p-8 rounded-lg shadow-lg max-w-lg">
          <h2 className="text-2xl font-bold mb-4 text-white">Premium Feature</h2>
          <p className="text-navy-300 mb-6">
            Messaging is available exclusively to users with an active package. 
            Purchase a package to unlock direct messaging with our experts.
          </p>
          <button
            onClick={() => navigate('/packages')}
            className="px-4 py-2 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400"
          >
            View Packages
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[80vh] bg-navy-900">
      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        
        <div className="bg-navy-800 rounded-lg overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row h-[calc(100vh-16rem)]">
            {/* Conversations sidebar (admin only) */}
            {isAdmin && (
              <div className="w-full md:w-1/3 border-r border-navy-700 bg-navy-850">
                <div className="p-4 border-b border-navy-700">
                  <h2 className="text-xl font-semibold text-white mb-3">Conversations</h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="overflow-y-auto h-[calc(100vh-20rem)]">
                  {loading && conversations.length === 0 ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="animate-spin h-6 w-6 text-navy-300" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-navy-300 text-center">
                      {searchTerm ? 'No matching conversations found' : 'No conversations yet'}
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.user._id}
                        onClick={() => selectConversation(conv.user._id)}
                        className={`p-4 border-b border-navy-700 hover:bg-navy-700 cursor-pointer transition-colors ${
                          activeConversation === conv.user._id ? 'bg-navy-700' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-full bg-navy-600 text-white flex items-center justify-center text-lg font-medium mr-3 flex-shrink-0">
                            {conv.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-medium text-white truncate">
                                {conv.user.name}
                              </h3>
                              {conv.unreadCount > 0 && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold-500 text-navy-900">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-navy-300 truncate mt-1">
                              {conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-navy-400 mt-1">
                              {new Date(conv.lastMessage.createdAt).toLocaleDateString()} 
                              {' '}
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Main message area */}
            <div className={`flex-1 flex flex-col ${!isAdmin ? 'border-t border-navy-700 md:border-t-0' : ''}`}>
              {/* Message header */}
              <div className="p-4 border-b border-navy-700 bg-navy-850 flex justify-between items-center">
                <div className="flex items-center">
                  {isAdmin && (
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="lg:hidden mr-3 p-1 rounded-lg hover:bg-navy-700"
                    >
                      <ArrowLeft className="h-4 w-4 text-navy-300" />
                    </button>
                  )}
                  {isAdmin && activeConversation ? (
                    <h2 className="text-lg font-semibold text-white">
                      {getUserNameById(activeConversation)}
                    </h2>
                  ) : (
                    <h2 className="text-lg font-semibold text-white">
                      {isAdmin ? 'Select a conversation' : 'Admin Support'}
                    </h2>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Mark all as read */}
                  {messages.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-navy-300 hover:text-white transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              
              {/* Display message to select a conversation in admin mode when no active conversation */}
              {isAdmin && !activeConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-lg text-navy-300">Select a conversation to view messages</p>
                </div>
              ) : (
                <>
                  {/* Messages container */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 p-4 overflow-y-auto bg-navy-850/30"
                    style={{ 
                      overscrollBehavior: 'contain'
                    }}
                  >
                    {loading && messages.length === 0 ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin h-6 w-6 text-navy-300" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-navy-300">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isUserMessage = message.sender === user?._id;
                        const { time, status } = formatMessageTimeAndStatus(message, user?._id || '');
                        
                        return (
                          <div
                            key={message._id}
                            ref={el => {
                              if (el) messageRefs.current[message._id] = el;
                            }}
                            data-message-id={message._id}
                            className={`flex mb-4 ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                isUserMessage
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-navy-700 text-white'
                              }`}
                            >
                              <div className="mb-1">
                                {message.content}
                              </div>
                              <div 
                                className={`text-xs flex justify-end ${
                                  isUserMessage ? 'text-indigo-200' : 'text-navy-300'
                                }`}
                              >
                                {time} {isUserMessage && status}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                
                  {/* New message input */}
                  <div className="p-4 border-t border-navy-700 bg-navy-850">
                    <form onSubmit={sendMessage} className="flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        ref={inputRef}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 bg-navy-700 border border-navy-600 rounded-l-lg text-white focus:outline-none focus:border-gold-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-gold-500 text-navy-900 px-4 py-2 rounded-r-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedMessaging; 