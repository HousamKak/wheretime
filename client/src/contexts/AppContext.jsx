import { createContext, useContext, useState, useCallback } from 'react';
import { fetchCategories } from '../services/categoryService';

// Create context
const AppContext = createContext();

// Custom hook for using the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Context provider component
export const AppProvider = ({ children }) => {
  // App state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // Initialize app data
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
      
      setLoading(false);
      setInitializing(false);
    } catch (err) {
      console.error('Error initializing app:', err);
      setError('Failed to initialize app. Please try refreshing the page.');
      setLoading(false);
      setInitializing(false);
    }
  }, []);
  
  // Update categories
  const updateCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating categories:', err);
      setError('Failed to update categories. Please try again.');
      setLoading(false);
    }
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Context value
  const value = {
    categories,
    loading,
    error,
    initializing,
    initialize,
    updateCategories,
    clearError
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};