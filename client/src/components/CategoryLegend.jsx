import React, { useMemo } from 'react';
import '../styles/components/categorylegend.css';

const CategoryLegend = ({ 
  categories = [], 
  categoryVisibility = {}, 
  expandedCategories = {}, 
  onToggleExpand,
  onToggleVisibility
}) => {
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
  
  if (!rootCategories || rootCategories.length === 0) {
    return <div className="category-legend-empty">No categories available</div>;
  }
  
  return (
    <div className="category-legend">
      <h3 className="sidebar-heading">Chart Categories</h3>
      <div className="category-list">
        {rootCategories.map(category => {
          const isVisible = categoryVisibility[category.id] !== false;
          const isExpanded = expandedCategories[category.id] === true;
          const hasChildren = category.children && category.children.length > 0;
          
          return (
            <div key={category.id} className="category-item">
              <div className="category-header">
                {/* Visibility checkbox */}
                <div className="category-visibility">
                  <input
                    type="checkbox"
                    id={`visibility-${category.id}`}
                    checked={isVisible}
                    onChange={() => onToggleVisibility && onToggleVisibility(category.id)}
                    className="category-checkbox"
                  />
                  <label 
                    htmlFor={`visibility-${category.id}`}
                    className="category-color-indicator"
                    style={{ backgroundColor: category.color || '#6B7280', opacity: isVisible ? 1 : 0.4 }}
                  ></label>
                </div>
                
                {/* Category name */}
                <div className="category-name">{category.name}</div>
                
                {/* Expand/collapse button (only for categories with children) */}
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => onToggleExpand && onToggleExpand(category.id)}
                    className={`category-expand-btn ${isExpanded ? 'expanded' : ''}`}
                    aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Render children if expanded */}
              {isExpanded && hasChildren && (
                <div className="subcategory-list">
                  {category.children.map(child => {
                    const isChildVisible = categoryVisibility[child.id] !== false;
                    
                    return (
                      <div key={child.id} className="subcategory-item">
                        <div className="subcategory-header">
                          <div className="category-visibility">
                            <input
                              type="checkbox"
                              id={`visibility-${child.id}`}
                              checked={isChildVisible}
                              onChange={() => onToggleVisibility && onToggleVisibility(child.id)}
                              className="category-checkbox"
                            />
                            <label 
                              htmlFor={`visibility-${child.id}`}
                              className="category-color-indicator"
                              style={{ backgroundColor: child.color || '#6B7280', opacity: isChildVisible ? 1 : 0.4 }}
                            ></label>
                          </div>
                          <div className="subcategory-name">{child.name}</div>
                        </div>
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