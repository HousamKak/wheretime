import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/components/categorymanager.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  
  // Form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parent_id: '',
    color: '#6B7280' // Default gray
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    general: ''
  });
  
  // Color palette for selecting colors
  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#06B6D4', // Cyan
  ];

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from the API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again later.');
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setCategoryForm({
      name: '',
      parent_id: '',
      color: '#6B7280'
    });
    setFormErrors({
      name: '',
      general: ''
    });
    setFormMode('create');
    setEditingCategory(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (name === 'name' && formErrors.name) {
      setFormErrors(prev => ({
        ...prev,
        name: ''
      }));
    }
  };

  // Set color in form
  const handleColorSelect = (color) => {
    setCategoryForm(prev => ({
      ...prev,
      color
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    let valid = true;
    const errors = {
      name: '',
      general: ''
    };
    
    if (!categoryForm.name.trim()) {
      errors.name = 'Category name is required';
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
    
    try {
      if (formMode === 'create') {
        // Create new category
        await axios.post(`${API_URL}/categories`, {
          name: categoryForm.name,
          parent_id: categoryForm.parent_id || null,
          color: categoryForm.color
        });
      } else {
        // Update existing category
        await axios.put(`${API_URL}/categories/${editingCategory.id}`, {
          name: categoryForm.name,
          parent_id: categoryForm.parent_id === '' ? null : categoryForm.parent_id,
          color: categoryForm.color
        });
      }
      
      // Fetch updated categories
      fetchCategories();
      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        // API returned a specific error message
        setFormErrors(prev => ({
          ...prev,
          general: err.response.data.error
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          general: 'Failed to save category. Please try again.'
        }));
      }
    }
  };

  // Set up editing for a category
  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      parent_id: category.parent_id || '',
      color: category.color || '#6B7280'
    });
    setFormMode('edit');
  };

  // Delete a category
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all time logs associated with this category.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again later.');
    }
  };

  // Recursive function to render categories and their children
  const renderCategoryTree = (categoryList, level = 0) => {
    return categoryList.map(category => (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50">
          <td className="border-b p-3" style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}>
            <div className="flex items-center">
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: category.color }}
              ></span>
              <span>{category.name}</span>
            </div>
          </td>
          <td className="border-b p-3 text-right">
            <button
              onClick={() => handleEdit(category)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </td>
        </tr>
        {category.children && category.children.length > 0 && 
          renderCategoryTree(category.children, level + 1)
        }
      </React.Fragment>
    ));
  };

  // Flatten categories for parent selection dropdown
  const flattenCategories = (categoryList, level = 0, prefix = '') => {
    let result = [];
    
    categoryList.forEach(category => {
      // Skip the currently editing category to prevent circular references
      if (editingCategory && category.id === editingCategory.id) {
        return;
      }
      
      result.push({
        id: category.id,
        name: prefix + category.name,
        level
      });
      
      if (category.children && category.children.length > 0) {
        result = result.concat(
          flattenCategories(category.children, level + 1, prefix + '-- ')
        );
      }
    });
    
    return result;
  };

  const flatCategories = flattenCategories(categories);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-lg font-semibold">Error</h2>
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => {
            setError(null);
            fetchCategories();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Category Manager</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              {formMode === 'create' ? 'Add New Category' : 'Edit Category'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {formErrors.general}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter category name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  name="parent_id"
                  value={categoryForm.parent_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">None (Top Level)</option>
                  {flatCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {colorPalette.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        categoryForm.color === color ? 'border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                    ></button>
                  ))}
                </div>
                <input
                  type="color"
                  name="color"
                  value={categoryForm.color}
                  onChange={handleInputChange}
                  className="w-full h-10 p-0 border-0"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {formMode === 'create' ? 'Add Category' : 'Update Category'}
                </button>
                
                {formMode === 'edit' && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Category List */}
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-gray-500 italic">No categories found. Add your first category!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="p-3 text-left font-semibold">Category Name</th>
                      <th className="p-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderCategoryTree(categories)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;