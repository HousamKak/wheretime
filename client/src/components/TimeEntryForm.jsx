import React, { useState } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import '../styles/components/timeentryform.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TimeEntryForm = ({ categories, onSuccess, compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(!compact); // If compact, start collapsed
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
    hours: 0,
    minutes: 0,
    notes: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    date: '',
    categoryId: '',
    time: '',
    general: ''
  });

  // Toggle form visibility
  const toggleForm = () => {
    setFormVisible(!formVisible);
    
    // Reset form when closing
    if (formVisible) {
      resetForm();
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      categoryId: '',
      hours: 0,
      minutes: 0,
      notes: ''
    });
    
    setFormErrors({
      date: '',
      categoryId: '',
      time: '',
      general: ''
    });
    
    setError(null);
    setSuccessMessage(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for numeric inputs
    if (name === 'hours' || name === 'minutes') {
      // Ensure the value is a valid number
      const numValue = parseInt(value) || 0;
      
      // Ensure minutes are between 0 and 59
      const sanitizedValue = name === 'minutes' 
        ? Math.min(Math.max(numValue, 0), 59) 
        : Math.max(numValue, 0);
      
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (name === 'hours' || name === 'minutes') {
      setFormErrors(prev => ({
        ...prev,
        time: ''
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    let valid = true;
    const errors = {
      date: '',
      categoryId: '',
      time: '',
      general: ''
    };
    
    if (!formData.date) {
      errors.date = 'Date is required';
      valid = false;
    }
    
    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category';
      valid = false;
    }
    
    const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
    if (totalMinutes <= 0) {
      errors.time = 'Please enter a valid time (at least 1 minute)';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Calculate total minutes
      const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
      
      // Send data to API
      await axios.post(`${API_URL}/logs`, {
        category_id: formData.categoryId,
        date: formData.date,
        total_time: totalMinutes,
        notes: formData.notes.trim() || null
      });
      
      // Show success message
      setSuccessMessage('Time entry saved successfully!');
      
      // Reset form after successful submission
      setFormData({
        date: formData.date, // Keep the same date for quick consecutive entries
        categoryId: formData.categoryId, // Keep the same category for quick entries
        hours: 0,
        minutes: 0,
        notes: ''
      });
      
      // Notify parent component about the success
      if (onSuccess) {
        onSuccess();
      }
      
      // Hide success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving time entry:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save time entry. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group categories by parent for display
  const groupCategoriesByParent = () => {
    const parentCategories = categories.filter(category => !category.parent_id);
    const childrenMap = {};
    
    categories.forEach(category => {
      if (category.parent_id) {
        if (!childrenMap[category.parent_id]) {
          childrenMap[category.parent_id] = [];
        }
        childrenMap[category.parent_id].push(category);
      }
    });
    
    return { parentCategories, childrenMap };
  };

  // Render the component with appropriate styling based on compact mode
  return (
    <div className={compact ? "" : "card"}>
      {compact ? (
        <div className="sidebar-section-header">
          <div className="flex items-center justify-between mb-3">
            <h2 className="sidebar-heading m-0">Log Your Time</h2>
            <button
              onClick={toggleForm}
              className={`btn btn-sm ${formVisible ? 'btn-outline' : 'btn-primary'}`}
            >
              {formVisible ? 'Hide Form' : 'Add Entry'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="card-title">Log Your Time</h2>
            <button
              onClick={toggleForm}
              className={`btn btn-sm ${formVisible ? 'btn-outline' : 'btn-primary'}`}
            >
              {formVisible ? 'Hide Form' : 'Add Time Entry'}
            </button>
          </div>
        </div>
      )}
      
      {formVisible && (
        <div className={compact ? "" : "card-content"}>
          {error && (
            <div className="alert alert-error mb-4">
              <div className="alert-content">
                <p>{error}</p>
              </div>
              <button 
                className="alert-dismiss"
                onClick={() => setError(null)}
              >
                &times;
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success mb-4">
              <div className="alert-content">
                <p>{successMessage}</p>
              </div>
              <button 
                className="alert-dismiss"
                onClick={() => setSuccessMessage(null)}
              >
                &times;
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={`${isLoading ? 'form-loading' : ''}`}>
            <div className={`${compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"}`}>
              {/* Date Selection */}
              <div className="form-group mb-3">
                <label className="form-label text-sm">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.date ? 'border-red-500' : ''}`}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
                {formErrors.date && (
                  <p className="form-error">{formErrors.date}</p>
                )}
              </div>
              
              {/* Category Selection */}
              <div className="form-group mb-3">
                <label className="form-label text-sm">
                  Category
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className={`form-select ${formErrors.categoryId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a category</option>
                  
                  {/* Render categories with option groups */}
                  {(() => {
                    const { parentCategories, childrenMap } = groupCategoriesByParent();
                    
                    return parentCategories.map(parent => {
                      const children = childrenMap[parent.id] || [];
                      
                      if (children.length === 0) {
                        return (
                          <option key={parent.id} value={parent.id}>
                            {parent.name}
                          </option>
                        );
                      }
                      
                      return (
                        <optgroup key={parent.id} label={parent.name}>
                          <option value={parent.id}>
                            {parent.name} (General)
                          </option>
                          
                          {children.map(child => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    });
                  })()}
                </select>
                {formErrors.categoryId && (
                  <p className="form-error">{formErrors.categoryId}</p>
                )}
              </div>
            </div>
            
            {/* Time Entry */}
            <div className="form-group mb-3">
              <label className="form-label text-sm">
                Time Spent
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">Hours</span>
                    </div>
                    <input
                      type="number"
                      name="hours"
                      value={formData.hours}
                      onChange={handleInputChange}
                      min="0"
                      className={`form-input ${formErrors.time ? 'border-red-500' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">Minutes</span>
                    </div>
                    <input
                      type="number"
                      name="minutes"
                      value={formData.minutes}
                      onChange={handleInputChange}
                      min="0"
                      max="59"
                      className={`form-input ${formErrors.time ? 'border-red-500' : ''}`}
                    />
                  </div>
                </div>
              </div>
              {formErrors.time && (
                <p className="form-error">{formErrors.time}</p>
              )}
            </div>
            
            {/* Notes - Hide in compact mode */}
            {!compact && (
              <div className="form-group mb-4">
                <label className="form-label">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="form-textarea"
                  placeholder="Add any notes about this time entry"
                ></textarea>
              </div>
            )}
            
            {/* Submit Button */}
            <div className={compact ? "" : "flex justify-end"}>
              <button
                type="submit"
                disabled={isLoading}
                className={`btn ${compact ? 'w-full' : ''} btn-primary`}
              >
                {isLoading ? 'Saving...' : 'Save Time Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TimeEntryForm;