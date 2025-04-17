import React from 'react';
import SharedMessaging from './SharedMessaging';

const AdminMessaging: React.FC = () => {
  return <SharedMessaging isAdmin={true} />;
};

export default AdminMessaging; 