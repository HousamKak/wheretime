import React, { useState, useRef, useMemo } from 'react';
import { Modal } from './common/Modal';
import TimeSeriesChart from './TimeSeriesChart';
import { Button } from './common/Button';

const CategoryCharts = ({ 
  data, 
  categories, 
  categoryVisibility, 
  expandedCategories,
  onToggleVisibility 
}) => {
  // State for modal control
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Ref for scrollable container
  const scrollContainerRef = useRef(null);
  
  // Filter to only show root categories
  const rootCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_id);
  }, [categories]);
  
  // Helper function to get child categories for a parent
  const getChildCategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };
  
  // Handle expand chart to modal
  const handleExpandChart = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };
  
  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Toggle subcategory visibility in the expanded modal view
  const handleToggleSubcategory = (categoryId) => {
    if (onToggleVisibility) {
      onToggleVisibility(categoryId);
    }
  };
  
  // Handle scroll buttons
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Match this to the width of the cards
      const container = scrollContainerRef.current;
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };
  
  // Create a simplified mini chart for a category
  const renderCategoryMiniChart = (category) => {
    // Get children for this category
    const childCategories = getChildCategories(category.id);
    
    // Create a filtered visibility map for just this category and its children
    const filteredVisibility = {};
    
    // Set all categories to invisible by default
    categories.forEach(cat => {
      filteredVisibility[cat.id] = false;
    });
    
    // Make only this category and its visible children visible
    filteredVisibility[category.id] = true;
    childCategories.forEach(child => {
      filteredVisibility[child.id] = categoryVisibility[child.id] !== false;
    });
    
    // Calculate total time for this category
    const totalTime = data.reduce((sum, day) => {
      const key = `category_${category.id}`;
      return sum + (day[key] || 0);
    }, 0);
    
    // Format time for display
    const formattedTime = formatTime(totalTime);
    
    return (
      <div key={category.id} className="cc-category-mini-chart">
        <div className="cc-category-mini-header">
          <div className="cc-category-mini-title">
            <span 
              className="cc-category-color" 
              style={{ backgroundColor: category.color }}
            ></span>
            <span>{category.name}</span>
          </div>
          <div className="cc-category-mini-total">{formattedTime}</div>
        </div>
        
        <div className="cc-category-mini-content">
          {totalTime > 0 ? (
            <TimeSeriesChart 
              data={data}
              categories={[category, ...childCategories]}
              categoryVisibility={filteredVisibility}
              expandedCategories={{ [category.id]: true }}
              isMinified={true}
              chartId={`mini-chart-${category.id}`}
            />
          ) : (
            <div className="cc-empty-chart">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              <span>No data for this period</span>
            </div>
          )}
        </div>
        
        <div className="cc-category-mini-footer">
          <Button 
            variant="outline" 
            size="sm" 
            className="cc-category-expand-btn"
            onClick={() => handleExpandChart(category)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6"></path>
              <path d="M9 21H3v-6"></path>
              <path d="M21 3l-7 7"></path>
              <path d="M3 21l7-7"></path>
            </svg>
            <span>Expand</span>
          </Button>
          
          {childCategories.length > 0 && (
            <div className="cc-category-mini-children">
              {`${childCategories.length} subcategories`}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render the expanded category modal
  const renderExpandedModal = () => {
    if (!selectedCategory) return null;
    
    // Get children of selected category
    const childCategories = getChildCategories(selectedCategory.id);
    
    // Create a filtered visibility map for the expanded view
    const modalVisibility = { ...categoryVisibility };
    
    // Make the selected category visible
    modalVisibility[selectedCategory.id] = true;
    
    // Calculate total time for this category and its children
    const categoryTotal = data.reduce((sum, day) => {
      const key = `category_${selectedCategory.id}`;
      return sum + (day[key] || 0);
    }, 0);
    
    return (
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`${selectedCategory.name} - ${formatTime(categoryTotal)}`}
        size="xl"
      >
        <div className="cc-modal-chart-container">
          {childCategories.length > 0 && (
            <div className="cc-subcategory-controls">
              <div className="cc-subcategory-controls-title">Subcategories:</div>
              {childCategories.map(child => (
                <div key={child.id} className="cc-subcategory-control-item">
                  <input
                    type="checkbox"
                    id={`subcategory-${child.id}`}
                    checked={categoryVisibility[child.id] !== false}
                    onChange={() => handleToggleSubcategory(child.id)}
                  />
                  <label htmlFor={`subcategory-${child.id}`}>
                    <span 
                      className="cc-subcategory-color"
                      style={{ backgroundColor: child.color || '#6B7280' }}
                    ></span>
                    <span>{child.name}</span>
                  </label>
                </div>
              ))}
            </div>
          )}
          
          <div className="cc-modal-chart" style={{ display: 'flex', flex: '1 1 auto', minHeight: '0' }}>
            <TimeSeriesChart 
              data={data}
              categories={[selectedCategory, ...childCategories]}
              categoryVisibility={modalVisibility}
              expandedCategories={{ [selectedCategory.id]: true }}
              chartId={`modal-chart-${selectedCategory.id}`}
            />
          </div>
        </div>
      </Modal>
    );
  };
  
  // Helper function to format time (minutes to hours and minutes)
  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };
  
  // If no data or categories, don't render
  if (!data?.length || rootCategories.length === 0) {
    return null;
  }
  
  return (
    <div className="cc-category-charts-container">
      <div className="cc-category-charts-header">
        <h2 className="cc-category-charts-title">Category Breakdown</h2>
        
        <div className="cc-category-charts-scroll-controls">
          <button 
            className="cc-scroll-button" 
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            className="cc-scroll-button" 
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="cc-category-charts-scrollable" ref={scrollContainerRef}>
        {rootCategories.map(renderCategoryMiniChart)}
      </div>
      
      {renderExpandedModal()}
    </div>
  );
};

export default CategoryCharts;