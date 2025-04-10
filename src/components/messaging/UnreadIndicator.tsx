import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

interface UnreadIndicatorProps {
  className?: string;
}

const UnreadIndicator: React.FC<UnreadIndicatorProps> = ({ className = '' }) => {
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
        'http://localhost:5000/api/messages/unread/count',
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
    return <MessageSquare className={`h-5 w-5 text-navy-300 ${className}`} />;
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