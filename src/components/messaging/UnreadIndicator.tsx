import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';
import { API_URL } from '../../config/constants';

interface UnreadIndicatorProps {
  className?: string;
  userId?: string;
  minimal?: boolean;
}

const UnreadIndicator: React.FC<UnreadIndicatorProps> = ({ className = '', userId, minimal = false }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  
  // Only active for logged in users
  const isUserLoggedIn = !!user;
  
  // Check for unread messages
  const checkUnreadMessages = async () => {
    if (!isUserLoggedIn) return;
    
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
  
  // Initial check and set up polling
  useEffect(() => {
    if (isUserLoggedIn) {
      checkUnreadMessages();
      
      // Poll for new messages every minute
      const intervalId = setInterval(checkUnreadMessages, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [isUserLoggedIn]);
  
  if (!isUserLoggedIn || unreadCount === 0) {
    return null;
  }
  
  // Return a smaller version when minimal is true
  if (minimal) {
    return (
      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-navy-900 shadow-md border border-navy-700">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    );
  }
  
  return (
    <div className="relative">
      <MessageSquare className={`h-5 w-5 text-gold-500 ${className}`} />
      <span className="absolute -top-2 -right-2 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center text-navy-900 text-xs font-bold shadow-md border border-navy-700 animate-pulse">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </div>
  );
};

export default UnreadIndicator; 