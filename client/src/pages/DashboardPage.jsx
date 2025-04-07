// DashboardPage.jsx is the container component that renders the Dashboard

import { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { useApp } from '../contexts/AppContext';
import { fetchLogs, fetchStats } from '../services/timeLogService';
import { getDateRanges } from '../utils/dateUtils';
import { Alert } from '../components/common/Alert';
import '../styles/pages/dashboardpage.css';

const DashboardPage = () => {
  const { categories, loading: categoriesLoading } = useApp();
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(getDateRanges().last30Days);

  // Fetch logs and stats when date range or categories change
  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch logs for selected date range
        const logsData = await fetchLogs({
          start_date: dateRange.start,
          end_date: dateRange.end
        });
        setLogs(logsData);

        // Fetch stats for selected date range
        const statsData = await fetchStats({
          start_date: dateRange.start,
          end_date: dateRange.end,
          group_by: 'category'
        });
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
    setDateRange(newRange);
  };

  // Handle error dismissal
  const handleDismissError = () => {
    setError(null);
  };

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