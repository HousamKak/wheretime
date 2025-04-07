import React, { useState } from 'react';
import '../styles/components/form.css';

const TimeEntryForm = ({ categories = [], onSuccess, compact = false, defaultDate }) => {
  const [formData, setFormData] = useState({
    date: defaultDate,
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
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Log Your Time</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="categoryId">Category</label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
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
            rows="4"
            placeholder="Add any notes about this time entry"
          ></textarea>
        </div>
        <div className="form-footer">
          <button type="button" className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Save Time Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeEntryForm;