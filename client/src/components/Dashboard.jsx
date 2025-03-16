import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subDays, parseISO } from 'date-fns';
import TimeSeriesChart from './TimeSeriesChart';
import TimeEntryForm from './TimeEntryForm';
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
          console.log("Processed data:", processedData); // Debug log
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
    console.log("Processing time data with logs:", logs);
    console.log("Current categories:", categories);
    console.log("Date range:", dateRange);

    if (!logs || logs.length === 0) {
      console.log("No logs to process");
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
        } else {
          console.warn(`No date entry found for log date: ${log.date}`);
        }
      });

      // Convert map to array and sort by date
      const result = Array.from(dateMap.values()).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );

      console.log("Processed data result:", result);
      return result;
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
      stat.percentage = Math.round((stat.totalTime / total) * 100);
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

  // Format minutes as hours and minutes
  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Get data for chart (only visible categories)
  const getVisibleTimeData = () => {
    if (!timeData || timeData.length === 0) {
      console.log("No time data available for filtering");
      return [];
    }

    console.log("Filtering time data with visibility:", categoryVisibility);

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
          } else {
            console.warn(`Category ID ${categoryId} not found in visibility settings`);
          }
        }
      });
      return filtered;
    });
  };

  // Group category stats by parent for display
  const groupCategoryStats = () => {
    const rootCategories = categoryStats.filter(stat => !stat.parent_id);
    const childrenMap = {};

    categoryStats.forEach(stat => {
      if (stat.parent_id) {
        if (!childrenMap[stat.parent_id]) {
          childrenMap[stat.parent_id] = [];
        }
        childrenMap[stat.parent_id].push(stat);
      }
    });

    return { rootCategories, childrenMap };
  };

  // Render date range selector
  const renderDateSelector = () => (
    <div className="card mb-6">
      <div className="card-header">
        <h2 className="card-title">Select Time Period</h2>
      </div>
      <div className="card-content">
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => handlePresetChange('today')}
              className={`btn ${presetRange === 'today' ? 'btn-primary' : 'btn-outline'}`}
            >
              Today
            </button>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`btn ${presetRange === '7days' ? 'btn-primary' : 'btn-outline'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetChange('30days')}
              className={`btn ${presetRange === '30days' ? 'btn-primary' : 'btn-outline'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('thisMonth')}
              className={`btn ${presetRange === 'thisMonth' ? 'btn-primary' : 'btn-outline'}`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('lastMonth')}
              className={`btn ${presetRange === 'lastMonth' ? 'btn-primary' : 'btn-outline'}`}
            >
              Last Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="form-input"
              max={dateRange.endDate}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="form-input"
              min={dateRange.startDate}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render time entry form
  const renderTimeEntryForm = () => (
    <div className="mb-6">
      <TimeEntryForm
        categories={categories}
        onSuccess={() => {
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
        }}
      />
    </div>
  );

  // Render stats summary
  const renderStatsSummary = () => {
    const { rootCategories, childrenMap } = groupCategoryStats();

    return (
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Time Summary</h2>
        </div>
        <div className="card-content">
          <div className="stat-value text-center mb-4">{formatTime(totalTime)}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="stat-card">
              <div className="stat-title">Time Period</div>
              <div className="stat-desc">
                {format(parseISO(dateRange.startDate), 'MMM d, yyyy')} - {format(parseISO(dateRange.endDate), 'MMM d, yyyy')}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Daily Average</div>
              <div className="stat-desc">
                {formatTime(Math.round(totalTime / Math.max(1, timeData.length)))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Category Breakdown</h3>

            {rootCategories.length === 0 ? (
              <p className="text-gray-500 italic">No data for the selected period</p>
            ) : (
              <div className="space-y-4">
                {rootCategories.map(category => {
                  const children = childrenMap[category.id] || [];

                  return (
                    <div key={category.id} className="category-item">
                      <div className="category-parent flex items-center justify-between">
                        <div className="flex items-center">
                          <span
                            className="inline-block w-3 h-3 mr-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatTime(category.totalTime)}</div>
                          <div className="text-sm text-gray-500">{category.percentage}%</div>
                        </div>
                      </div>

                      {children.length > 0 && (
                        <div className="category-children">
                          {children.map(child => (
                            <div key={child.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center">
                                <span
                                  className="inline-block w-2 h-2 mr-2 rounded-full"
                                  style={{ backgroundColor: child.color }}
                                ></span>
                                <span className="text-sm">{child.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{formatTime(child.totalTime)}</div>
                                <div className="text-xs text-gray-500">{child.percentage}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render time chart
  const renderTimeChart = () => (
    <div className="card mb-6">
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

  // Render category toggles
  const renderCategoryToggles = () => (
    <div className="card mb-6">
      <div className="card-header">
        <h2 className="card-title">Toggle Categories</h2>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories
            .filter(category => !category.parent_id)
            .map(category => (
              <div key={category.id} className="flex items-center">
                <label className="flex items-center cursor-pointer space-x-2">
                  <input
                    type="checkbox"
                    checked={categoryVisibility[category.id] !== false}
                    onChange={() => toggleCategoryVisibility(category.id)}
                    className="form-checkbox"
                  />
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <span>{category.name}</span>
                </label>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

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
    <div className="dashboard">
      {renderDateSelector()}

      {renderTimeEntryForm()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Series Chart (Larger) */}
        <div className="md:col-span-2">
          {renderTimeChart()}
        </div>

        {/* Stats and Category Toggles (Sidebar) */}
        <div className="md:col-span-1">
          {renderStatsSummary()}
          {renderCategoryToggles()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;