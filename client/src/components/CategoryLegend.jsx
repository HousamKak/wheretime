import React, { useState, useEffect, useMemo } from 'react';
import '../styles/components/categorylegend.css';

const CategoryLegend = ({ 
  categories = [], 
  categoryVisibility = {}, 
  expandedCategories = {}, 
  onToggleExpand,
  onToggleVisibility
}) => {
  // State to track UI expansion of categories (for showing subcategory list)
  const [expandedUI, setExpandedUI] = useState({});
  
  // Organize categories into a hierarchy using useMemo for better performance
  const { rootCategories, categoryMap } = useMemo(() => {
    const rootCats = [];
    const catMap = {};
    
    // Create objects for all categories
    categories.forEach(cat => {
      catMap[cat.id] = { 
        ...cat, 
        children: [] 
      };
    });
    
    // Organize into hierarchy
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (catMap[cat.parent_id]) {
          catMap[cat.parent_id].children.push(catMap[cat.id]);
        }
      } else {
        rootCats.push(catMap[cat.id]);
      }
    });
    
    return { rootCategories: rootCats, categoryMap: catMap };
  }, [categories]);
  
  // Reset UI expansion when category visibility changes
  useEffect(() => {
    // Create a new expanded UI state that respects category visibility
    const newExpandedUI = {...expandedUI};
    
    // For each category, if it's not visible, collapse its UI
    Object.keys(categoryVisibility).forEach(id => {
      if (categoryVisibility[id] === false && newExpandedUI[id]) {
        newExpandedUI[id] = false;
      }
    });
    
    setExpandedUI(newExpandedUI);
  }, [categoryVisibility]);
  
  // Handle main category toggle
  const handleMainToggle = (categoryId) => {
    if (!onToggleVisibility) return;
    
    // Get all subcategories
    const children = categoryMap[categoryId]?.children || [];
    
    // Get current visibility state of main category
    const isCurrentlyVisible = categoryVisibility[categoryId] !== false;
    
    // If turning OFF the main category
    if (isCurrentlyVisible) {
      // Toggle main category off
      onToggleVisibility(categoryId);
      
      // Turn off all subcategories too
      children.forEach(child => {
        if (categoryVisibility[child.id] !== false) {
          onToggleVisibility(child.id);
        }
      });
      
      // Also reset sum graph state if turning off the main category
      if (expandedCategories[categoryId] && onToggleExpand) {
        onToggleExpand(categoryId);
      }
      
      // Collapse the UI for this category
      setExpandedUI(prev => ({
        ...prev,
        [categoryId]: false
      }));
    } else {
      // Main category is currently invisible, so we're turning it on
      onToggleVisibility(categoryId);
      
      // Do not automatically turn on subcategories when main is turned on
      // Let user control individual subcategories
    }
  };
  
  // Toggle subcategory visibility (only when main category is visible)
  const handleSubcategoryToggle = (parentId, childId) => {
    // Only allow toggle if parent is visible
    if (categoryVisibility[parentId] !== false && onToggleVisibility) {
      onToggleVisibility(childId);
    }
  };
  
  // Toggle UI expansion for a category (shows/hides subcategory list)
  const handleUIExpand = (categoryId) => {
    setExpandedUI(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Handle toggling the sum graph visibility
  const handleSumToggle = (categoryId, event) => {
    event.stopPropagation(); // Prevent triggering UI expansion
    
    // This is for showing the aggregation graph of only the selected subcategories
    if (onToggleExpand) {
      onToggleExpand(categoryId);
    }
  };
  
  if (!rootCategories || rootCategories.length === 0) {
    return <div className="category-legend-empty">No categories available</div>;
  }
  
  return (
    <div className="category-legend">
      <div className="category-list">
        {rootCategories.map(category => {
          const isMainVisible = categoryVisibility[category.id] !== false;
          const hasChildren = category.children && category.children.length > 0;
          const isUIExpanded = expandedUI[category.id];
          
          // Whether the sum graph is showing (true = sum is visible)
          const isSumVisible = expandedCategories[category.id] === true;
          
          return (
            <div key={category.id} className="category-item">
              <div className={`category-header ${isUIExpanded ? 'expanded' : ''}`}>
                {/* Main category toggle */}
                <div 
                  className="toggle-container" 
                  onClick={() => handleMainToggle(category.id)}
                >
                  <div className={`toggle-switch ${isMainVisible ? 'on' : 'off'}`}>
                    <div className="toggle-slider"></div>
                  </div>
                  
                  <div className="category-label">
                    <span 
                      className="category-color-dot"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    ></span>
                    <span className="category-name">{category.name}</span>
                  </div>
                </div>
                
                <div className="category-controls">
                  {/* Sum graph toggle button - only for categories with children */}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => handleSumToggle(category.id, e)}
                      className={`sum-toggle ${isSumVisible ? 'active' : ''}`}
                      title={isSumVisible ? "Hide aggregated graph" : "Show aggregated graph of selected subcategories"}
                      disabled={!isMainVisible} // Disable when main category is off
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Expand/collapse UI button - only for categories with children */}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => handleUIExpand(category.id)}
                      className={`expand-btn ${isUIExpanded ? 'active' : ''}`}
                      title={isUIExpanded ? "Hide subcategory list" : "Show subcategory list"}
                      disabled={!isMainVisible} // Disable when main category is off
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Show subcategory list if this category is expanded in the UI and main category is visible */}
              {isUIExpanded && hasChildren && isMainVisible && (
                <div className="subcategory-container">
                  {category.children.map(child => {
                    const isChildVisible = categoryVisibility[child.id] !== false;
                    
                    return (
                      <div 
                        key={child.id} 
                        className={`subcategory-chip ${isChildVisible ? 'visible' : 'hidden'}`}
                        onClick={() => handleSubcategoryToggle(category.id, child.id)}
                      >
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