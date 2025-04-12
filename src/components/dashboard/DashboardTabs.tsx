import React from 'react';
import { Activity, MessageSquare, Music } from 'lucide-react';

type TabType = 'prescriptions' | 'wellness' | 'messages' | 'sonic-library';

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasUnreadMessages?: boolean;
  isPremiumUser?: boolean;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
  hasUnreadMessages = false,
  isPremiumUser = false
}) => {
  // Create base tabs that are available to all users
  const baseTabs = [
    {
      id: 'prescriptions' as TabType,
      label: 'Prescriptions',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'wellness' as TabType,
      label: 'Wellness Log',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'messages' as TabType,
      label: 'Messages',
      icon: <MessageSquare className="w-5 h-5" />,
      notification: hasUnreadMessages
    }
  ];
  
  // Add the sonic library tab for premium users
  const tabs = [...baseTabs];
  
  // Insert the sonic library tab after wellness (position 2)
  if (isPremiumUser) {
    tabs.splice(2, 0, {
      id: 'sonic-library' as TabType,
      label: 'Sonic Library',
      icon: <Music className="w-5 h-5" />
    });
  }

  return (
    <div className="mb-6 border-b border-navy-700">
      <div className="flex flex-wrap -mb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center py-4 px-4 text-sm font-medium border-b-2 ${
              activeTab === tab.id 
                ? 'text-gold-500 border-gold-500'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-700'
            } transition-colors relative`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {tab.notification && (
              <span className="absolute top-3 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardTabs; 