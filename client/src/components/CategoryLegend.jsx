import React, { useState, useEffect, useMemo } from 'react';
import '../styles/components/categorylegend.css';

const CategoryLegend = ({ 
  categories = [], 
  categoryVisibility = {}, 
  expandedCategories = {}, 
  onToggleExpand,
  onToggleVisibility
}) => {
  // State to track which category is currently expanded (only one at a time)
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Organize categories into a hierarchy using useMemo for better performance
  const { rootCategories } = useMemo(() => {
    const rootCats = [];
    const categoryMap = {};
    
    // Create objects for all categories
    categories.forEach(cat => {
      categoryMap[cat.id] = { 
        ...cat, 
        children: [] 
      };
    });
    
    // Organize into hierarchy
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (categoryMap[cat.parent_id]) {
          categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
        }
      } else {
        rootCats.push(categoryMap[cat.id]);
      }
    });
    
    return { rootCategories: rootCats, categoryMap };
  }, [categories]);
  
  // FIX: Handle visibility toggle with correct logic
  // When checkbox is checked, the category should be visible
  const handleVisibilityToggle = (categoryId) => {
    if (onToggleVisibility) {
      onToggleVisibility(categoryId);
    }
  };
  
  // Handle expand toggle - only allow one category expanded at a time
  const handleExpandToggle = (categoryId, event) => {
    event.stopPropagation(); // Prevent triggering parent click
    
    // Toggle active category
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
    
    // Call parent handler if provided
    if (onToggleExpand) {
      onToggleExpand(categoryId);
    }
  };
  
  if (!rootCategories || rootCategories.length === 0) {
    return <div className="category-legend-empty">No categories available</div>;
  }
  
  return (
    <div className="category-legend">
      {/* Removed the heading - let the parent component handle it */}
      
      <div className="category-list">
        {rootCategories.map(category => {
          // FIX: Correct the visibility logic - true means visible
          const isVisible = categoryVisibility[category.id] !== false;
          const isExpanded = activeCategory === category.id;
          const hasChildren = category.children && category.children.length > 0;
          
          return (
            <div key={category.id} className="category-item">
              <div 
                className={`category-header ${isExpanded ? 'active' : ''}`}
              >
                {/* IMPROVED: Toggle button with better visual design */}
                <div className="toggle-container" onClick={() => handleVisibilityToggle(category.id)}>
                  <div className={`toggle-switch ${isVisible ? 'on' : 'off'}`}>
                    <div className="toggle-slider"></div>
                  </div>
                  
                  {/* Category color and name */}
                  <div className="category-label">
                    <span 
                      className="category-color-dot"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    ></span>
                    <span className="category-name">{category.name}</span>
                  </div>
                </div>
                
                {/* Expand/collapse button (only for categories with children) */}
                {hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => handleExpandToggle(category.id, e)}
                    className={`category-expand-btn ${isExpanded ? 'expanded' : ''}`}
                    aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Render children if expanded - in a horizontal layout */}
              {isExpanded && hasChildren && (
                <div className="subcategory-container">
                  {category.children.map(child => {
                    // FIX: Correct the visibility logic for subcategories
                    const isChildVisible = categoryVisibility[child.id] !== false;
                    
                    return (
                      <div key={child.id} 
                           className={`subcategory-chip ${isChildVisible ? 'visible' : 'hidden'}`}
                           onClick={() => handleVisibilityToggle(child.id)}>
                        <span 
                          className="subcategory-color" 
                          style={{ backgroundColor: child.color || category.color }}
                        ></span>
                        <span className="subcategory-name">{child.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryLegend;