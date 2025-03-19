import React from 'react';
import CategoryLegend from './CategoryLegend';
import '../styles/components/rightsidebar.css';

const RightSidebar = ({ 
  isOpen, 
  onClose, 
  categories = [], 
  categoryVisibility = {}, 
  expandedCategories = {}, 
  onToggleExpand,
  onToggleVisibility 
}) => {
  console.log("RightSidebar render - props received:", {
    isOpen,
    categoriesCount: categories.length,
    categoryVisibilityCount: Object.keys(categoryVisibility).length,
    expandedCategoriesCount: Object.keys(expandedCategories).length,
    hasToggleExpand: typeof onToggleExpand === 'function',
    hasToggleVisibility: typeof onToggleVisibility === 'function'
  });
  
  const handleToggleVisibility = (categoryId) => {
    console.log("RightSidebar: handleToggleVisibility called for categoryId:", categoryId);
    if (onToggleVisibility) {
      onToggleVisibility(categoryId);
    } else {
      console.warn("RightSidebar: onToggleVisibility is not a function");
    }
  };

  const handleToggleExpand = (categoryId) => {
    console.log("RightSidebar: handleToggleExpand called for categoryId:", categoryId);
    if (onToggleExpand) {
      onToggleExpand(categoryId);
    } else {
      console.warn("RightSidebar: onToggleExpand is not a function");
    }
  };

  return (
    <aside className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Chart Categories</h2>
        <button 
          type="button"
          className="sidebar-close-btn"
          onClick={() => {
            console.log("RightSidebar: close button clicked");
            onClose();
          }}
          aria-label="Close right sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.79 14.77a.75.75 0 01.02-1.06L8.832 10l3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="sidebar-content">
        <CategoryLegend 
          categories={categories}
          categoryVisibility={categoryVisibility}
          expandedCategories={expandedCategories}
          onToggleExpand={handleToggleExpand}
          onToggleVisibility={handleToggleVisibility}
        />
      </div>
    </aside>
  );
};

export default RightSidebar;