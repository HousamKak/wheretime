import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from './common/Button';
import { formatTime } from '../utils/timeUtils';
import '../styles/components/form.css';
import '../styles/components/timeentryform.css';

const TimeEntryForm = ({ categories = [], onSuccess, compact = false, defaultDate }) => {
  const [formData, setFormData] = useState({
    date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
    hours: 0,
    minutes: 0,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [thresholdWarning, setThresholdWarning] = useState(null);

  // Get the selected category details
  const selectedCategory = categories.find(c => c.id.toString() === formData.categoryId.toString());

  // Calculate total minutes for the current form
  const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);

  // Fetch existing time for this category in the current month
  const [existingTimeData, setExistingTimeData] = useState({
    loading: false,
    totalTime: 0,
    error: null,
  });

  // Check for threshold when category or time changes
  useEffect(() => {
    if (!selectedCategory || !totalMinutes) {
      setThresholdWarning(null);
      return;
    }

    const checkThreshold = async () => {
      // Only check if category has a threshold
      if (selectedCategory.threshold_minutes) {
        try {
          setExistingTimeData({ ...existingTimeData, loading: true });
          
          // In a real implementation, you would fetch this from your API
          // For now, let's simulate existing time
          
          // Get dates for the current month
          const currentDate = new Date(formData.date);
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          // API call would be something like:
          // const response = await fetchLogs({
          //   start_date: format(startOfMonth, 'yyyy-MM-dd'),
          //   end_date: format(endOfMonth, 'yyyy-MM-dd'),
          //   category_id: selectedCategory.id
          // });
          
          // Simulated existing time for this category this month
          // In production, this would come from your API
          const existingTime = Math.floor(Math.random() * selectedCategory.threshold_minutes * 0.7);
          
          // Add the new time to check against threshold
          const totalTimeWithNew = existingTime + totalMinutes;
          
          setExistingTimeData({
            loading: false,
            totalTime: existingTime,
            error: null,
          });
          
          // Calculate how close we are to the threshold
          const percentOfThreshold = (totalTimeWithNew / selectedCategory.threshold_minutes) * 100;
          
          // Set warning if approaching or exceeding threshold
          if (percentOfThreshold >= 100) {
            setThresholdWarning({
              level: 'exceed',
              message: `This entry will exceed your ${formatTime(selectedCategory.threshold_minutes)} threshold for ${selectedCategory.name}`,
              current: existingTime,
              new: totalMinutes,
              threshold: selectedCategory.threshold_minutes,
              percent: percentOfThreshold
            });
          } else if (percentOfThreshold >= 80) {
            setThresholdWarning({
              level: 'approaching',
              message: `This entry will bring you to ${Math.round(percentOfThreshold)}% of your threshold for ${selectedCategory.name}`,
              current: existingTime,
              new: totalMinutes,
              threshold: selectedCategory.threshold_minutes,
              percent: percentOfThreshold
            });
          } else {
            setThresholdWarning(null);
          }
        } catch (err) {
          setExistingTimeData({
            loading: false,
            totalTime: 0,
            error: 'Failed to check threshold data'
          });
          setThresholdWarning(null);
        }
      } else {
        setThresholdWarning(null);
      }
    };

    checkThreshold();
  }, [formData.categoryId, totalMinutes, selectedCategory, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a subcategory';
    }
    
    if (totalMinutes <= 0) {
      newErrors.time = 'Please enter a time greater than zero';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to save time log
      // In a real implementation, you would send this to your backend
      // await saveLog({
      //   category_id: formData.categoryId,
      //   date: formData.date,
      //   total_time: totalMinutes,
      //   notes: formData.notes
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess({
          ...formData,
          total_time: totalMinutes
        });
      }
      
      // Reset form (except date)
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        hours: 0,
        minutes: 0,
        notes: ''
      }));
      
      setThresholdWarning(null);
      
    } catch (error) {
      console.error('Error saving time log:', error);
      setErrors({ submit: 'Failed to save time entry. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Only allow subcategories (those with a parent_id)
  const validCategories = categories.filter((cat) => cat.parent_id);

  // Group valid subcategories by their parent_id
  const groupedSubcategories = validCategories.reduce((acc, cat) => {
    if (!acc[cat.parent_id]) {
      acc[cat.parent_id] = [];
    }
    acc[cat.parent_id].push(cat);
    return acc;
  }, {});

  // Get the parent's name for a given parent_id
  const getParentName = (parentId) => {
    const parent = categories.find((cat) => cat.id === parentId);
    return parent ? parent.name : '';
  };

  return (
    <div className={`time-entry-form ${compact ? 'compact' : ''}`}>
      <form onSubmit={handleSubmit} className="time-entry-form-content">
        {errors.submit && (
          <div className="form-error-message mb-4">{errors.submit}</div>
        )}
        
        <div className="form-grid">
          <div className="form-group date-field">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? "form-input error" : "form-input"}
              max={format(new Date(), 'yyyy-MM-dd')}
              disabled={loading}
            />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
          <div className="form-group category-field">
            <label htmlFor="categoryId">Subcategory</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={errors.categoryId ? "form-input error" : "form-input"}
              disabled={loading}
              required
            >
              <option value="">Select a subcategory</option>
              {Object.keys(groupedSubcategories).map((parentId) => (
                <optgroup key={parentId} label={getParentName(Number(parentId))}>
                  {groupedSubcategories[parentId].map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                      {sub.threshold_minutes ? ` (Limit: ${formatTime(sub.threshold_minutes)})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.categoryId && (
              <div className="form-error">{errors.categoryId}</div>
            )}
          </div>
        </div>
        
        <div className="form-group time-fields">
          <label>Time Spent</label>
          <div className="time-inputs">
            <div className="time-input-group">
              <input
                type="number"
                name="hours"
                value={formData.hours}
                onChange={handleChange}
                min="0"
                className={errors.time ? "form-input error" : "form-input"}
                placeholder="0"
                disabled={loading}
              />
              <span className="time-label">Hours</span>
            </div>
            <div className="time-input-group">
              <input
                type="number"
                name="minutes"
                value={formData.minutes}
                onChange={handleChange}
                min="0"
                max="59"
                className={errors.time ? "form-input error" : "form-input"}
                placeholder="0"
                disabled={loading}
              />
              <span className="time-label">Minutes</span>
            </div>
          </div>
          {errors.time && <div className="form-error">{errors.time}</div>}
        </div>
        
        {/* Threshold warning display */}
        {thresholdWarning && (
          <div className={`threshold-alert ${thresholdWarning.level === 'exceed' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <svg className="threshold-alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium">{thresholdWarning.message}</div>
              <div className="threshold-progress-bar mt-1">
                <div 
                  className={`threshold-progress-fill ${thresholdWarning.percent >= 100 ? 'danger' : 'warning'}`} 
                  style={{ width: `${Math.min(thresholdWarning.percent, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1">
                Current: {formatTime(thresholdWarning.current)} + New: {formatTime(thresholdWarning.new)} = {formatTime(thresholdWarning.current + thresholdWarning.new)} / {formatTime(thresholdWarning.threshold)}
              </div>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={compact ? '2' : '4'}
            className="form-input"
            placeholder="Add any notes about this time entry"
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="form-footer">
          <Button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="spinner-inline" viewBox="0 0 24 24">
                  <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Time Entry'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TimeEntryForm;