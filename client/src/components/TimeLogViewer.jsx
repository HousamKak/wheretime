import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TimeLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    categoryId: ''
  });
  
  // Form for editing logs
  const [logForm, setLogForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
    totalTime: 0,
    notes: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    date: '',
    categoryId: '',
    totalTime: '',
    general: ''
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories?flat=true`);
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      }
    };

    fetchCategories();
  }, []);

  // Fetch logs when filters or categories change
  useEffect(() => {
    const fetchLogs = async () => {
      if (categories.length === 0) return;
      
      setIsLoading(true);
      try {
        const params = {
          start_date: filters.startDate,
          end_date: filters.endDate
        };
        
        if (filters.categoryId) {
          params.category_id = filters.categoryId;
        }
        
        const response = await axios.get(`${API_URL}/logs`, { params });
        setLogs(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching time logs:', err);
        setError('Failed to load time logs. Please try again later.');
        setIsLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchLogs();
    }
  }, [categories, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for the edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setLogForm(prev => ({
      ...prev,
      [name]: name === 'totalTime' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Format time as hours and minutes
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Convert hours and minutes to total minutes
  const hoursMinutesToMinutes = (hours, minutes) => {
    return (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  };

  // Start editing a log
  const handleEdit = (log) => {
    setEditingLog(log);
    setLogForm({
      date: log.date,
      categoryId: log.category_id,
      totalTime: log.total_time,
      notes: log.notes || ''
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingLog(null);
    setFormErrors({
      date: '',
      categoryId: '',
      totalTime: '',
      general: ''
    });
  };

  // Validate form before submission
  const validateForm = () => {
    let valid = true;
    const errors = {
      date: '',
      categoryId: '',
      totalTime: '',
      general: ''
    };
    
    if (!logForm.date) {
      errors.date = 'Date is required';
      valid = false;
    }
    
    if (!logForm.categoryId) {
      errors.categoryId = 'Category is required';
      valid = false;
    }
    
    if (logForm.totalTime < 0) {
      errors.totalTime = 'Time must be a positive number';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };

  // Save edited log
  const handleSaveEdit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      await axios.post(`${API_URL}/logs`, {
        category_id: logForm.categoryId,
        date: logForm.date,
        total_time: logForm.totalTime,
        notes: logForm.notes
      });
      
      // Refresh logs
      const params = {
        start_date: filters.startDate,
        end_date: filters.endDate
      };
      
      if (filters.categoryId) {
        params.category_id = filters.categoryId;
      }
      
      const response = await axios.get(`${API_URL}/logs`, { params });
      setLogs(response.data);
      
      // Close edit form
      setEditingLog(null);
    } catch (err) {
      console.error('Error saving time log:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setFormErrors(prev => ({
          ...prev,
          general: err.response.data.error
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          general: 'Failed to save time log. Please try again.'
        }));
      }
    }
  };

  // Delete a log
  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this time log?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/logs/${logId}`);
      
      // Refresh logs
      const params = {
        start_date: filters.startDate,
        end_date: filters.endDate
      };
      
      if (filters.categoryId) {
        params.category_id = filters.categoryId;
      }
      
      const response = await axios.get(`${API_URL}/logs`, { params });
      setLogs(response.data);
    } catch (err) {
      console.error('Error deleting time log:', err);
      setError('Failed to delete time log. Please try again later.');
    }
  };

  // Group logs by date for display
  const groupLogsByDate = () => {
    const grouped = {};
    
    logs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    
    // Sort dates in descending order (newest first)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        logs: grouped[date]
      }));
  };

  const groupedLogs = groupLogsByDate();

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-lg font-semibold">Error</h2>
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Time Log History</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Filter Logs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="border rounded p-2 w-full"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Time Logs */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Time Logs</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : groupedLogs.length === 0 ? (
          <p className="text-gray-500 italic">No time logs found for the selected filters.</p>
        ) : (
          <div>
            {groupedLogs.map(group => (
              <div key={group.date} className="mb-6">
                <h3 className="text-md font-semibold mb-2 bg-gray-100 p-2 rounded">
                  {format(new Date(group.date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.logs.map(log => (
                        <tr key={log.id}>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: log.category_color }}
                              ></span>
                              <span>{log.category_name}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {formatTime(log.total_time)}
                          </td>
                          <td className="p-3">
                            {log.notes || <span className="text-gray-400 italic">No notes</span>}
                          </td>
                          <td className="p-3 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleEdit(log)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Time Log</h2>
            
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {formErrors.general}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={logForm.date}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="categoryId"
                value={logForm.categoryId}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {formErrors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.categoryId}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent
              </label>
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={Math.floor(logForm.totalTime / 60)}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value) || 0;
                      const minutes = logForm.totalTime % 60;
                      setLogForm(prev => ({
                        ...prev,
                        totalTime: hoursMinutesToMinutes(hours, minutes)
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={logForm.totalTime % 60}
                    onChange={(e) => {
                      const hours = Math.floor(logForm.totalTime / 60);
                      const minutes = parseInt(e.target.value) || 0;
                      setLogForm(prev => ({
                        ...prev,
                        totalTime: hoursMinutesToMinutes(hours, minutes)
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {formErrors.totalTime && (
                <p className="mt-1 text-sm text-red-600">{formErrors.totalTime}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={logForm.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Add any notes about this time entry"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeLogViewer;