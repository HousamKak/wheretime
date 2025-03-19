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
        // Small delay before clearing selected category to prevent UI flicker
        setTimeout(() => setSelectedCategory(null), 300);
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
            // Some days might have the category data directly, others might have it nested
            let dayValue = 0;

            if (day[key] && typeof day[key] === 'object' && day[key].value !== undefined) {
                // If the data is structured as an object with a value property
                dayValue = day[key].value;
            } else if (day[key] && typeof day[key] === 'number') {
                // If the data is a simple number
                dayValue = day[key];
            } else if (day[key] && day[key].y1 !== undefined && day[key].y0 !== undefined) {
                // If the data contains stacked coordinates
                dayValue = day[key].y1 - day[key].y0;
            }

            return sum + dayValue;
        }, 0);

        // For debugging
        if (totalTime > 0) {
            console.log(`Category ${category.name} (${category.id}) total time: ${totalTime} minutes`);
        } else {
            console.log(`Category ${category.name} (${category.id}) has no time recorded`);
        }
        // Format time for display
        const formattedTime = formatTime(totalTime);

        // Each mini chart needs a unique ID
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
                    {/* Always render the chart regardless of totalTime */}
                    <TimeSeriesChart
                        data={data}
                        categories={[category, ...childCategories]}
                        categoryVisibility={filteredVisibility}
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

        // Create a unique ID for the modal chart
        const modalChartId = `modal-chart-${selectedCategory.id}-${Date.now()}`;

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

                    <div
                        className="cc-modal-chart"
                        style={{
                            display: 'flex',
                            flex: '1 1 auto',
                            height: 'calc(100% - 4rem)', /* Subtract subcategory controls height */
                            minHeight: '400px' /* Ensure minimum height */
                        }}
                    >
                        <TimeSeriesChart
                            data={data}
                            categories={[selectedCategory, ...childCategories]}
                            categoryVisibility={modalVisibility}
                            expandedCategories={{ [selectedCategory.id]: true }}
                            chartId={modalChartId}
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