import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Search, ChevronLeft, Clock, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

const AdminMessaging: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());
  const [userIsTyping, setUserIsTyping] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Check if user is admin
  const isAdmin = user?.isAdmin === true;
  
  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // In a real app, this is where you would send a websocket message
    // to notify the user that the admin is typing
    
    // NOTE: We don't show "User is typing" here because without websockets,
    // we have no way to know when the user is actually typing
  };
  
  // Fetch all conversations
  const fetchConversations = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/messages/admin/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setConversations(response.data.conversations);
        setFilteredConversations(response.data.conversations);
      } else {
        setError(response.data.message || 'Failed to load conversations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch conversation with specific user
  const fetchMessages = async (userId: string) => {
    if (!user || !isAdmin) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log(`Fetching messages with user: ${userId}`);
      
      const response = await axios.get(`http://localhost:5000/api/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log(`Fetched ${response.data.messages.length} messages`);
        setMessages(response.data.messages);
        setActiveConversation(userId);
        
        // Clear visible messages when loading a new conversation
        setVisibleMessages(new Set());
        
        // Don't automatically mark messages as read
        // Instead, the Intersection Observer will handle this when messages become visible
        
        // Update conversations list with potentially new messages
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.user._id === userId 
              ? { ...conv } // Keep current unread count, don't reset to 0
              : conv
          )
        );
        
        setFilteredConversations(prevFiltered => 
          prevFiltered.map(conv => 
            conv.user._id === userId 
              ? { ...conv } // Keep current unread count, don't reset to 0
              : conv
          )
        );
      } else {
        setError(response.data.message || 'Failed to load messages');
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      if (err.response?.status === 403) {
        setError('Unauthorized: You do not have permission to view these messages');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Error loading messages');
      }
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
    
    console.log(`Setting up observer for ${messagesToObserve.length} unread messages to admin`);
    
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
                console.log(`Admin has seen message ${messageId} for required time - marking as read`);
                markMessageAsRead(messageId);
              }, 2000); // 2 seconds of visibility required
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
      console.log(`Admin marking message ${messageId} as read - sender: ${message.sender}, recipient: ${message.recipient}`);
      
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
      
      // Update unread count in conversations
      if (activeConversation) {
        setConversations(prev => 
          prev.map(conv => 
            conv.user._id === activeConversation
              ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) }
              : conv
          )
        );
        
        setFilteredConversations(prev => 
          prev.map(conv => 
            conv.user._id === activeConversation
              ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) }
              : conv
          )
        );
      }
      
      // Now actually try to update on the server
      try {
        console.log(`Calling API to mark message as read: ${messageId}`);
        
        const response = await axios.put(
          `http://localhost:5000/api/messages/read/${messageId}`, 
          {}, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log(`API response:`, response.data);
        
        if (!response.data.success) {
          console.warn(`Server reported non-success when marking message as read: ${response.data.message}`);
        }
      } catch (apiError: any) {
        console.error(`Failed API call to mark message as read for ${messageId}:`, apiError);
        console.error(`Error response:`, apiError.response?.data);
        
        // We'll still keep the UI updated for better UX
        // In a production app, you might want to add a toast message or other notification here
      }
    } catch (err) {
      console.error(`Error in markMessageAsRead function for ${messageId}:`, err);
    }
  };
  
  // Mark all messages in the active conversation as read
  const markAllAsRead = async () => {
    if (!user || !activeConversation || messages.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      // Extract conversation ID from message ID using proper parsing
      const messageId = messages[0]._id;
      let conversationId;
      
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
      
      // Verify that conversationId is a valid MongoDB ObjectId (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        console.error(`Invalid conversation ID format: ${conversationId}`);
        setError('Error: Invalid conversation format');
        return;
      }
      
      console.log(`Marking all messages in conversation ${conversationId} as read`);
      
      const response = await axios.put(
        `http://localhost:5000/api/messages/conversation/${conversationId}/read`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update all messages in local state
        setMessages(prev => 
          prev.map(msg => ({
            ...msg,
            readByRecipient: msg.recipient === user._id ? true : msg.readByRecipient
          }))
        );
        
        // Update conversation unread count
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
        
        // Update visible messages set
        const newVisibleSet = new Set(visibleMessages);
        messages.forEach(msg => {
          if (msg.recipient === user._id) {
            newVisibleSet.add(msg._id);
          }
        });
        setVisibleMessages(newVisibleSet);
      }
    } catch (err) {
      console.error('Error marking all messages as read:', err);
    }
  };
  
  // Send a message to user
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !activeConversation) return;
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log(`Sending message to user: ${activeConversation}`);
      
      const response = await axios.post(
        `http://localhost:5000/api/messages/admin/to-user/${activeConversation}`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setNewMessage('');
        // Refresh the messages to include the new one
        fetchMessages(activeConversation);
      } else {
        setError(response.data.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      if (err.response?.status === 403) {
        setError('Unauthorized: You do not have permission to send messages');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Error sending message');
      }
    }
  };
  
  // Filter conversations based on search term
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(
      conversation => 
        conversation.user.name.toLowerCase().includes(term) ||
        conversation.user.email.toLowerCase().includes(term)
    );
    
    setFilteredConversations(filtered);
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Initial data loading
  useEffect(() => {
    if (user && isAdmin) {
      fetchConversations();
      
      // Set up polling for new conversations (every 30 seconds)
      const intervalId = setInterval(() => {
        fetchConversations();
        // Also refresh active conversation if one is selected
        if (activeConversation) {
          fetchMessages(activeConversation);
        }
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);
  
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
  
  if (!user) {
    return <div className="p-4 text-navy-300">Please log in to access messaging</div>;
  }
  
  if (!isAdmin) {
    return <div className="p-4 text-navy-300">Only admins can access this panel</div>;
  }
  
  const getActiveUser = () => {
    if (!activeConversation) return null;
    return conversations.find(c => c.user._id === activeConversation)?.user;
  };
  
  const activeUser = getActiveUser();
  
  return (
    <div className="flex h-[calc(100vh-8rem)] bg-navy-800 rounded-lg shadow-md overflow-hidden border border-navy-700">
      {/* Conversations List */}
      <div className={`${activeConversation && 'hidden md:block'} w-full md:w-1/3 border-r border-navy-600`}>
        <div className="p-4 border-b border-navy-600 bg-navy-750">
          <h2 className="text-lg font-semibold mb-2 text-gold-500">Conversations</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-navy-600 bg-navy-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <Search className="absolute left-3 top-2.5 text-navy-400 h-5 w-5" />
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-72px)] bg-navy-800">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-navy-300 p-4">
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.user._id}
                  onClick={() => fetchMessages(conversation.user._id)}
                  className={`flex items-center p-4 border-b border-navy-600 hover:bg-navy-750 cursor-pointer relative ${
                    activeConversation === conversation.user._id ? 'bg-navy-700' : ''
                  }`}
                >
                  {/* User avatar */}
                  <div className="h-10 w-10 rounded-full bg-navy-600 flex items-center justify-center mr-3 border border-navy-500">
                    {conversation.user.profilePicture ? (
                      <img 
                        src={conversation.user.profilePicture} 
                        alt={conversation.user.name}
                        className="h-10 w-10 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-gold-500 font-bold">
                        {conversation.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* User info and last message */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-white">{conversation.user.name}</h3>
                      <span className="text-xs text-navy-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {conversation.lastMessage.createdAt 
                          ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
                          : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-navy-300 truncate">{conversation.user.email}</p>
                  </div>
                  
                  {/* Unread indicator */}
                  {conversation.unreadCount > 0 && (
                    <div className="absolute top-4 right-4 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{conversation.unreadCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <div className={`${!activeConversation && 'hidden md:flex'} flex-col w-full md:w-2/3 bg-navy-900`}>
        {!activeConversation ? (
          <div className="flex flex-col items-center justify-center h-full text-navy-300">
            <div className="p-6 rounded-full bg-navy-750 mb-4">
              <MessageSquare className="h-12 w-12 text-gold-500" />
            </div>
            <p>Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="bg-navy-750 border-b border-navy-600 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => setActiveConversation(null)} 
                  className="md:hidden mr-2 p-1 rounded-full hover:bg-navy-700"
                >
                  <ChevronLeft className="h-5 w-5 text-navy-300" />
                </button>
                
                <div className="h-10 w-10 rounded-full bg-navy-600 flex items-center justify-center mr-3 border border-navy-500">
                  {activeUser?.profilePicture ? (
                    <img 
                      src={activeUser.profilePicture} 
                      alt={activeUser.name}
                      className="h-10 w-10 rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-gold-500 font-bold">
                      {activeUser?.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-white">{activeUser?.name}</h3>
                  <p className="text-xs text-navy-300">{activeUser?.email}</p>
                </div>
              </div>
              
              {/* Add the Mark All as Read button when there are unread messages */}
              {activeConversation && 
               (conversations.find(c => c.user._id === activeConversation)?.unreadCount ?? 0) > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs bg-navy-600 hover:bg-navy-500 text-white py-1 px-3 rounded transition-colors flex items-center"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark All Read
                </button>
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
                  <span>Read by recipient</span>
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
                  No messages in this conversation yet
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
                    const { time, statusIcon, statusLabel } = formatMessageTimeAndStatus(message, user._id);
                    
                    const isFromCurrentUser = message.sender === user._id;
                    
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
                              !message.readByRecipient && message.recipient === user._id 
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMessaging; 