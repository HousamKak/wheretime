import React, { useState } from 'react';
import { Button } from './common/Button';
import '../styles/components/form.css';

const TimeEntryForm = ({ categories = [], onSuccess, compact = false, defaultDate }) => {
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0],
    categoryId: '',
    hours: 0,
    minutes: 0,
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // (Add form validation as needed)
    if (onSuccess) {
      onSuccess(formData);
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
        <div className="form-grid">
          <div className="form-group date-field">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          <div className="form-group category-field">
            <label htmlFor="categoryId">Subcategory</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
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
                placeholder="0"
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
                placeholder="0"
              />
              <span className="time-label">Minutes</span>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={compact ? '2' : '4'}
            placeholder="Add any notes about this time entry"
          ></textarea>
        </div>
        <div className="form-footer">
          <Button type="submit" className="submit-btn">
            Save Time Entry
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TimeEntryForm;
