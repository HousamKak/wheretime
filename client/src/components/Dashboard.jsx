import React, { useState, useEffect, useMemo } from 'react';
import TimeSeriesChart from './TimeSeriesChart';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import CategoryCharts from './CategoryCharts';
import '../styles/components/dashboard.css';
import '../styles/components/categorycharts.css';
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
  const [dataError, setDataError] = useState(null);

  // Create a map of child categories by parent ID for quick lookup
  const childrenByParent = useMemo(() => {
    const result = {};
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (!result[cat.parent_id]) {
          result[cat.parent_id] = [];
        }
        result[cat.parent_id].push(cat);
      }
    });
    return result;
  }, [categories]);

  // Initialize category visibility state with useMemo to handle async loading
  const initialCategoryVisibility = useMemo(() => {
    console.log("Initializing category visibility state with:", categories.length, "categories");
    const result = categories.reduce((acc, category) => {
      acc[category.id] = false;
      return acc;
    }, {});
    console.log("Initial category visibility state:", result);
    return result;
  }, [categories]);

  // Initialize expanded categories state
  const initialExpandedCategories = useMemo(() => {
    console.log("Initializing expanded categories state with:", categories.length, "categories");

    // Initialize expansion state 
    const result = categories.reduce((acc, category) => {
      if (!category.parent_id) { // Root category
        // Auto-expand root categories with children
        const hasChildren = childrenByParent[category.id] && childrenByParent[category.id].length > 0;
        acc[category.id] = hasChildren; // Set to true if it has children
      }
      return acc;
    }, {});

    console.log("Initial expanded categories state:", result);
    return result;
  }, [categories, childrenByParent]);

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
  const totalTime = stats.reduce((total, stat) => {
    // The API likely uses snake_case (total_time) instead of camelCase (totalTime)
    const timeValue = stat.total_time || stat.totalTime || stat.time || 0;
    return total + timeValue;
  }, 0);

  console.log("Calculated total time:", totalTime, "minutes from", stats.length, "stats");

  // Process logs data for the chart
  const processLogsForChart = () => {
    try {
      console.log("Processing logs for chart, logs count:", logs?.length || 0);

      if (!logs || logs.length === 0) {
        console.log("No logs to process, returning empty array");
        return [];
      }

      console.log("Categories available for processing:", categories.length);

      // Create a lookup for valid categories
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat;
      });
      console.log("Valid category IDs:", Object.keys(categoryMap));

      // Group logs by date
      const dateGroups = {};

      // First pass: Initialize days
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

      // Second pass: Add time values for logs
      logs.forEach(log => {
        if (!log.date) return;

        const categoryId = log.category_id;

        if (!categoryMap[categoryId]) {
          // Try to find parent category if this is a subcategory not directly in our list
          const parentCategory = categories.find(cat =>
            cat.children && cat.children.some(child => child.id === categoryId)
          );

          if (parentCategory) {
            // Add to parent category's time
            const parentKey = `category_${parentCategory.id}`;
            dateGroups[log.date][parentKey] = (dateGroups[log.date][parentKey] || 0) + (log.total_time || 0);
            console.log(`Mapped subcategory ${categoryId} to parent ${parentCategory.id}`);
          } else {
            console.warn(`Cannot find category with ID ${categoryId} - skipping log`);
          }
          return;
        }

        // Category exists in our map, add the time
        const categoryKey = `category_${categoryId}`;
        dateGroups[log.date][categoryKey] = (dateGroups[log.date][categoryKey] || 0) + (log.total_time || 0);
      });

      // Convert to array and sort by date
      const result = Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
      console.log("Processed chart data, points count:", result.length);

      return result;
    } catch (error) {
      console.error("Error processing chart data:", error);
      setDataError("Failed to process time data. There may be an issue with your logs or categories.");
      return [];
    }
  };

  const chartData = processLogsForChart();

  // Render data error if present
  const renderDataError = () => {
    if (!dataError) return null;

    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
        <h3 className="font-medium mb-1">Data Processing Error</h3>
        <p>{dataError}</p>
        <button
          onClick={() => setDataError(null)}
          className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
        >
          Dismiss
        </button>
      </div>
    );
  };

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
        {renderDataError()}

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

        {/* Add Category Charts component */}
        {!loading && chartData.length > 0 && (
          <CategoryCharts
            data={chartData}
            categories={categories}
            categoryVisibility={categoryVisibility}
            expandedCategories={expandedCategories}
            onToggleVisibility={toggleCategoryVisibility}
          />
        )}
      </main>

      {/* Right Sidebar Toggle Button (Visible when sidebar is closed) */}
      {!rightSidebarOpen && (
        <Button
          className="sidebar-toggle right-toggle"
          onClick={() => setRightSidebarOpen(true)}
          aria-label="Open right sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
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