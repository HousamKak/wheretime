import React, { useState, useEffect, useMemo } from 'react';
import TimeSeriesChart from './TimeSeriesChart';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import '../styles/components/dashboard.css';
import { Button } from './common/Button';

const Dashboard = ({ 
  categories = [],
  logs = [],
  stats = [],
  dateRange = { start: '', end: '' },
  onDateRangeChange,
  loading = false
}) => {
  console.log("Dashboard render - props received:", { 
    categoriesCount: categories.length,
    logsCount: logs.length,
    statsCount: stats.length,
    dateRange,
    loading
  });
  
  // State for controlling sidebar visibility
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize category visibility state with useMemo to handle async loading
  const initialCategoryVisibility = useMemo(() => {
    console.log("Initializing category visibility state with:", categories.length, "categories");
    const result = categories.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {});
    console.log("Initial category visibility state:", result);
    return result;
  }, [categories]);

  // Initialize expanded categories state
  const initialExpandedCategories = useMemo(() => {
    console.log("Initializing expanded categories state with:", categories.length, "categories");
    const result = categories.reduce((acc, category) => {
      if (!category.parent_id) {
        acc[category.id] = false;
      }
      return acc;
    }, {});
    console.log("Initial expanded categories state:", result);
    return result;
  }, [categories]);
  
  // Track category visibility and expanding state
  const [categoryVisibility, setCategoryVisibility] = useState(initialCategoryVisibility);
  const [expandedCategories, setExpandedCategories] = useState(initialExpandedCategories);
  const [presetRange, setPresetRange] = useState('30days');

  // Update state when categories change
  useEffect(() => {
    console.log("Categories changed, updating visibility and expansion states");
    console.log("New visibility state:", initialCategoryVisibility);
    console.log("New expanded state:", initialExpandedCategories);
    setCategoryVisibility(initialCategoryVisibility);
    setExpandedCategories(initialExpandedCategories);
  }, [categories, initialCategoryVisibility, initialExpandedCategories]);

  // Check for mobile view on initial load and resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebars on mobile
      if (mobile) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        // Reopen on desktop if previously closed due to mobile
        if (!leftSidebarOpen && !rightSidebarOpen) {
          setLeftSidebarOpen(true);
          setRightSidebarOpen(true);
        }
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [leftSidebarOpen, rightSidebarOpen]);

  // Handle preset range selection
  const handlePresetChange = (preset) => {
    console.log("Preset range changed to:", preset);
    const today = new Date();
    let start, end;

    switch (preset) {
      case 'today':
        start = formatDateISO(today);
        end = formatDateISO(today);
        break;
      case '7days':
        start = formatDateISO(new Date(new Date().setDate(today.getDate() - 6)));
        end = formatDateISO(new Date());
        break;
      case '30days':
        start = formatDateISO(new Date(new Date().setDate(today.getDate() - 29)));
        end = formatDateISO(new Date());
        break;
      case 'thisMonth':
        start = formatDateISO(new Date(today.getFullYear(), today.getMonth(), 1));
        end = formatDateISO(new Date());
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = formatDateISO(lastMonth);
        end = formatDateISO(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      default:
        return;
    }

    console.log("New date range:", { start, end });
    setPresetRange(preset);
    onDateRangeChange({ start, end });
  };

  // Format date to ISO format (YYYY-MM-DD)
  const formatDateISO = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Toggle category visibility
  const toggleCategoryVisibility = (categoryId) => {
    if (!categoryId) {
      console.error("toggleCategoryVisibility called with invalid categoryId:", categoryId);
      return;
    }
    
    console.log("Toggling visibility for category:", categoryId);
    console.log("Current visibility state:", categoryVisibility);
    
    setCategoryVisibility(prev => {
      const newState = {
        ...prev,
        [categoryId]: !prev[categoryId]
      };
      console.log("New visibility state:", newState);
      return newState;
    });
  };
  
  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    if (!categoryId) {
      console.error("toggleCategoryExpansion called with invalid categoryId:", categoryId);
      return;
    }
    
    console.log("Toggling expansion for category:", categoryId);
    console.log("Current expansion state:", expandedCategories);
    
    setExpandedCategories(prev => {
      const newState = {
        ...prev,
        [categoryId]: !prev[categoryId]
      };
      console.log("New expansion state:", newState);
      return newState;
    });
  };

  // Calculate total time from stats
  const totalTime = stats.reduce((total, stat) => total + (stat.totalTime || 0), 0);
  console.log("Calculated total time:", totalTime);

  // Process logs data for the chart
  const processLogsForChart = () => {
    console.log("Processing logs for chart, logs count:", logs?.length || 0);
    
    if (!logs || logs.length === 0) {
      console.log("No logs to process, returning empty array");
      return [];
    }

    console.log("Categories available for processing:", categories.length);

    // Create a lookup for valid categories
    const validCategoryIds = {};
    categories.forEach(cat => {
      validCategoryIds[cat.id] = true;
    });
    console.log("Valid category IDs:", validCategoryIds);

    // Group logs by date
    const dateGroups = {};
    
    // First pass: Initialize days and valid categories
    logs.forEach(log => {
      if (!log.date) {
        console.warn("Log missing date:", log);
        return;
      }
      
      if (!dateGroups[log.date]) {
        dateGroups[log.date] = {
          date: log.date
        };
        
        // Initialize all categories to 0
        categories.forEach(cat => {
          dateGroups[log.date][`category_${cat.id}`] = 0;
        });
      }
    });
    
    console.log("Initialized date groups:", Object.keys(dateGroups).length);
    
    // Second pass: Add time values for logs with valid categories
    logs.forEach(log => {
      if (!log.date || !validCategoryIds[log.category_id]) {
        console.warn("Skipping log due to invalid date or category:", log);
        return;
      }
      
      const categoryKey = `category_${log.category_id}`;
      dateGroups[log.date][categoryKey] = (dateGroups[log.date][categoryKey] || 0) + (log.total_time || 0);
    });

    // Convert to array and sort by date
    const result = Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log("Processed chart data, points count:", result.length);
    if (result.length > 0) {
      console.log("Sample data point:", result[0]);
    }
    
    return result;
  };

  const chartData = processLogsForChart();
  console.log("Final chart data prepared, points:", chartData.length);

  console.log("Rendering Dashboard with state:", { 
    categoryVisibility, 
    expandedCategories,
    leftSidebarOpen,
    rightSidebarOpen
  });

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Toggle Button (Visible when sidebar is closed) */}
      {!leftSidebarOpen && (
        <Button 
          className="sidebar-toggle left-toggle"
          onClick={() => setLeftSidebarOpen(true)}
          aria-label="Open left sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </Button>
      )}
      
      {/* Left Sidebar Component */}
      <LeftSidebar 
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        dateRange={{
          startDate: dateRange.start,
          endDate: dateRange.end
        }}
        onDateRangeChange={(newRange) => {
          console.log("Date range changed in LeftSidebar:", newRange);
          onDateRangeChange({
            start: newRange.startDate,
            end: newRange.endDate
          });
        }}
        presetRange={presetRange}
        onPresetChange={handlePresetChange}
        totalTime={totalTime}
        categories={categories}
      />
      
      {/* Main Content Area */}
      <main className={`main-content ${!leftSidebarOpen && !rightSidebarOpen ? 'full-width' : ''} ${!leftSidebarOpen ? 'left-closed' : ''} ${!rightSidebarOpen ? 'right-closed' : ''}`}>
        <div className="chart-card">
          <h2 className="chart-title">Time Spent Trends</h2>
          {loading ? (
            <div className="chart-loading">
              <div className="spinner"></div>
              <p>Loading chart data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="chart-empty">
              <p>No time data available for the selected period</p>
            </div>
          ) : (
            <TimeSeriesChart
              data={chartData}
              categories={categories}
              categoryVisibility={categoryVisibility}
              expandedCategories={expandedCategories}
            />
          )}
        </div>
      </main>
      
      {/* Right Sidebar Toggle Button (Visible when sidebar is closed) */}
      {!rightSidebarOpen && (
        <Button 
          className="sidebar-toggle right-toggle"
          onClick={() => setRightSidebarOpen(true)}
          aria-label="Open right sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.21 5.23a.75.75 0 01.02-1.06l4.5-4.25a.75.75 0 011.08 0l4.5 4.25a.75.75 0 11-1.04 1.08L12.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25z" clipRule="evenodd" />
          </svg>
        </Button>
      )}
      
      {/* Right Sidebar Component - Only render when visibility state is initialized */}
      {Object.keys(categoryVisibility).length > 0 && (
        <RightSidebar 
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          categories={categories}
          categoryVisibility={categoryVisibility}
          expandedCategories={expandedCategories}
          onToggleExpand={toggleCategoryExpansion}
          onToggleVisibility={toggleCategoryVisibility}
        />
      )}
    </div>
  );
};

export default Dashboard;