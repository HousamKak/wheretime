import React, { useState } from 'react';
import TimeEntryForm from './TimeEntryForm';
import { Button } from './common/Button';
import '../styles/components/leftsidebar.css';

const LeftSidebar = ({ 
  isOpen, 
  onClose, 
  dateRange, 
  onDateRangeChange, 
  presetRange, 
  onPresetChange,
  totalTime,
  categories 
}) => {
  // Add state to track form visibility
  const [isFormVisible, setIsFormVisible] = useState(true);

  // Toggle form visibility
  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  // Format minutes as hours and minutes
  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Calculate daily average (total time / number of days)
  const calculateDailyAverage = () => {
    if (!dateRange.startDate || !dateRange.endDate) return 0;
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const daysDiff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
    return Math.round(totalTime / daysDiff);
  };

  return (
    <aside className={`left-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Time Controls</h2>
        <button 
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close left sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Select Time Period</h3>
          <div className="date-presets">
            <button 
              className={`preset-btn ${presetRange === 'today' ? 'active' : ''}`}
              onClick={() => onPresetChange('today')}
            >
              Today
            </button>
            <button 
              className={`preset-btn ${presetRange === '7days' ? 'active' : ''}`}
              onClick={() => onPresetChange('7days')}
            >
              Last 7 Days
            </button>
            <button 
              className={`preset-btn ${presetRange === '30days' ? 'active' : ''}`}
              onClick={() => onPresetChange('30days')}
            >
              Last 30 Days
            </button>
            <button 
              className={`preset-btn ${presetRange === 'thisMonth' ? 'active' : ''}`}
              onClick={() => onPresetChange('thisMonth')}
            >
              This Month
            </button>
          </div>
          <button 
            className={`preset-btn full-width ${presetRange === 'lastMonth' ? 'active' : ''}`}
            onClick={() => onPresetChange('lastMonth')}
          >
            Last Month
          </button>
          
          <div className="date-range-inputs">
            <div className="form-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => onDateRangeChange({...dateRange, startDate: e.target.value})}
                className="form-input"
                max={dateRange.endDate}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => onDateRangeChange({...dateRange, endDate: e.target.value})}
                className="form-input"
                min={dateRange.startDate}
              />
            </div>
          </div>
        </div>
        
        {/* Time Log Form with toggle button */}
        <div className="sidebar-section log-time-section">
          <div className="log-time-header">
            <h3 className="sidebar-heading">Log Your Time</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFormVisibility}
              className="toggle-form-btn"
            >
              {isFormVisible ? 'Hide Form' : 'Show Form'}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className={`w-5 h-5 ml-1 transform ${isFormVisible ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
          
          {/* Conditionally render the form based on visibility state */}
          {isFormVisible && (
            <div className="time-entry-form-container">
              <TimeEntryForm 
                categories={categories}
                compact={true}
              />
            </div>
          )}
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Time Summary</h3>
          <div className="time-summary-card">
            <div className="time-total">{formatTime(totalTime)}</div>
            <div className="time-period">
              {dateRange.startDate && dateRange.endDate ? 
                `${formatShortDate(dateRange.startDate)} - ${formatShortDate(dateRange.endDate)}` : 
                'No date range selected'}
            </div>
            <div className="time-average">
              Daily Average: {formatTime(calculateDailyAverage())}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Helper function to format dates for display
function formatShortDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default LeftSidebar;
