import api from './api';

/**
 * Fetch all categories
 * @param {boolean} flat - Whether to return flat or nested categories
 * @returns {Promise<Array>} - The categories
 */
export const fetchCategories = async (flat = false) => {
  try {
    return await api.get(`/categories${flat ? '?flat=true' : ''}`);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Create a new category
 * @param {Object} category - The category to create
 * @param {string} category.name - The category name
 * @param {number|null} category.parent_id - The parent category ID (optional)
 * @param {string} category.color - The category color (optional)
 * @param {number|null} category.threshold_minutes - Time threshold in minutes (optional)
 * @returns {Promise<Object>} - The created category
 */
export const createCategory = async (category) => {
  try {
    return await api.post('/categories', category);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update a category
 * @param {number} id - The category ID
 * @param {Object} category - The category updates
 * @param {string} [category.name] - The updated category name
 * @param {number|null} [category.parent_id] - The updated parent category ID
 * @param {string} [category.color] - The updated category color
 * @param {number|null} [category.threshold_minutes] - The updated time threshold in minutes
 * @returns {Promise<Object>} - The updated category
 */
export const updateCategory = async (id, category) => {
  try {
    return await api.put(`/categories/${id}`, category);
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a category
 * @param {number} id - The category ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteCategory = async (id) => {
  try {
    return await api.delete(`/categories/${id}`);
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    throw error;
  }
};