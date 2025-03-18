import React from 'react';
import '../../styles/components/skeleton.css';

export const Skeleton = ({ type = 'text', width, height, className = '', count = 1 }) => {
  // Base skeleton animation class
  const baseClass = 'animate-pulse bg-gray-200 rounded';
  
  // Type-specific styling
  const getTypeStyles = () => {
    switch (type) {
      case 'circle':
        return 'rounded-full';
      case 'rectangle':
        return 'rounded-md';
      case 'card':
        return 'rounded-lg w-full';
      case 'button':
        return 'rounded-md h-10';
      case 'avatar':
        return 'rounded-full h-10 w-10';
      case 'line':
        return 'h-2 rounded-full';
      case 'input':
        return 'h-10 rounded-md w-full';
      case 'heading':
        return 'h-6 rounded-full';
      default: // text
        return 'h-4 rounded-full';
    }
  };
  
  // Determine dynamic width
  const getWidth = () => {
    if (width) return width;
    
    // Default widths by type
    switch (type) {
      case 'text':
        return 'w-full';
      case 'heading':
        return 'w-3/4';
      case 'button':
        return 'w-24';
      case 'line':
        // Random widths for more natural appearance
        if (Array.isArray(count)) {
          return undefined; // Will be handled in rendering
        }
        return 'w-full';
      default:
        return 'w-full';
    }
  };
  
  // Determine dynamic height
  const getHeight = () => {
    if (height) return height;
    
    // Some types already have default heights
    if (['text', 'heading', 'button', 'avatar', 'input', 'line'].includes(type)) {
      return '';
    }
    
    return type === 'card' ? 'h-32' : 'h-16';
  };
  
  // For line type with count as an array of widths
  if (type === 'line' && Array.isArray(count)) {
    return (
      <div className="space-y-2">
        {count.map((width, index) => (
          <div 
            key={index} 
            className={`${baseClass} ${getTypeStyles()} h-2`}
            style={{ width: typeof width === 'number' ? `${width}%` : width }}
          ></div>
        ))}
      </div>
    );
  }
  
  // For multiple items
  if (count > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(count)].map((_, index) => (
          <div 
            key={index} 
            className={`${baseClass} ${getTypeStyles()} ${getWidth()} ${getHeight()}`}
          ></div>
        ))}
      </div>
    );
  }
  
  // Single skeleton element
  return (
    <div 
      className={`${baseClass} ${getTypeStyles()} ${getWidth()} ${getHeight()} ${className}`}
    ></div>
  );
};

// Skeleton Card with multiple elements
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-content p-4">
        <Skeleton type="heading" className="mb-4" />
        <Skeleton type="line" count={[100, 80, 90, 60]} className="mb-4" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton type="button" />
          <Skeleton type="avatar" />
        </div>
      </div>
    </div>
  );
};

// Skeleton Chart
export const SkeletonChart = ({ className = '' }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <Skeleton type="heading" width="w-1/4" />
      </div>
      <div className="card-content p-4">
        <Skeleton type="rectangle" height="h-64" className="mb-4" />
        <div className="flex flex-wrap gap-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} type="button" width="w-20" />
          ))}
        </div>
      </div>
    </div>
  );
};

// Skeleton Dashboard
export const SkeletonDashboard = () => {
  return (
    <div className="space-y-6">
      <Skeleton type="rectangle" height="h-16" className="mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SkeletonChart />
        </div>
        <div>
          <SkeletonCard className="mb-6" />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
};