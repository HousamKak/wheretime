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

        <h3 className="font-medium text-sm mt-4 mb-2">Category Breakdown</h3>

        {rootCategories.length === 0 ? (
          <p className="text-gray-500 italic text-sm">No data for the selected period</p>
        ) : (
          <div className="space-y-2">
            {rootCategories.map(category => {
              const children = childrenMap[category.id] || [];

              return (
                <div key={category.id} className="sidebar-category">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span
                        className="inline-block w-2 h-2 mr-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold">{formatTime(category.totalTime)}</div>
                      <div className="text-xs text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>

                  {children.length > 0 && (
                    <div className="pl-3 mt-1 border-l border-gray-200">
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
            <div key={category.id} className="flex items-center">
              <label className="flex items-center cursor-pointer space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={categoryVisibility[category.id] !== false}
                  onChange={() => onToggleCategoryVisibility(category.id)}
                  className="form-checkbox"
                />
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></span>
                <span>{category.name}</span>
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