import React, { useCallback } from 'react';
import '../styles/components/categorylegend.css';

const CategoryLegend = ({ 
  categories, 
  categoryVisibility = {},  // Provide default empty object
  expandedCategories = {},  // Provide default empty object
  onToggleExpand,
  onToggleVisibility
}) => {
  // Process categories to create hierarchy
  const processCategoryHierarchy = useCallback(() => {
    const categoryMap = {};
    const rootCategories = [];

    // First pass: Create category objects
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: [],
      };
    });

    // Second pass: Build hierarchy
    categories.forEach(category => {
      if (category.parent_id) {
        // This is a child category
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(categoryMap[category.id]);
        }
      } else {
        // This is a root category
        rootCategories.push(categoryMap[category.id]);
      }
    });

    return { categoryMap, rootCategories };
  }, [categories]);

  const { rootCategories } = processCategoryHierarchy();

  if (!rootCategories || rootCategories.length === 0) {
    return <div className="category-legend-empty">No categories available to display</div>;
  }

  return (
    <div className="category-legend">
      <h3 className="sidebar-heading">Chart Categories</h3>
      <div className="category-list">
        {rootCategories.map(category => {
          // Use default false value if not defined
          const isExpanded = !!expandedCategories[category.id];
          const isVisible = categoryVisibility[category.id] !== undefined 
            ? categoryVisibility[category.id] 
            : true;  // Default to visible
          const hasChildren = category.children && category.children.length > 0;

          return (
            <div key={category.id} className="category-item">
              <div 
                className="category-header"
                onClick={() => hasChildren && onToggleExpand && onToggleExpand(category.id)}
              >
                <div 
                  className="category-visibility"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility && onToggleVisibility(category.id);
                  }}
                >
                  <input
                    type="checkbox"
                    id={`visibility-${category.id}`}
                    checked={isVisible}
                    onChange={() => {}} // Empty handler to avoid React warning
                    className="category-checkbox"
                  />
                  <label 
                    htmlFor={`visibility-${category.id}`}
                    className={`category-color-indicator ${isVisible ? '' : 'inactive'}`}
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  ></label>
                </div>
                
                <div className="category-name">{category.name}</div>
                
                {hasChildren && (
                  <button
                    className={`category-expand-btn ${isExpanded ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand && onToggleExpand(category.id);
                    }}
                    aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              {isExpanded && hasChildren && (
                <div className="subcategory-list">
                  {category.children.map(child => {
                    const isChildVisible = categoryVisibility[child.id] !== undefined 
                      ? categoryVisibility[child.id] 
                      : true;  // Default to visible
                    
                    return (
                      <div key={child.id} className="subcategory-item">
                        <div 
                          className="subcategory-header"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility && onToggleVisibility(child.id);
                          }}
                        >
                          <div className="category-visibility">
                            <input
                              type="checkbox"
                              id={`visibility-${child.id}`}
                              checked={isChildVisible}
                              onChange={() => {}} // Empty handler to avoid React warning
                              className="category-checkbox"
                            />
                            <label 
                              htmlFor={`visibility-${child.id}`}
                              className={`category-color-indicator ${isChildVisible ? '' : 'inactive'}`}
                              style={{ backgroundColor: child.color || '#6B7280' }}
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