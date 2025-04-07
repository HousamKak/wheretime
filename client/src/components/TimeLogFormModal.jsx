import React, { useState, useEffect } from 'react';
import { saveLog } from '../services/timeLogService';
import { formatTime, minutesToHoursMinutes, hoursMinutesToMinutes } from '../utils/timeUtils';
import { format, parseISO } from 'date-fns';
import '../styles/components/modal.css';

const TimeLogFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  log = null, 
  categories = []
}) => {
  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    hours: 0,
    minutes: 0,
    notes: ''
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Reset form when modal opens or log changes
  useEffect(() => {
    if (isOpen && log) {
      const { hours, minutes } = minutesToHoursMinutes(log.total_time);
      
      setFormData({
        date: log.date || format(new Date(), 'yyyy-MM-dd'),
        category_id: log.category_id || '',
        hours: hours || 0,
        minutes: minutes || 0,
        notes: log.notes || ''
      });
      setErrors({});
    }
  }, [isOpen, log]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    const totalMinutes = hoursMinutesToMinutes(formData.hours, formData.minutes);
    if (totalMinutes <= 0) {
      newErrors.time = 'Please enter a valid time (at least 1 minute)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Calculate total minutes
        const totalMinutes = hoursMinutesToMinutes(formData.hours, formData.minutes);
        
        // Prepare data for submission
        const timeLogData = {
          id: log?.id, // Include ID if editing
          category_id: parseInt(formData.category_id),
          date: formData.date,
          total_time: totalMinutes,
          notes: formData.notes.trim() || null
        };
        
        // Save to server
        await saveLog(timeLogData);
        
        // Call onSave callback
        if (onSave) {
          await onSave();
        }
      } catch (error) {
        console.error('Error saving time log:', error);
        setErrors(prev => ({
          ...prev,
          general: error.message || 'Failed to save time log. Please try again.'
        }));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Group categories by parent for the dropdown
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
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Time Log</h2>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {errors.general && (
            <div className="form-error-message">
              {errors.general}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'form-input error' : 'form-input'}
              max={format(new Date(), 'yyyy-MM-dd')}
              disabled={loading}
            />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={errors.category_id ? 'form-input error' : 'form-input'}
              disabled={loading}
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
            {errors.category_id && <div className="form-error">{errors.category_id}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="hours">Time Spent</label>
            <div className="time-inputs">
              <div className="time-input-group">
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  min="0"
                  className={errors.time ? 'form-input error' : 'form-input'}
                  disabled={loading}
                />
                <span className="time-label">Hours</span>
              </div>
              
              <div className="time-input-group">
                <input
                  type="number"
                  id="minutes"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleChange}
                  min="0"
                  max="59"
                  className={errors.time ? 'form-input error' : 'form-input'}
                  disabled={loading}
                />
                <span className="time-label">Minutes</span>
              </div>
            </div>
            {errors.time && <div className="form-error">{errors.time}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input form-textarea"
              rows="4"
              placeholder="Add any notes about this time entry"
              disabled={loading}
            ></textarea>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeLogFormModal;