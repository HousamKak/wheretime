import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';

/**
 * Format a date to ISO format (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date
 */
export const formatISODate = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Format a date to display format (Month Day, Year)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date
 */
export const formatDisplayDate = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM d, yyyy');
};

/**
 * Format a date to compact format (MM/DD/YYYY)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date
 */
export const formatCompactDate = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MM/dd/yyyy');
};

/**
 * Get today's date in ISO format
 * @returns {string} - Today's date
 */
export const getTodayISO = () => {
  return formatISODate(new Date());
};

/**
 * Get date ranges for common time periods
 * @returns {Object} - Date ranges
 */
export const getDateRanges = () => {
  const today = new Date();
  
  return {
    today: {
      start: formatISODate(today),
      end: formatISODate(today),
      label: 'Today'
    },
    yesterday: {
      start: formatISODate(subDays(today, 1)),
      end: formatISODate(subDays(today, 1)),
      label: 'Yesterday'
    },
    last7Days: {
      start: formatISODate(subDays(today, 6)),
      end: formatISODate(today),
      label: 'Last 7 Days'
    },
    last30Days: {
      start: formatISODate(subDays(today, 29)),
      end: formatISODate(today),
      label: 'Last 30 Days'
    },
    thisWeek: {
      start: formatISODate(startOfWeek(today, { weekStartsOn: 1 })),
      end: formatISODate(today),
      label: 'This Week'
    },
    thisMonth: {
      start: formatISODate(startOfMonth(today)),
      end: formatISODate(today),
      label: 'This Month'
    },
    lastMonth: {
      start: formatISODate(startOfMonth(subDays(startOfMonth(today), 1))),
      end: formatISODate(endOfMonth(subDays(startOfMonth(today), 1))),
      label: 'Last Month'
    }
  };
};

/**
 * Parse an ISO date string to a Date object
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {Date} - Parsed date
 */
export const parseDate = (dateString) => {
  if (!dateString) return new Date();
  return parseISO(dateString);
};