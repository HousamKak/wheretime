import React, { useState } from 'react';
import '../../styles/components/filterbar.css';

export const FilterBar = ({ 
  filters = [], 
  onFilterChange, 
  onSearch,
  onReset,
  searchPlaceholder = "Search...",
  showCreateButton = true,
  createButtonLabel = "Create New",
  onCreateClick,
  selectedCount = 0,
  bulkActions = [],
  onBulkActionClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filterId, value) => {
    const newFilters = { ...activeFilters, [filterId]: value };
    
    // Remove empty filters
    if (value === '' || value === null || value === undefined) {
      delete newFilters[filterId];
    }
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  // Handle reset filters
  const handleReset = () => {
    setActiveFilters({});
    setSearchTerm('');
    
    if (onReset) {
      onReset();
    }
  };
  
  // Toggle bulk actions visibility
  const toggleBulkActions = () => {
    setShowBulkActions(!showBulkActions);
  };
  
  return (
    <div className="filter-bar">
      <div className="filter-bar-content">
        <div className="filter-bar-left">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="filter-search-form">
            <div className="filter-search-input-wrapper">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="filter-search-input"
              />
              <button type="submit" className="filter-search-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
          
          {/* Dropdown filters */}
          <div className="filter-dropdowns">
            {filters.map(filter => (
              <div key={filter.id} className="filter-dropdown-wrapper">
                <select
                  value={activeFilters[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  className="filter-dropdown-select"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            
            {/* Reset filters button */}
            {Object.keys(activeFilters).length > 0 && (
              <button 
                onClick={handleReset}
                className="filter-reset-button"
                title="Reset filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="filter-bar-right">
          {/* Bulk actions for selected items */}
          {selectedCount > 0 && bulkActions.length > 0 && (
            <div className="filter-bulk-actions-wrapper">
              <button 
                className="filter-bulk-actions-toggle"
                onClick={toggleBulkActions}
              >
                Bulk Actions ({selectedCount})
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 filter-bulk-toggle-icon ${showBulkActions ? 'rotate' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showBulkActions && (
                <div className="filter-bulk-actions-dropdown">
                  {bulkActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => onBulkActionClick && onBulkActionClick(action.id)}
                      className={`filter-bulk-action-btn ${action.destructive ? 'destructive' : ''}`}
                    >
                      {action.icon && (
                        <span className="filter-bulk-action-icon">{action.icon}</span>
                      )}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Create new button */}
          {showCreateButton && (
            <button 
              className="filter-create-button"
              onClick={onCreateClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              {createButtonLabel}
            </button>
          )}
        </div>
      </div>
      
      {/* Active filters chips display */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="filter-active-filters">
          <div className="filter-active-label">Active filters:</div>
          <div className="filter-chips">
            {Object.entries(activeFilters).map(([filterId, value]) => {
              const filter = filters.find(f => f.id === filterId);
              if (!filter) return null;
              
              const option = filter.options.find(o => o.value === value);
              if (!option) return null;
              
              return (
                <div key={filterId} className="filter-chip">
                  <span className="filter-chip-label">
                    {filter.label}: {option.label}
                  </span>
                  <button 
                    className="filter-chip-remove"
                    onClick={() => handleFilterChange(filterId, '')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              );
            })}
            
            <button 
              className="filter-clear-all"
              onClick={handleReset}
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;