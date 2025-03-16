import { useState } from 'react';
import TimeLogViewer from '../components/TimeLogViewer';
import { useApp } from '../contexts/AppContext';
import { Alert } from '../components/common/Alert';

const LogsPage = () => {
  const { categories } = useApp();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle log operations
  const handleLogAction = (action, result) => {
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    if (result.success) {
      // Show success message
      switch (action) {
        case 'create':
          setSuccess('Time log created successfully.');
          break;
        case 'update':
          setSuccess('Time log updated successfully.');
          break;
        case 'delete':
          setSuccess('Time log deleted successfully.');
          break;
        default:
          setSuccess('Operation completed successfully.');
      }
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
      <h1 className="text-3xl font-semibold mb-6">Time Log History</h1>
      
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
      
      <TimeLogViewer 
        categories={categories}
        onLogAction={handleLogAction}
      />
    </div>
  );
};

export default LogsPage;