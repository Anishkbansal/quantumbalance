import React, { useState, useEffect } from 'react';
import { Users, UserPlus, FileText, CreditCard, Stethoscope, Package, Activity, AlertCircle, MessageSquare, Music, Gift } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPackages: number;
  activePackages: number;
  totalPrescriptions: number;
  pendingPrescriptions: number;
  totalPayments: number;
  recentPayments: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPackages: 0,
    activePackages: 0,
    totalPrescriptions: 0,
    pendingPrescriptions: 0,
    totalPayments: 0,
    recentPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        // In a real app, this would be a single API call to get all stats
        // For now, we'll simulate the data
        setStats({
          totalUsers: 150,
          activeUsers: 120,
          totalPackages: 200,
          activePackages: 180,
          totalPrescriptions: 500,
          pendingPrescriptions: 25,
          totalPayments: 1000,
          recentPayments: 50
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard statistics');
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'gold' 
  }: { 
    title: string; 
    value: number; 
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
  }) => (
    <div className="bg-navy-800 rounded-lg p-6 border border-navy-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-navy-300 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`bg-${color}-500/20 p-3 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-navy-800 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-navy-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={Users} 
          />
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers} 
            icon={UserPlus} 
          />
          <StatCard 
            title="Total Packages" 
            value={stats.totalPackages} 
            icon={Package} 
          />
          <StatCard 
            title="Active Packages" 
            value={stats.activePackages} 
            icon={Activity} 
          />
          <StatCard 
            title="Total Prescriptions" 
            value={stats.totalPrescriptions} 
            icon={Stethoscope} 
          />
          <StatCard 
            title="Pending Prescriptions" 
            value={stats.pendingPrescriptions} 
            icon={Stethoscope} 
            color="red"
          />
          <StatCard 
            title="Total Payments" 
            value={stats.totalPayments} 
            icon={CreditCard} 
          />
          <StatCard 
            title="Recent Payments" 
            value={stats.recentPayments} 
            icon={FileText} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-navy-800 rounded-lg p-6 border border-navy-700">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/admin/create-user')}
                className="p-4 bg-navy-750 rounded-lg hover:bg-navy-700 transition flex items-center"
              >
                <UserPlus className="w-5 h-5 text-gold-500 mr-2" />
                <span className="text-white">Create User</span>
              </button>
              <button 
                className="p-4 bg-navy-750 rounded-lg hover:bg-navy-700 transition flex items-center"
              >
                <Package className="w-5 h-5 text-gold-500 mr-2" />
                <span className="text-white">Create Package</span>
              </button>
              <button 
                className="p-4 bg-navy-750 rounded-lg hover:bg-navy-700 transition flex items-center"
              >
                <Stethoscope className="w-5 h-5 text-gold-500 mr-2" />
                <span className="text-white">Create Prescription</span>
              </button>
              <button 
                onClick={() => navigate('/admin/messages')}
                className="p-4 bg-navy-750 rounded-lg hover:bg-navy-700 transition flex items-center"
              >
                <MessageSquare className="w-5 h-5 text-gold-500 mr-2" />
                <span className="text-white">User Messages</span>
              </button>
              <button 
                onClick={() => navigate('/admin/sonic-library')}
                className="p-4 bg-navy-750 rounded-lg hover:bg-navy-700 transition flex items-center"
              >
                <Music className="w-5 h-5 text-gold-500 mr-2" />
                <span className="text-white">Sonic Library</span>
              </button>
              <button 
                onClick={() => navigate('/admin/gift-cards')}
                className="p-4 bg-navy-750 rounded-lg hover:bg-navy-700 transition flex items-center"
              >
                <Gift className="w-5 h-5 text-gold-500 mr-2" />
                <span className="text-white">Gift Cards</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-navy-800 rounded-lg p-6 border border-navy-700">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {/* Simulated recent activity items */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-3 bg-navy-750 rounded-lg">
                  <div className="w-2 h-2 bg-gold-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-white">New user registration</p>
                    <p className="text-navy-300 text-sm">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 