import React, { useState, useCallback } from 'react';
import '../styles/components/categorylegend.css';

const CategoryLegend = ({ 
  categories, 
  categoryVisibility,
  expandedCategories,
  onToggleExpand
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
    return <div className="mt-4">No categories available to display</div>;
  }

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-section">
        <h2 className="sidebar-heading">Chart Categories</h2>
        <div className="space-y-2">
          {rootCategories.map(category => {
            if (!categoryVisibility[category.id]) return null;

            const isExpanded = expandedCategories[category.id];
            const hasChildren = category.children && category.children.length > 0;

            return (
              <div key={category.id} className="category-item">
                <div
                  className={`category-graph-header ${isExpanded ? 'active' : ''}`}
                  onClick={() => hasChildren && onToggleExpand(category.id)}
                  style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                >
                  {hasChildren && (
                    <div className={`category-graph-toggle ${isExpanded ? 'open' : ''}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="category-graph-name">
                    <span
                      className="category-graph-color"
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <span>{category.name}</span>
                  </div>
                </div>

                {isExpanded && hasChildren && (
                  <div className="category-graph-children">
                    {category.children.map(child => {
                      if (!categoryVisibility[child.id]) return null;

                      return (
                        <div key={child.id} className="subcategory-header">
                          <div className="subcategory-name">
                            <span
                              className="subcategory-color"
                              style={{ backgroundColor: child.color }}
                            ></span>
                            <span>{child.name}</span>
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
    </div>
  );
};

export default CategoryLegend;