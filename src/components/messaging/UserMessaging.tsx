import React from 'react';
import SharedMessaging from './SharedMessaging';

const UserMessaging: React.FC = () => {
  return <SharedMessaging isAdmin={false} />;
};

export default UserMessaging; 