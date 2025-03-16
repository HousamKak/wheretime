import api from './api';

/**
 * Fetch time logs with optional filters
 * @param {Object} filters - Optional filters for time logs
 * @param {string} [filters.start_date] - Start date (YYYY-MM-DD)
 * @param {string} [filters.end_date] - End date (YYYY-MM-DD)
 * @param {number} [filters.category_id] - Category ID
 * @returns {Promise<Array>} - The time logs
 */
export const fetchLogs = async (filters = {}) => {
  try {
    return await api.get('/logs', { params: filters });
  } catch (error) {
    console.error('Error fetching time logs:', error);
    throw error;
  }
};

/**
 * Create or update a time log
 * @param {Object} log - The time log to create or update
 * @param {number} log.category_id - The category ID
 * @param {string} log.date - The date (YYYY-MM-DD)
 * @param {number} log.total_time - The total time in minutes
 * @param {string} [log.notes] - Optional notes
 * @returns {Promise<Object>} - The created or updated time log
 */
export const saveLog = async (log) => {
  try {
    return await api.post('/logs', log);
  } catch (error) {
    console.error('Error saving time log:', error);
    throw error;
  }
};

/**
 * Delete a time log
 * @param {number} id - The time log ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteLog = async (id) => {
  try {
    return await api.delete(`/logs/${id}`);
  } catch (error) {
    console.error(`Error deleting time log with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch aggregated statistics
 * @param {Object} params - Parameters for the stats
 * @param {string} [params.start_date] - Start date (YYYY-MM-DD)
 * @param {string} [params.end_date] - End date (YYYY-MM-DD)
 * @param {string} [params.group_by] - Grouping ('category', 'date', 'week', 'month')
 * @returns {Promise<Array>} - The aggregated stats
 */
export const fetchStats = async (params = {}) => {
  try {
    return await api.get('/stats', { params });
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};