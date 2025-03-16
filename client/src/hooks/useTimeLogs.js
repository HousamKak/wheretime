import { useState, useCallback, useEffect } from 'react';
import { fetchLogs, saveLog, deleteLog, fetchStats } from '../services/timeLogService';

/**
 * Hook for managing time logs
 * @param {Object} initialFilters - Initial filters for time logs
 * @param {boolean} autoFetch - Whether to fetch logs automatically on mount
 * @returns {Object} - Time logs data and related functions
 */
export const useTimeLogs = (initialFilters = {}, autoFetch = true) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch time logs with filters
  const getLogs = useCallback(async (newFilters = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update filters if new ones are provided
      const currentFilters = newFilters || filters;
      if (newFilters) {
        setFilters(newFilters);
      }
      
      const data = await fetchLogs(currentFilters);
      setLogs(data);
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch time logs');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create or update a time log
  const addOrUpdateLog = useCallback(async (logData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await saveLog(logData);
      
      // Refresh logs with current filters
      await getLogs();
      
      return { 
        success: true, 
        data: result,
        isNew: result.created, 
        isUpdate: result.updated 
      };
    } catch (err) {
      setError(err.message || 'Failed to save time log');
      return { success: false, message: err.message || 'Failed to save time log' };
    } finally {
      setLoading(false);
    }
  }, [getLogs]);

  // Delete a time log
  const removeLog = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteLog(id);
      
      // Refresh logs with current filters
      await getLogs();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete time log');
      return { success: false, message: err.message || 'Failed to delete time log' };
    } finally {
      setLoading(false);
    }
  }, [getLogs]);

  // Fetch time stats
  const getStats = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchStats({
        start_date: filters.start_date,
        end_date: filters.end_date,
        ...params
      });
      
      setStats(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch stats');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Fetch logs on mount if autoFetch is true or when filters change
  useEffect(() => {
    if (autoFetch) {
      getLogs();
    }
  }, [autoFetch, filters, getLogs]);

  return {
    logs,
    stats,
    filters,
    loading,
    error,
    getLogs,
    getStats,
    addOrUpdateLog,
    removeLog,
    updateFilters
  };
};