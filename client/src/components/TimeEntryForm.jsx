import React, { useState, useEffect } from 'react';
import { saveLog } from '../services/timeLogService';
import { Alert } from './common/Alert';
import { format } from 'date-fns';
import '../styles/components/form.css';

const TimeEntryForm = ({ 
  categories = [], 
  onSuccess, 
  compact = false,
  defaultDate = format(new Date(), 'yyyy-MM-dd')
}) => {
  // Form state
  const [formData, setFormData] = useState({
    date: defaultDate,
    categoryId: '',
    hours: 0,
    minutes: 0,
    notes: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  
  // Update form date when defaultDate changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: defaultDate
    }));
  }, [defaultDate]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Special handling for numeric inputs
    if (name === 'hours' || name === 'minutes') {
      // Ensure the value is a valid number
      let numValue = parseInt(value) || 0;
      
      // Ensure minutes are between 0 and 59
      if (name === 'minutes') {
        numValue = Math.min(Math.max(numValue, 0), 59);
      } else {
        numValue = Math.max(numValue, 0);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear error related to time fields
    if ((name === 'hours' || name === 'minutes') && formErrors.time) {
      setFormErrors(prev => ({
        ...prev,
        time: ''
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category';
    }
    
    const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
    if (totalMinutes <= 0) {
      errors.time = 'Please enter a valid time (at least 1 minute)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitMessage(null);
      
      // Calculate total minutes
      const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
      
      // Prepare data for submission
      const timeLogData = {
        category_id: parseInt(formData.categoryId),
        date: formData.date,
        total_time: totalMinutes,
        notes: formData.notes.trim() || null
      };
      
      // Send data to API
      const result = await saveLog(timeLogData);
      
      // Show success message
      setSubmitStatus('success');
      setSubmitMessage(result.created 
        ? 'Time entry created successfully!' 
        : 'Time entry updated successfully!');
      
      // Reset form fields except date and category
      setFormData({
        date: formData.date, // Keep the date for consecutive entries
        categoryId: formData.categoryId, // Keep the category for consecutive entries
        hours: 0,
        minutes: 0,
        notes: ''
      });
      
      // Notify parent component
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Auto-hide success message after a delay
      setTimeout(() => {
        setSubmitMessage(null);
        setSubmitStatus(null);
      }, 5000);
    } catch (err) {
      console.error('Error saving time entry:', err);
      
      // Show error message
      setSubmitStatus('error');
      setSubmitMessage(
        err.message || 'Failed to save time entry. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
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
  
  const { parentCategories, childrenMap } = groupCategoriesByParent();
  
  return (
    <div className={`time-entry-form ${compact ? 'compact' : ''}`}>
      {submitMessage && (
        <Alert 
          type={submitStatus} 
          message={submitMessage} 
          onDismiss={() => {
            setSubmitMessage(null);
            setSubmitStatus(null);
          }}
          className="mb-4"
        />
      )}
      
      <form onSubmit={handleSubmit} className={isSubmitting ? 'form-loading' : ''}>
        <div className="time-fields-grid">
          {/* Date Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="date">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`form-input ${formErrors.date ? 'form-input-error' : ''}`}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            {formErrors.date && (
              <p className="form-error-text">{formErrors.date}</p>
            )}
          </div>
          
          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="categoryId">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className={`form-input ${formErrors.categoryId ? 'form-input-error' : ''}`}
            >
              <option value="">Select a category</option>
              
              {/* Render categories with option groups */}
              {parentCategories.map(parent => {
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
              })}
            </select>
            {formErrors.categoryId && (
              <p className="form-error-text">{formErrors.categoryId}</p>
            )}
          </div>
          
          {/* Time Entry */}
          <div className="form-group">
            <label className="form-label">
              Time Spent
            </label>
            <div className="time-inputs">
              <div className="time-input-group">
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                  className={`form-input ${formErrors.time ? 'form-input-error' : ''}`}
                />
                <span className="time-label">Hours</span>
              </div>
              
              <div className="time-input-group">
                <input
                  type="number"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleInputChange}
                  min="0"
                  max="59"
                  placeholder="0"
                  className={`form-input ${formErrors.time ? 'form-input-error' : ''}`}
                />
                <span className="time-label">Minutes</span>
              </div>
            </div>
            {formErrors.time && (
              <p className="form-error-text">{formErrors.time}</p>
            )}
          </div>
        </div>
        
        {/* Notes - Hide in compact mode */}
        {!compact && (
          <div className="form-group mt-4">
            <label className="form-label" htmlFor="notes">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="form-input form-textarea"
              placeholder="Add any notes about this time entry"
            ></textarea>
          </div>
        )}
        
        {/* Submit Button */}
        <div className={`form-actions ${compact ? '' : 'text-right'}`}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-primary ${compact ? 'btn-full-width' : ''}`}
          >
            {isSubmitting ? (
              <>
                <svg className="spinner-inline" viewBox="0 0 24 24">
                  <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Time Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeEntryForm;