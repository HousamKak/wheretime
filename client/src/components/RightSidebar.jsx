import React from 'react';
import CategoryLegend from './CategoryLegend';
import '../styles/components/rightsidebar.css';

const RightSidebar = ({ 
  isOpen, 
  onClose, 
  categories, 
  categoryVisibility, 
  expandedCategories, 
  onToggleExpand,
  onToggleVisibility 
}) => {
  return (
    <aside className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close right sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.79 14.77a.75.75 0 01.02-1.06L8.832 10l3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
        <h2>Categories</h2>
      </div>
      
      <div className="sidebar-content">
        <CategoryLegend 
          categories={categories}
          categoryVisibility={categoryVisibility}
          expandedCategories={expandedCategories}
          onToggleExpand={onToggleExpand}
          onToggleVisibility={onToggleVisibility}
        />
      </div>
    </aside>
  );
};

export default RightSidebar;