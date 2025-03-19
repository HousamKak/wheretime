import React from 'react';
import TimeEntryForm from './TimeEntryForm';
import { format, parseISO } from 'date-fns';
import '../styles/components/sidebar.css';

const Sidebar = ({ 
  dateRange,
  totalTime,
  categoryStats,
  categories,
  categoryVisibility,
  onDateRangeChange,
  onToggleCategoryVisibility,
  onPresetChange,
  presetRange,
  handleSuccess
}) => {
  // Format minutes as hours and minutes
  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
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

  // Render date selector
  const renderDateSelector = () => (
    <div className="sidebar-section">
      <h2 className="sidebar-heading">Select Time Period</h2>
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => onPresetChange('today')}
            className={`btn btn-sm ${presetRange === 'today' ? 'btn-primary' : 'btn-outline'}`}
          >
            Today
          </button>
          <button
            onClick={() => onPresetChange('7days')}
            className={`btn btn-sm ${presetRange === '7days' ? 'btn-primary' : 'btn-outline'}`}
          >
            Last 7 Days
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => onPresetChange('30days')}
            className={`btn btn-sm ${presetRange === '30days' ? 'btn-primary' : 'btn-outline'}`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => onPresetChange('thisMonth')}
            className={`btn btn-sm ${presetRange === 'thisMonth' ? 'btn-primary' : 'btn-outline'}`}
          >
            This Month
          </button>
        </div>
        <button
          onClick={() => onPresetChange('lastMonth')}
          className={`btn btn-sm w-full ${presetRange === 'lastMonth' ? 'btn-primary' : 'btn-outline'}`}
        >
          Last Month
        </button>
      </div>

      <div className="space-y-2">
        <div className="form-group mb-2">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
            className="form-input"
            max={dateRange.endDate}
          />
        </div>
        <div className="form-group mb-0">
          <label className="form-label">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
            className="form-input"
            min={dateRange.startDate}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
      </div>
    </div>
  );

  // Render time entry form (compact version for sidebar)
  const renderTimeEntryForm = () => (
    <div className="sidebar-section">
      <TimeEntryForm
        categories={categories}
        onSuccess={handleSuccess}
        compact={true}
      />
    </div>
  );

  // Render stats summary
  const renderStatsSummary = () => {
    const { rootCategories, childrenMap } = groupCategoryStats();

    return (
      <div className="sidebar-section">
        <h2 className="sidebar-heading">Time Summary</h2>
        <div className="text-center mb-4">
          <div className="text-xl font-bold">{formatTime(totalTime)}</div>
          <div className="text-sm text-gray-500">
            {format(parseISO(dateRange.startDate), 'MMM d, yyyy')} - {format(parseISO(dateRange.endDate), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="text-sm mb-2">Daily Average: {formatTime(Math.round(totalTime / Math.max(1, 
          (new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24) + 1
        )))}</div>
        
      </div>
    );
  };

  // Render category to
  return (
    <div className="dashboard-sidebar">
      {renderDateSelector()}
      {renderTimeEntryForm()}
      {renderStatsSummary()}
    </div>
  );
};

export default Sidebar;