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
      
      // Fetch categories with flat=true to get ALL categories (including subcategories)
      console.log("AppProvider: Fetching all categories (flat)");
      const categoriesData = await fetchCategories(true); // Pass flat=true
      console.log("AppProvider: Categories fetched:", categoriesData.length);
      
      // Process to ensure parent-child relationships
      const processedCategories = processCategories(categoriesData);
      
      setCategories(processedCategories);
      setLoading(false);
      setInitializing(false);
    } catch (err) {
      console.error('Error initializing app:', err);
      setError('Failed to initialize app. Please try refreshing the page.');
      setLoading(false);
      setInitializing(false);
    }
  }, []);
  
  // Process categories to ensure proper parent-child relationships
  const processCategories = (categoriesData) => {
    console.log("Processing categories to build hierarchy");
    
    // First, identify all parent and child categories
    const parents = new Set();
    const children = new Set();
    
    categoriesData.forEach(cat => {
      if (cat.parent_id) {
        children.add(cat.id);
        parents.add(cat.parent_id);
      }
    });
    
    // For each parent, ensure it has a children array
    const processedCategories = categoriesData.map(cat => {
      // Add children array to every category
      const processedCat = { ...cat, children: [] };
      
      // If this is a parent category, log it
      if (parents.has(cat.id)) {
        console.log(`Category ${cat.id} (${cat.name}) is a parent`);
      }
      
      // If this is a child, log its parent
      if (cat.parent_id) {
        console.log(`Category ${cat.id} (${cat.name}) is a child of ${cat.parent_id}`);
      }
      
      return processedCat;
    });
    
    // Now build parent-child relationships
    processedCategories.forEach(parent => {
      const children = processedCategories.filter(child => 
        child.parent_id === parent.id
      );
      
      if (children.length > 0) {
        parent.children = children;
        console.log(`Added ${children.length} children to category ${parent.id} (${parent.name})`);
      }
    });
    
    // Find root categories (those without parents)
    const rootCategories = processedCategories.filter(cat => !cat.parent_id);
    console.log(`Found ${rootCategories.length} root categories`);
    
    return processedCategories;
  };
  
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
      
      // Fetch with flat=true to get all categories
      const categoriesData = await fetchCategories(true);
      console.log("AppProvider: Categories updated:", categoriesData.length);
      
      // Process to ensure parent-child relationships
      const processedCategories = processCategories(categoriesData);
      
      setCategories(processedCategories);
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