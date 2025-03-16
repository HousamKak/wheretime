/**
 * Format minutes as hours and minutes
 * @param {number} minutes - Total minutes
 * @param {boolean} [compact=false] - Whether to use compact format
 * @returns {string} - Formatted time
 */
export const formatTime = (minutes, compact = false) => {
    if (minutes === undefined || minutes === null) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (compact) {
      if (hours === 0) {
        return `${mins}m`;
      } else if (mins === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${mins}m`;
      }
    } else {
      const hoursText = hours === 1 ? 'hour' : 'hours';
      const minsText = mins === 1 ? 'minute' : 'minutes';
      
      if (hours === 0) {
        return `${mins} ${minsText}`;
      } else if (mins === 0) {
        return `${hours} ${hoursText}`;
      } else {
        return `${hours} ${hoursText} ${mins} ${minsText}`;
      }
    }
  };
  
  /**
   * Convert hours and minutes to total minutes
   * @param {number} hours - Hours
   * @param {number} minutes - Minutes
   * @returns {number} - Total minutes
   */
  export const hoursMinutesToMinutes = (hours, minutes) => {
    return (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
  };
  
  /**
   * Convert total minutes to hours and minutes
   * @param {number} totalMinutes - Total minutes
   * @returns {Object} - Hours and minutes
   */
  export const minutesToHoursMinutes = (totalMinutes) => {
    const total = parseInt(totalMinutes) || 0;
    return {
      hours: Math.floor(total / 60),
      minutes: total % 60
    };
  };
  
  /**
   * Calculate percentage of time spent
   * @param {number} minutes - Minutes spent
   * @param {number} totalMinutes - Total minutes
   * @returns {number} - Percentage (0-100)
   */
  export const calculatePercentage = (minutes, totalMinutes) => {
    if (!totalMinutes) return 0;
    return Math.round((minutes / totalMinutes) * 100);
  };