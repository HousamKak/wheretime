import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle common request tasks
api.interceptors.request.use(
  (config) => {
    // Add any common request handling here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common response tasks
api.interceptors.response.use(
  (response) => {
    // Return the response data directly
    return response.data;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      console.error('API Error Response:', error.response.data);
      
      // Handle specific error status
      if (error.response.status === 401) {
        // Handle unauthorized error
        console.error('Unauthorized access');
      } else if (error.response.status === 404) {
        // Handle not found error
        console.error('Resource not found');
      } else if (error.response.status === 500) {
        // Handle server error
        console.error('Server error');
      }
      
      // Return a more meaningful error message
      return Promise.reject({
        status: error.response.status,
        message: error.response.data.error || 'An error occurred',
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
      return Promise.reject({
        message: 'No response from server. Please check your connection.'
      });
    } else {
      // Something else happened in setting up the request
      console.error('API Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
);

export default api;