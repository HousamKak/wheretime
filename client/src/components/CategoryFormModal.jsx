import React, { useState, useEffect } from 'react';
import '../styles/components/modal.css';

const CategoryFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  category = null, 
  allCategories = [],
  loading = false 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    color: '#4361ee'
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  // Reset form when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || '',
          parent_id: category.parent_id || '',
          color: category.color || '#4361ee'
        });
      } else {
        setFormData({
          name: '',
          parent_id: '',
          color: '#4361ee'
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    if (formData.parent_id && category && Number(formData.parent_id) === category.id) {
      newErrors.parent_id = 'Category cannot be its own parent';
    }
    
    // Check for circular reference
    if (formData.parent_id && category) {
      let currentParentId = formData.parent_id;
      const visited = new Set([category.id]);
      
      while (currentParentId) {
        if (visited.has(Number(currentParentId))) {
          newErrors.parent_id = 'This would create a circular reference';
          break;
        }
        
        visited.add(Number(currentParentId));
        
        const parent = allCategories.find(c => c.id === Number(currentParentId));
        currentParentId = parent?.parent_id;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format data for submission
      const submitData = {
        ...formData,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      };
      
      onSubmit(submitData);
    }
  };
  
  // Create a filtered list of potential parent categories (exclude self and children)
  const getValidParentOptions = () => {
    if (!category) {
      return allCategories;
    }
    
    // Build a set of descendant IDs that cannot be parents
    const descendantIds = new Set();
    
    const addDescendants = (categoryId) => {
      const children = allCategories.filter(c => c.parent_id === categoryId);
      
      children.forEach(child => {
        descendantIds.add(child.id);
        addDescendants(child.id);
      });
    };
    
    // Add the category itself and all its descendants
    descendantIds.add(category.id);
    addDescendants(category.id);
    
    // Filter out all descendants
    return allCategories.filter(c => !descendantIds.has(c.id));
  };
  
  const validParentOptions = getValidParentOptions();
  
  // Predefined colors for the color picker
  const predefinedColors = [
    '#4361ee', // Blue
    '#3a0ca3', // Indigo
    '#7209b7', // Purple
    '#f72585', // Pink
    '#4cc9f0', // Cyan 
    '#06d6a0', // Teal
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#6b7280'  // Gray
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{category ? 'Edit Category' : 'Create New Category'}</h2>
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
          <div className="form-group">
            <label htmlFor="name">Category Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter category name"
              className={errors.name ? 'form-input error' : 'form-input'}
              disabled={loading}
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="parent_id">Parent Category (Optional)</label>
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
              className={errors.parent_id ? 'form-input error' : 'form-input'}
              disabled={loading}
            >
              <option value="">None (Root Category)</option>
              {validParentOptions.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.parent_id && <div className="form-error">{errors.parent_id}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Category Color</label>
            
            <div className="color-picker">
              <div className="predefined-colors">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange({ target: { name: 'color', value: color } })}
                    disabled={loading}
                  />
                ))}
              </div>
              
              <div className="custom-color">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="color-input"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={handleChange}
                  name="color"
                  className="form-input color-text-input"
                  disabled={loading}
                />
              </div>
            </div>
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
                  {category ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                category ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;