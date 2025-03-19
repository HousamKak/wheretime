import { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { useApp } from '../contexts/AppContext';
import { fetchLogs, fetchStats } from '../services/timeLogService';
import { getDateRanges } from '../utils/dateUtils';
import { Alert } from '../components/common/Alert';
import '../styles/pages/dashboardpage.css';

const DashboardPage = () => {
  console.log("DashboardPage render");
  
  const { categories, loading: categoriesLoading } = useApp();
  console.log("Categories from useApp:", categories?.length || 0);
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(getDateRanges().last30Days);
  
  console.log("Current date range:", dateRange);

  // Fetch logs and stats when date range or categories change
  useEffect(() => {
    console.log("DashboardPage useEffect triggered for data fetching");
    console.log("Categories for fetching:", categories?.length || 0);
    console.log("Date range for fetching:", dateRange);
    
    if (categories.length === 0) {
      console.log("No categories available yet, skipping data fetch");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch logs for selected date range
        console.log("Fetching logs for date range:", dateRange);
        const logsData = await fetchLogs({
          start_date: dateRange.start,
          end_date: dateRange.end
        });
        console.log("Logs fetched:", logsData.length);
        setLogs(logsData);

        // Fetch stats for selected date range
        console.log("Fetching stats for date range:", dateRange);
        const statsData = await fetchStats({
          start_date: dateRange.start,
          end_date: dateRange.end,
          group_by: 'category'
        });
        console.log("Stats fetched:", statsData.length);
        setStats(statsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [categories, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    console.log("Date range changed:", newRange);
    setDateRange(newRange);
  };

  // Handle error dismissal
  const handleDismissError = () => {
    setError(null);
  };
  
  console.log("Rendering Dashboard component with props:", {
    categoriesCount: categories?.length || 0,
    logsCount: logs?.length || 0,
    statsCount: stats?.length || 0,
    dateRange,
    loading: loading || categoriesLoading
  });

  return (
    <div className="dashboard-page-container">
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onDismiss={handleDismissError} 
          className="dashboard-alert"
        />
      )}
      
      <Dashboard 
        categories={categories}
        logs={logs}
        stats={stats}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        loading={loading || categoriesLoading}
      />
    </div>
  );
};

export default DashboardPage;