import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { fetchLogs, deleteLog } from '../services/timeLogService';
import { format, parseISO } from 'date-fns';
import AdminTable from '../components/common/AdminTable';
import FilterBar from '../components/common/FilterBar';
import TimeEntryForm from '../components/TimeEntryForm';
import TimeLogFormModal from '../components/TimeLogFormModal';
import { Alert } from '../components/common/Alert';
import { formatTime } from '../utils/timeUtils';
import '../styles/pages/adminpages.css';

const LogsPage = () => {
  const { categories } = useApp();
  
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Filtering state
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Fetch logs when filters change
  useEffect(() => {
    fetchTimeData();
  }, [dateRange, filters.category_id]);
  
  // Fetch time logs from the server
  const fetchTimeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      };
      
      if (filters.category_id) {
        queryParams.category_id = filters.category_id;
      }
      
      const data = await fetchLogs(queryParams);
      setLogs(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load time logs. Please try again.');
      setLoading(false);
    }
  };
  
  // Process logs for display when search term changes
  const displayLogs = useMemo(() => {
    if (!logs) return [];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return logs.filter(log => {
        const categoryName = log.category_name?.toLowerCase() || '';
        const notes = log.notes?.toLowerCase() || '';
        const date = log.date || '';
        
        return (
          categoryName.includes(search) ||
          notes.includes(search) ||
          date.includes(search)
        );
      });
    }
    
    return logs;
  }, [logs, searchTerm]);
  
  // Get category info for a log
  const getCategoryInfo = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return { name: 'Unknown', color: '#6b7280', isChild: false, parentName: null };
    
    const isChild = category.parent_id !== null;
    let parentName = null;
    
    if (isChild) {
      const parent = categories.find(c => c.id === category.parent_id);
      parentName = parent ? parent.name : null;
    }
    
    return {
      name: category.name,
      color: category.color || '#6b7280',
      isChild,
      parentName
    };
  };
  
  // Table columns configuration
  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      width: '140px',
      cellClassName: 'log-date-cell',
      render: (row) => {
        const date = parseISO(row.date);
        return format(date, 'MMM d, yyyy');
      }
    },
    {
      key: 'category_name',
      label: 'Category',
      sortable: true,
      render: (row) => {
        const categoryInfo = getCategoryInfo(row.category_id);
        
        return (
          <div className="log-category-cell">
            <span 
              className="log-category-color"
              style={{ backgroundColor: row.category_color || categoryInfo.color }}
            ></span>
            <span>{row.category_name || categoryInfo.name}</span>
            
            {categoryInfo.isChild && categoryInfo.parentName && (
              <span className="log-parent-category">
                in {categoryInfo.parentName}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'total_time',
      label: 'Time Spent',
      sortable: true,
      width: '140px',
      cellClassName: 'log-time-cell',
      render: (row) => formatTime(row.total_time, true)
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: false,
      render: (row) => {
        if (!row.notes) return <span className="text-gray-400">No notes</span>;
        
        return (
          <div className={`log-notes-cell ${row.notes ? 'has-notes' : ''}`}>
            <div className="log-notes-content">{row.notes}</div>
            {row.notes && (
              <div className="log-notes-tooltip">{row.notes}</div>
            )}
          </div>
        );
      }
    }
  ];
  
  // Build filter options from categories
  const buildCategoryFilterOptions = () => {
    // Group categories by parent
    const rootCategories = categories.filter(cat => !cat.parent_id);
    const childrenMap = {};
    
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (!childrenMap[cat.parent_id]) {
          childrenMap[cat.parent_id] = [];
        }
        childrenMap[cat.parent_id].push(cat);
      }
    });
    
    // Create options with hierarchy
    const options = [
      { value: '', label: 'All Categories' }
    ];
    
    // Add root categories
    rootCategories.forEach(parent => {
      options.push({
        value: parent.id.toString(),
        label: parent.name
      });
      
      // Add children with indentation
      const children = childrenMap[parent.id] || [];
      children.forEach(child => {
        options.push({
          value: child.id.toString(),
          label: `— ${child.name}`
        });
      });
    });
    
    return options;
  };
  
  // Filter options
  const filterOptions = [
    {
      id: 'category_id',
      label: 'Filter by Category',
      options: buildCategoryFilterOptions()
    },
    {
      id: 'date_preset',
      label: 'Date Range',
      options: [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'last30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' }
      ]
    }
  ];
  
  // Bulk actions
  const bulkActions = [
    {
      id: 'delete',
      label: 'Delete Selected',
      destructive: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
      )
    }
  ];
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    // Handle date presets
    if (newFilters.date_preset !== filters.date_preset) {
      if (newFilters.date_preset) {
        const today = new Date();
        let startDate, endDate;
        
        switch (newFilters.date_preset) {
          case 'today':
            startDate = format(today, 'yyyy-MM-dd');
            endDate = format(today, 'yyyy-MM-dd');
            break;
            
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            startDate = format(yesterday, 'yyyy-MM-dd');
            endDate = format(yesterday, 'yyyy-MM-dd');
            break;
            
          case 'last7days':
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 6);
            startDate = format(last7Days, 'yyyy-MM-dd');
            endDate = format(today, 'yyyy-MM-dd');
            break;
            
          case 'last30days':
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 29);
            startDate = format(last30Days, 'yyyy-MM-dd');
            endDate = format(today, 'yyyy-MM-dd');
            break;
            
          case 'thisMonth':
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
            endDate = format(today, 'yyyy-MM-dd');
            break;
            
          case 'lastMonth':
            const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            startDate = format(firstDayOfLastMonth, 'yyyy-MM-dd');
            endDate = format(lastDayOfLastMonth, 'yyyy-MM-dd');
            break;
            
          case 'custom':
            // Keep current date range for custom
            break;
            
          default:
            // Keep current date range if unrecognized
            break;
        }
        
        if (startDate && endDate && newFilters.date_preset !== 'custom') {
          setDateRange({ startDate, endDate });
        }
      }
    }
    
    // Extract and convert category ID if present
    const categoryId = newFilters.category_id ? parseInt(newFilters.category_id) : null;
    
    setFilters({
      ...newFilters,
      category_id: categoryId
    });
  };
  
  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  
  // Reset filters and search
  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
    
    // Reset date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    
    setDateRange({
      startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    });
  };
  
  // Handle bulk actions
  const handleBulkAction = async (actionId) => {
    if (actionId === 'delete' && selectedRows.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedRows.length} time logs? This cannot be undone.`)) {
        try {
          setLoading(true);
          setError(null);
          
          // Delete logs one by one
          for (const logId of selectedRows) {
            await deleteLog(logId);
          }
          
          // Refresh data
          await fetchTimeData();
          setSelectedRows([]);
          setSuccess(`Successfully deleted ${selectedRows.length} time logs.`);
        } catch (err) {
          setError('Failed to delete some time logs. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }
  };
  
  // Toggle time entry form visibility
  const toggleTimeEntryForm = () => {
    setIsFormVisible(!isFormVisible);
  };
  
  // Open modal to edit time log
  const handleEdit = (log) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };
  
  // Handle time log deletion
  const handleDelete = (log) => {
    setConfirmDelete(log);
  };
  
  // Confirm time log deletion
  const confirmDeleteLog = async () => {
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      await deleteLog(confirmDelete.id);
      
      // Refresh logs
      await fetchTimeData();
      
      setSuccess(`Time log deleted successfully.`);
      setConfirmDelete(null);
    } catch (err) {
      setError(`Failed to delete time log: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle successful time log creation or update
  const handleTimeEntrySuccess = async () => {
    setSuccess('Time log saved successfully.');
    
    // Refresh logs
    await fetchTimeData();
    
    // Keep form open for additional entries
  };
  
  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  return (
    <div className="admin-page logs-admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Time Logs</h1>
        <p className="admin-page-description">
          View and manage your time logs across different categories.
        </p>
      </div>
      
      {/* Alert messages */}
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <Alert 
          type="success" 
          message={success} 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      {/* Time Entry Form */}
      <div className="time-entry-form-card">
        <div className="time-entry-form-header">
          <h2 className="time-entry-form-title">Log Your Time</h2>
          <button 
            className="time-entry-form-toggle"
            onClick={toggleTimeEntryForm}
          >
            {isFormVisible ? 'Hide Form' : 'Show Form'}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`w-5 h-5 time-entry-form-toggle-icon ${isFormVisible ? 'rotate' : ''}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {isFormVisible && (
          <div className="time-entry-form-content">
            <TimeEntryForm 
              categories={categories}
              onSuccess={handleTimeEntrySuccess}
              compact={false}
              defaultDate={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        )}
      </div>
      
      {/* Filter bar */}
      <FilterBar 
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        searchPlaceholder="Search time logs..."
        createButtonLabel="Add New Log"
        onCreateClick={() => {
          if (!isFormVisible) {
            toggleTimeEntryForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        selectedCount={selectedRows.length}
        bulkActions={bulkActions}
        onBulkActionClick={handleBulkAction}
      />
      
      {/* Date range picker for custom range */}
      {filters.date_preset === 'custom' && (
        <div className="date-range-picker">
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                type="date"
                id="start-date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="form-input"
                max={dateRange.endDate}
              />
            </div>
            
            <div className="date-input-group">
              <label htmlFor="end-date">End Date</label>
              <input
                type="date"
                id="end-date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="form-input"
                min={dateRange.startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <button
              className="apply-date-btn"
              onClick={fetchTimeData}
            >
              Apply
            </button>
          </div>
        </div>
      )}
      
      {/* Time logs table */}
      <AdminTable 
        columns={columns}
        data={displayLogs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelectionChange={setSelectedRows}
        loading={loading}
      />
      
      {/* Time log edit modal */}
      {isModalOpen && (
        <TimeLogFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={async () => {
            await fetchTimeData();
            setIsModalOpen(false);
            setEditingLog(null);
            setSuccess('Time log updated successfully.');
          }}
          log={editingLog}
          categories={categories}
        />
      )}
      
      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-dialog">
            <div className="delete-confirmation-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="delete-icon">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
              </svg>
              <h2>Delete Time Log</h2>
            </div>
            
            <div className="delete-confirmation-content">
              <p>
                Are you sure you want to delete the time log for <strong>{confirmDelete.category_name}</strong> on <strong>{format(parseISO(confirmDelete.date), 'MMMM d, yyyy')}</strong>?
              </p>
              
              <p className="delete-confirmation-note">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="delete-confirmation-footer">
              <button 
                className="cancel-btn"
                onClick={() => setConfirmDelete(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={confirmDeleteLog}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;