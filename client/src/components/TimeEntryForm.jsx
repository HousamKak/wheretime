import React, { useState } from 'react';
import { Button } from './common/Button';
import '../styles/components/form.css';

const TimeEntryForm = ({ categories = [], onSuccess, compact = false, defaultDate }) => {
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0], // Default to today
    categoryId: '',
    hours: 0,
    minutes: 0,
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic
    if (onSuccess) onSuccess(formData);
    // Reset form or show success message
    setFormData({
      ...formData,
      categoryId: '',
      hours: 0,
      minutes: 0,
      notes: '',
    });
  };

  // Sort categories by name
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  // Group categories by parent for dropdown
  const parentCategories = sortedCategories.filter(cat => !cat.parent_id);
  const childCategories = sortedCategories.filter(cat => cat.parent_id);

  // Group child categories by parent_id
  const childrenByParent = childCategories.reduce((acc, cat) => {
    if (!acc[cat.parent_id]) acc[cat.parent_id] = [];
    acc[cat.parent_id].push(cat);
    return acc;
  }, {});

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
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]} // Don't allow future dates
            />
          </div>
          
          <div className="form-group category-field">
            <label htmlFor="categoryId">Category</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              {parentCategories.map((parent) => (
                <React.Fragment key={parent.id}>
                  <option value={parent.id}>{parent.name}</option>
                  {childrenByParent[parent.id]?.map(child => (
                    <option key={child.id} value={child.id}>
                      &nbsp;&nbsp;└ {child.name}
                    </option>
                  ))}
                </React.Fragment>
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
            onChange={handleInputChange}
            rows={compact ? "2" : "4"}
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
