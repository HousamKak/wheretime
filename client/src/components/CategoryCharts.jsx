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
    
    // State for modal-specific visibility settings
    const [modalVisibility, setModalVisibility] = useState({});
    
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
        // Initialize modal visibility with current category visibility
        const initialModalVisibility = {...categoryVisibility};
        
        // Get all subcategories
        const subcategories = getChildCategories(category.id);
        
        // Make sure the category and all its subcategories are visible by default in the modal
        initialModalVisibility[category.id] = true;
        subcategories.forEach(sub => {
            initialModalVisibility[sub.id] = true;
        });
        
        // Set the modal-specific visibility state
        setModalVisibility(initialModalVisibility);
        
        // Open the modal with the selected category
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    // Close the modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Small delay before clearing selected category to prevent UI flicker
        setTimeout(() => setSelectedCategory(null), 300);
    };

    // Toggle subcategory visibility in the expanded modal view only
    const handleToggleModalSubcategory = (categoryId) => {
        setModalVisibility(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
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

        // For mini charts, force all categories to be visible
        const forcedVisibility = {};

        // Set the main category and all children to visible
        forcedVisibility[category.id] = true;
        childCategories.forEach(child => {
            forcedVisibility[child.id] = true;
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
                    {/* Always render the chart with forced visibility */}
                    <TimeSeriesChart
                        data={data}
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

        // Calculate total time for this category and its children
        const categoryTotal = data.reduce((sum, day) => {
            const key = `category_${selectedCategory.id}`;
            
            // Handle different data structures
            let dayValue = 0;
            if (day[key] && typeof day[key] === 'object' && day[key].value !== undefined) {
                dayValue = day[key].value;
            } else if (day[key] && typeof day[key] === 'number') {
                dayValue = day[key];
            } else if (day[key] && day[key].y1 !== undefined && day[key].y0 !== undefined) {
                dayValue = day[key].y1 - day[key].y0;
            } else {
                dayValue = day[key] || 0;
            }
            
            return sum + dayValue;
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
                <div className="cc-modal-chart-container" style={{
                    height: "600px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    {childCategories.length > 0 && (
                        <div className="cc-subcategory-controls" style={{
                            padding: "1rem",
                            borderBottom: "1px solid #e5e7eb"
                        }}>
                            <div className="cc-subcategory-controls-title">Subcategories:</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                                {childCategories.map(child => (
                                    <div key={child.id} className="cc-subcategory-control-item" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        background: "#f9fafb",
                                        padding: "0.375rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        border: "1px solid #e5e7eb"
                                    }}>
                                        <input
                                            type="checkbox"
                                            id={`subcategory-${child.id}`}
                                            checked={modalVisibility[child.id] !== false}
                                            onChange={() => handleToggleModalSubcategory(child.id)}
                                            style={{ marginRight: "0.5rem" }}
                                        />
                                        <label htmlFor={`subcategory-${child.id}`} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            cursor: "pointer"
                                        }}>
                                            <span
                                                className="cc-subcategory-color"
                                                style={{ 
                                                    backgroundColor: child.color || '#6B7280',
                                                    width: "10px",
                                                    height: "10px",
                                                    borderRadius: "50%",
                                                    marginRight: "0.5rem"
                                                }}
                                            ></span>
                                            <span>{child.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div
                        className="cc-modal-chart"
                        style={{
                            display: 'flex',
                            flex: '1 1 auto',
                            overflow: 'hidden',
                            position: 'relative',
                            minHeight: '400px'
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
