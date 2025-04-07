import React, { useState, useRef, useMemo } from 'react';
import { ChartModal } from './ChartModal';
import TimeSeriesChart from './TimeSeriesChart';
import { Button } from './common/Button';

const CategoryCharts = ({
  data,
  categories,
  categoryVisibility,
  expandedCategories,
  onToggleVisibility,
}) => {
  // State for modal control
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for modal-specific visibility settings
  const [modalVisibility, setModalVisibility] = useState({});

  // Ref for scrollable container
  const scrollContainerRef = useRef(null);

  // Filter to only show root categories
  const rootCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parent_id);
  }, [categories]);

  // Helper function to get child categories for a parent
  const getChildCategories = (parentId) => {
    return categories.filter((cat) => cat.parent_id === parentId);
  };

  // Helper function to safely extract a day's value (treat missing or invalid values as 0)
  const getDayValue = (day, key) => {
    let dayValue = 0;
    const value = day[key];
    if (value && typeof value === 'object' && value.value !== undefined) {
      dayValue = Number(value.value) || 0;
    } else if (typeof value === 'number') {
      dayValue = value;
    } else if (value && value.y1 !== undefined && value.y0 !== undefined) {
      dayValue = value.y1 - value.y0;
    }
    return dayValue;
  };

  // Handle expand chart to modal
  const handleExpandChart = (category) => {
    // Initialize modal visibility with current category visibility
    const initialModalVisibility = { ...categoryVisibility };

    // Get all subcategories
    const subcategories = getChildCategories(category.id);

    // Ensure the category and all its subcategories are set to visible in the modal
    initialModalVisibility[category.id] = true;
    subcategories.forEach((sub) => {
      initialModalVisibility[sub.id] = true;
    });

    setModalVisibility(initialModalVisibility);
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  // Toggle subcategory visibility in the expanded modal view only
  const handleToggleModalSubcategory = (categoryId) => {
    setModalVisibility((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Handle scroll buttons
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Adjust as needed
      const container = scrollContainerRef.current;

      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Calculate total time for mini chart preview
  // Only sum subcategories (ignoring the main category's own value)
  const calculateMiniTotal = (category) => {
    const childCategories = getChildCategories(category.id);
    return data.reduce((sum, day) => {
      // Start with 0 (ignore any main category value)
      let daySum = 0;
      childCategories.forEach((child) => {
        const childKey = `category_${child.id}`;
        daySum += getDayValue(day, childKey);
      });
      return sum + daySum;
    }, 0);
  };

  // Create a simplified mini chart for a category
  const renderCategoryMiniChart = (category) => {
    const childCategories = getChildCategories(category.id);
    const forcedVisibility = {};
    // Force visibility for subcategories for preview purposes
    childCategories.forEach((child) => {
      forcedVisibility[child.id] = true;
    });

    // Calculate total time from subcategories only
    const totalTime = calculateMiniTotal(category);
    const formattedTime = formatTime(totalTime);

    const miniChartId = `mini-chart-${category.id}`;

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
          <TimeSeriesChart
            data={data}
            // Show chart for main category and its subcategories
            categories={[category, ...childCategories]}
            categoryVisibility={forcedVisibility}
            expandedCategories={{ [category.id]: true }}
            isMinified={true}
            chartId={miniChartId}
          />
        </div>

        <div className="cc-category-mini-footer">
          <Button
            variant="outline"
            size="sm"
            className="cc-category-expand-btn"
            onClick={() => handleExpandChart(category)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
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

  // Calculate total time for the expanded modal view
  // Only sum time from all subcategories (ignoring any value on the main category)
  const calculateCategoryTotal = () => {
    const childCategories = getChildCategories(selectedCategory.id);
    return data.reduce((sum, day) => {
      let daySum = 0;
      childCategories.forEach((child) => {
        const childKey = `category_${child.id}`;
        daySum += getDayValue(day, childKey);
      });
      return sum + daySum;
    }, 0);
  };

  // Render the expanded category modal
  const renderExpandedModal = () => {
    if (!selectedCategory) return null;
    const childCategories = getChildCategories(selectedCategory.id);
    const categoryTotal = calculateCategoryTotal();
    const modalChartId = `modal-chart-${selectedCategory.id}-${Date.now()}`;

    return (
      <ChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`${selectedCategory.name} - ${formatTime(categoryTotal)}`}
        size="full"
      >
        <div className="modal-chart-container">
          {childCategories.length > 0 && (
            <div className="modal-subcategory-controls">
              <div className="modal-subcategory-header">Subcategories:</div>
              <div className="modal-subcategory-items">
                {childCategories.map((child) => (
                  <div key={child.id} className="modal-subcategory-item">
                    <input
                      type="checkbox"
                      id={`subcategory-${child.id}`}
                      checked={modalVisibility[child.id] !== false}
                      onChange={() => handleToggleModalSubcategory(child.id)}
                    />
                    <label htmlFor={`subcategory-${child.id}`}>
                      <span
                        className="modal-subcategory-color"
                        style={{ backgroundColor: child.color || '#6B7280' }}
                      ></span>
                      <span>{child.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-chart-content">
            <TimeSeriesChart
              data={data}
              categories={[selectedCategory, ...childCategories]}
              categoryVisibility={modalVisibility}
              expandedCategories={{ [selectedCategory.id]: true }}
              chartId={modalChartId}
            />
          </div>
        </div>
      </ChartModal>
    );
  };

  // Helper function to format time (minutes to hours and minutes)
  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="cc-scroll-button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
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
