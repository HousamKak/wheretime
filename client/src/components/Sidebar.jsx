import React from 'react';
import TimeEntryForm from './TimeEntryForm';
import { format, parseISO } from 'date-fns';

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
          <label className="form-label text-sm">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
            className="form-input"
            max={dateRange.endDate}
          />
        </div>
        <div className="form-group mb-0">
          <label className="form-label text-sm">End Date</label>
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
    
    // Calculate date range for display
    const days = Math.max(1, 
      Math.round((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1
    );
    const dailyAverage = Math.round(totalTime / days);

    return (
      <div className="sidebar-section">
        <h2 className="sidebar-heading">Time Summary</h2>
        
        <div className="time-summary-card p-4 rounded-lg bg-primary-50 mb-4">
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-primary-700">{formatTime(totalTime)}</div>
            <div className="text-sm text-primary-600 font-medium mt-1">
              {format(parseISO(dateRange.startDate), 'MMM d, yyyy')} - {format(parseISO(dateRange.endDate), 'MMM d, yyyy')}
            </div>
          </div>

          <div className="flex justify-between items-center bg-white rounded-md p-2 text-sm">
            <span className="text-gray-600">Daily Average:</span>
            <span className="font-semibold text-gray-800">{formatTime(dailyAverage)}</span>
          </div>
        </div>

        <h3 className="font-medium text-sm mb-3 text-gray-700">Category Breakdown</h3>

        {rootCategories.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 italic text-sm">No data for the selected period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rootCategories.map(category => {
              const children = childrenMap[category.id] || [];

              return (
                <div key={category.id} className="sidebar-category bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-2 border-l-4" style={{ borderLeftColor: category.color }}>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatTime(category.totalTime)}</div>
                      <div className="text-xs text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    ></div>
                  </div>

                  {children.length > 0 && (
                    <div className="px-3 py-1 bg-gray-50 border-t border-gray-200">
                      {children.map(child => (
                        <div key={child.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center">
                            <span
                              className="inline-block w-1.5 h-1.5 mr-1.5 rounded-full"
                              style={{ backgroundColor: child.color }}
                            ></span>
                            <span className="text-xs">{child.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium">{formatTime(child.totalTime)}</div>
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
    );
  };

  // Render category toggles
  const renderCategoryToggles = () => (
    <div className="sidebar-section">
      <h2 className="sidebar-heading">Toggle Categories</h2>
      <div className="grid grid-cols-1 gap-1">
        {categories
          .filter(category => !category.parent_id)
          .map(category => (
            <div key={category.id} className="flex items-center p-2 rounded hover:bg-gray-50">
              <label className="flex items-center cursor-pointer space-x-2 text-sm w-full">
                <input
                  type="checkbox"
                  checked={categoryVisibility[category.id] !== false}
                  onChange={() => onToggleCategoryVisibility(category.id)}
                  className="form-checkbox"
                />
                <span
                  className="inline-block w-3 h-3 rounded-full ml-1"
                  style={{ backgroundColor: category.color }}
                ></span>
                <span className="ml-1">{category.name}</span>
              </label>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-sidebar">
      {renderDateSelector()}
      {renderTimeEntryForm()}
      {renderStatsSummary()}
      {renderCategoryToggles()}
    </div>
  );
};

export default Sidebar;