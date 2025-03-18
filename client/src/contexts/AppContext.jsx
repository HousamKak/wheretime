import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  
  console.log("AppProvider render, categories:", categories.length);
  
  // Initialize app data
  const initialize = useCallback(async () => {
    console.log("AppProvider: Initializing app data");
    try {
      setLoading(true);
      
      // Fetch categories
      console.log("AppProvider: Fetching categories");
      const categoriesData = await fetchCategories();
      console.log("AppProvider: Categories fetched:", categoriesData.length);
      
      // Log the structure of categories
      if (categoriesData.length > 0) {
        console.log("AppProvider: Sample category structure:", categoriesData[0]);
        
        // Check for parent-child relationships
        const childCategories = categoriesData.filter(cat => cat.parent_id);
        console.log("AppProvider: Child categories count:", childCategories.length);
        
        if (childCategories.length > 0) {
          childCategories.forEach(child => {
            const parent = categoriesData.find(cat => cat.id === child.parent_id);
            console.log(`AppProvider: Child ${child.id} (${child.name}) has parent ${child.parent_id} (${parent ? parent.name : 'NOT FOUND'})`);
          });
        }
      }
      
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
  
  // Initialize on mount
  useEffect(() => {
    console.log("AppProvider: Running initial fetch");
    initialize();
  }, [initialize]);
  
  // Update categories
  const updateCategories = useCallback(async () => {
    console.log("AppProvider: Updating categories");
    try {
      setLoading(true);
      
      const categoriesData = await fetchCategories();
      console.log("AppProvider: Categories updated:", categoriesData.length);
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