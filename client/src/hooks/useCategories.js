import { useState, useCallback, useEffect } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';

/**
 * Hook for managing categories
 * @param {boolean} autoFetch - Whether to fetch categories automatically on mount
 * @returns {Object} - Categories data and related functions
 */
export const useCategories = (autoFetch = true) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories
  const getCategories = useCallback(async (flat = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchCategories(flat);
      setCategories(data);
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new category
  const addCategory = useCallback(async (category) => {
    try {
      setLoading(true);
      setError(null);
      
      const newCategory = await createCategory(category);
      await getCategories(); // Refresh categories to get updated tree
      
      return { success: true, data: newCategory };
    } catch (err) {
      setError(err.message || 'Failed to create category');
      return { success: false, message: err.message || 'Failed to create category' };
    } finally {
      setLoading(false);
    }
  }, [getCategories]);

  // Update a category
  const editCategory = useCallback(async (id, categoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCategory = await updateCategory(id, categoryData);
      await getCategories(); // Refresh categories to get updated tree
      
      return { success: true, data: updatedCategory };
    } catch (err) {
      setError(err.message || 'Failed to update category');
      return { success: false, message: err.message || 'Failed to update category' };
    } finally {
      setLoading(false);
    }
  }, [getCategories]);

  // Delete a category
  const removeCategory = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteCategory(id);
      await getCategories(); // Refresh categories to get updated tree
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      return { success: false, message: err.message || 'Failed to delete category' };
    } finally {
      setLoading(false);
    }
  }, [getCategories]);

  // Fetch categories on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      getCategories();
    }
  }, [autoFetch, getCategories]);

  return {
    categories,
    loading,
    error,
    getCategories,
    addCategory,
    editCategory,
    removeCategory
  };
};