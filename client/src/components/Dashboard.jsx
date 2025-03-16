import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subDays, parseISO } from 'date-fns';
import TimeSeriesChart from './TimeSeriesChart';
import Sidebar from './Sidebar';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [categories, setCategories] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [totalTime, setTotalTime] = useState(0);
  const [categoryVisibility, setCategoryVisibility] = useState({});
  const [categoryStats, setCategoryStats] = useState([]);
  const [error, setError] = useState(null);
  const [presetRange, setPresetRange] = useState('30days');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories?flat=true`);
        setCategories(response.data);

        // Initialize category visibility (all visible by default)
        const initialVisibility = {};
        response.data.forEach(category => {
          initialVisibility[category.id] = true;
        });
        setCategoryVisibility(initialVisibility);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      }
    };

    fetchCategories();
  }, []);

  // Fetch time log data when date range or categories change
  useEffect(() => {
    const fetchTimeData = async () => {
      if (categories.length === 0) return;

      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/logs`, {
          params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
          }
        });

        // Ensure we have data before processing
        if (response.data && response.data.length > 0) {
          // Process the data to group by date and categories
          const processedData = processTimeData(response.data);
          setTimeData(processedData);

          // Calculate total time and stats
          calculateStats(response.data);
        } else {
          console.log("No log data returned from API");
          setTimeData([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching time logs:', err);
        setError('Failed to load time data. Please try again later.');
        setIsLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchTimeData();
    }
  }, [categories, dateRange]);

  // Process time log data for the chart
  const processTimeData = (logs) => {
    if (!logs || logs.length === 0) {
      // Return a minimal dataset instead of empty array to avoid D3 errors
      const emptyData = [];
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const entry = { date: dateStr };
        categories.forEach(category => {
          entry[`category_${category.id}`] = 0;
        });
        emptyData.push(entry);
      }

      return emptyData;
    }

    // Create a map to group by date
    const dateMap = new Map();

    try {
      // Initialize with all dates in the range, even if no data
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        dateMap.set(dateStr, { date: dateStr });

        // Initialize with 0 for all categories
        categories.forEach(category => {
          dateMap.get(dateStr)[`category_${category.id}`] = 0;
        });
      }

      // Fill in actual data
      logs.forEach(log => {
        const dateEntry = dateMap.get(log.date);
        if (dateEntry) {
          dateEntry[`category_${log.category_id}`] = log.total_time;
        }
      });

      // Convert map to array and sort by date
      return Array.from(dateMap.values()).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );
    } catch (error) {
      console.error("Error processing time data:", error);
      // Return empty array with proper structure to avoid breaking the chart
      return [];
    }
  };

  // Calculate stats for the selected time period
  const calculateStats = (logs) => {
    // Group data by category
    const stats = {};
    let total = 0;

    // Initialize stats for all categories
    categories.forEach(category => {
      stats[category.id] = {
        id: category.id,
        name: category.name,
        color: category.color,
        parent_id: category.parent_id,
        totalTime: 0
      };
    });

    // Calculate totals
    logs.forEach(log => {
      if (stats[log.category_id]) {
        stats[log.category_id].totalTime += log.total_time;
        total += log.total_time;
      }
    });

    // Convert to array and sort by total time
    const sortedStats = Object.values(stats)
      .filter(stat => stat.totalTime > 0)
      .sort((a, b) => b.totalTime - a.totalTime);

    // Calculate percentages
    sortedStats.forEach(stat => {
      stat.percentage = Math.round((stat.totalTime / total) * 100) || 0;
    });

    setCategoryStats(sortedStats);
    setTotalTime(total);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle preset range selection
  const handlePresetChange = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case 'today':
        start = format(today, 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case '7days':
        start = format(subDays(today, 6), 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case '30days':
        start = format(subDays(today, 29), 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        start = format(startOfMonth(today), 'yyyy-MM-dd');
        end = format(today, 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(today), 1);
        start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setPresetRange(preset);
    setDateRange({ startDate: start, endDate: end });
  };

  // Toggle category visibility
  const toggleCategoryVisibility = (categoryId) => {
    setCategoryVisibility(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Get data for chart (only visible categories)
  const getVisibleTimeData = () => {
    if (!timeData || timeData.length === 0) {
      return [];
    }

    return timeData.map(day => {
      const filtered = { date: day.date };
      Object.keys(day).forEach(key => {
        if (key.startsWith('category_')) {
          const categoryId = parseInt(key.split('_')[1]);
          // Check if this category exists in visibility object
          if (categoryVisibility.hasOwnProperty(categoryId)) {
            if (categoryVisibility[categoryId]) {
              filtered[key] = day[key];
            }
          }
        }
      });
      return filtered;
    });
  };

  // Render time chart
  const renderTimeChart = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Time Spent Trends</h2>
      </div>
      <div className="card-content">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        ) : (
          <TimeSeriesChart
            data={getVisibleTimeData()}
            categories={categories}
            categoryVisibility={categoryVisibility}
          />
        )}
      </div>
    </div>
  );

  const handleSuccess = () => {
    // Refetch time data after successful entry
    const fetchTimeData = async () => {
      try {
        const response = await axios.get(`${API_URL}/logs`, {
          params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
          }
        });

        const processedData = processTimeData(response.data);
        setTimeData(processedData);

        // Calculate stats
        calculateStats(response.data);
      } catch (err) {
        console.error('Error fetching time logs:', err);
      }
    };

    fetchTimeData();
  };

  if (error) {
    return (
      <div className="alert alert-error">
        <div className="alert-content">
          <div className="alert-title">Error</div>
          <p>{error}</p>
        </div>
        <button
          className="alert-dismiss"
          onClick={() => setError(null)}
        >
          &times;
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Sidebar 
          dateRange={dateRange}
          totalTime={totalTime}
          categoryStats={categoryStats}
          categories={categories}
          categoryVisibility={categoryVisibility}
          onDateRangeChange={handleDateRangeChange}
          onToggleCategoryVisibility={toggleCategoryVisibility}
          onPresetChange={handlePresetChange}
          presetRange={presetRange}
          handleSuccess={handleSuccess}
        />
      </div>
      <div className="lg:col-span-3">
        {renderTimeChart()}
      </div>
    </div>
  );
};

export default Dashboard;