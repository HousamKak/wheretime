import { useState } from 'react';
import CategoryManager from '../components/CategoryManager';
import { useApp } from '../contexts/AppContext';
import { Alert } from '../components/common/Alert';

const CategoriesPage = () => {
  const { categories, updateCategories } = useApp();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle category operations
  const handleCategoryAction = async (action, result) => {
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    if (result.success) {
      // Show success message
      switch (action) {
        case 'create':
          setSuccess('Category created successfully.');
          break;
        case 'update':
          setSuccess('Category updated successfully.');
          break;
        case 'delete':
          setSuccess('Category deleted successfully.');
          break;
        default:
          setSuccess('Operation completed successfully.');
      }
      
      // Refresh categories
      await updateCategories();
    } else {
      // Show error message
      setError(result.message || 'An error occurred. Please try again.');
    }
    
    // Auto-hide success message after a delay
    if (result.success) {
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  // Handle error dismissal
  const handleDismissError = () => {
    setError(null);
  };

  // Handle success dismissal
  const handleDismissSuccess = () => {
    setSuccess(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Manage Categories</h1>
      
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onDismiss={handleDismissError} 
          className="mb-4"
        />
      )}
      
      {success && (
        <Alert 
          type="success" 
          message={success} 
          onDismiss={handleDismissSuccess} 
          className="mb-4"
        />
      )}
      
      <CategoryManager 
        categories={categories}
        onCategoryAction={handleCategoryAction}
      />
    </div>
  );
};

export default CategoriesPage;