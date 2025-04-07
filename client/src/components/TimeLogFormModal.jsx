import React, { useState, useEffect } from 'react';
import '../styles/components/modal.css';

const TimeLogFormModal = ({
  isOpen,
  onClose,
  onSave,
  log = null,
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    date: log ? log.date : new Date().toISOString().split('T')[0],
    category_id: log ? log.category_id : '',
    hours: log ? Math.floor(log.total_time / 60) : 0,
    minutes: log ? log.total_time % 60 : 0,
    notes: log ? log.notes : '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && log) {
      setFormData({
        date: log.date || new Date().toISOString().split('T')[0],
        category_id: log.category_id || '',
        hours: log ? Math.floor(log.total_time / 60) : 0,
        minutes: log ? log.total_time % 60 : 0,
        notes: log.notes || '',
      });
      setErrors({});
    }
  }, [isOpen, log]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'hours' || name === 'minutes') {
      let numValue = parseInt(value) || 0;
      if (name === 'minutes') {
        numValue = Math.min(Math.max(numValue, 0), 59);
      } else {
        numValue = Math.max(numValue, 0);
      }
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Subcategory is required';
    }
    const totalMinutes =
      (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
    if (totalMinutes <= 0) {
      newErrors.time = 'Please enter a valid time (at least 1 minute)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        const totalMinutes =
          (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
        const timeLogData = {
          id: log?.id,
          category_id: parseInt(formData.category_id),
          date: formData.date,
          total_time: totalMinutes,
          notes: formData.notes.trim() || null,
        };
        await onSave(timeLogData);
      } catch (error) {
        console.error('Error saving time log:', error);
        setErrors((prev) => ({
          ...prev,
          general: error.message || 'Failed to save time log. Please try again.',
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  // Only allow subcategories (those with a parent_id)
  const validSubcategories = categories.filter((cat) => cat.parent_id);

  // Group valid subcategories by their parent_id
  const groupedSubcategories = validSubcategories.reduce((acc, cat) => {
    if (!acc[cat.parent_id]) {
      acc[cat.parent_id] = [];
    }
    acc[cat.parent_id].push(cat);
    return acc;
  }, {});

  const getParentName = (parentId) => {
    const parent = categories.find((cat) => cat.id === parentId);
    return parent ? parent.name : '';
  };

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {errors.general && (
            <div className="form-error-message">{errors.general}</div>
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
              max={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="category_id">Subcategory</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={errors.category_id ? 'form-input error' : 'form-input'}
              disabled={loading}
            >
              <option value="">Select a subcategory</option>
              {Object.keys(groupedSubcategories).map((parentId) => (
                <optgroup key={parentId} label={getParentName(Number(parentId))}>
                  {groupedSubcategories[parentId].map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.category_id && (
              <div className="form-error">{errors.category_id}</div>
            )}
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
                  placeholder="0"
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
                  placeholder="0"
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
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <svg
                    className="spinner"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="spinner-circle"
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="3"
                    />
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
