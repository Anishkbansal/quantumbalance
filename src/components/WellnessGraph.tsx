import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Moon, Sun, BarChart4 } from 'lucide-react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WellnessEntry {
  _id: string;
  date: string;
  sleep: number;
  water: number;
  energy: number;
  wellbeing: number;
}

interface WellnessGraphProps {
  wellnessEntries: WellnessEntry[];
  dateRange: '7days' | '30days' | '3months' | '6months';
}

const WellnessGraph: React.FC<WellnessGraphProps> = ({ wellnessEntries, dateRange }) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  const prepareChartData = () => {
    if (!wellnessEntries || wellnessEntries.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const sortedData = [...wellnessEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const labels = sortedData.map(item => formatDateLabel(item.date));
    
    return {
      labels,
      datasets: [
        {
          label: 'Sleep',
          data: sortedData.map(item => item.sleep),
          borderColor: 'rgba(99, 102, 241, 1)', // Indigo color
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          tension: 0.4
        },
        {
          label: 'Water',
          data: sortedData.map(item => item.water),
          borderColor: 'rgba(6, 182, 212, 1)', // Cyan color
          backgroundColor: 'rgba(6, 182, 212, 0.2)',
          tension: 0.4
        },
        {
          label: 'Energy',
          data: sortedData.map(item => item.energy),
          borderColor: 'rgba(251, 191, 36, 1)', // Amber color
          backgroundColor: 'rgba(251, 191, 36, 0.2)',
          tension: 0.4
        },
        {
          label: 'Wellbeing',
          data: sortedData.map(item => item.wellbeing),
          borderColor: 'rgba(236, 72, 153, 1)', // Pink color
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          tension: 0.4
        }
      ]
    };
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    }
  };
  
  const calculateAverage = (metric: 'sleep' | 'water' | 'energy' | 'wellbeing') => {
    if (!wellnessEntries || wellnessEntries.length === 0) return '-';
    const average = wellnessEntries.reduce((sum, entry) => sum + entry[metric], 0) / wellnessEntries.length;
    return average.toFixed(1);
  };
  
  return (
    <div>
      <div className="h-80 w-full bg-navy-750 rounded-lg p-4 border border-navy-600 relative mb-6">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        ) : wellnessEntries && wellnessEntries.length > 0 ? (
          <Line data={prepareChartData()} options={chartOptions} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-navy-400">
            <BarChart4 className="h-12 w-12 mb-3 opacity-50" />
            <p>No wellness data available</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Moon className="h-5 w-5 text-indigo-400 mr-2" />
            <h4 className="text-white font-medium">Sleep</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-indigo-400">
              {calculateAverage('sleep')}/10
            </span>
          </div>
        </div>
        
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Droplet className="h-5 w-5 text-cyan-400 mr-2" />
            <h4 className="text-white font-medium">Water</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-cyan-400">
              {calculateAverage('water')}/10
            </span>
          </div>
        </div>
        
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Sun className="h-5 w-5 text-amber-400 mr-2" />
            <h4 className="text-white font-medium">Energy</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-amber-400">
              {calculateAverage('energy')}/10
            </span>
          </div>
        </div>
        
        <div className="bg-navy-750 p-4 rounded-lg border border-navy-700">
          <div className="flex items-center mb-2">
            <Activity className="h-5 w-5 text-pink-400 mr-2" />
            <h4 className="text-white font-medium">Wellbeing</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-navy-300">Average</span>
            <span className="text-lg font-bold text-pink-400">
              {calculateAverage('wellbeing')}/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessGraph; 