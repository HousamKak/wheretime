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
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Visibility state inside the modal
    const [modalVisibility, setModalVisibility] = useState({});

    // Scroll ref
    const scrollContainerRef = useRef(null);

    // Root categories only
    const rootCategories = useMemo(() => {
        return categories.filter(cat => !cat.parent_id);
    }, [categories]);

    // Get child categories
    const getChildCategories = parentId =>
        categories.filter(cat => cat.parent_id === parentId);

    // Expand chart to modal
    const handleExpandChart = (category) => {
        const newVisibility = { ...categoryVisibility };

        // Show category + its children
        const subs = getChildCategories(category.id);
        newVisibility[category.id] = true;
        subs.forEach(sub => {
            newVisibility[sub.id] = true;
        });

        setModalVisibility(newVisibility);
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedCategory(null), 300);
    };

    // Toggle subcategory in modal only
    const handleToggleModalSubcategory = (catId) => {
        setModalVisibility(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    // Scroll left/right
    const handleScroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 400;
        const container = scrollContainerRef.current;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // For each category, render a small “mini chart”
    const renderCategoryMiniChart = (category) => {
        const children = getChildCategories(category.id);
        // Force main category + children to visible
        const forcedVis = {};
        forcedVis[category.id] = true;
        children.forEach(child => {
            forcedVis[child.id] = true;
        });

        // Sum up total time
        const totalTime = data.reduce((sum, day) => {
            const key = `category_${category.id}`;
            let val = 0;
            const item = day[key];
            if (item && typeof item === 'object' && item.value != null) {
                val = item.value;
            } else if (typeof item === 'number') {
                val = item;
            } else if (item && item.y1 != null && item.y0 != null) {
                val = item.y1 - item.y0;
            }
            return sum + val;
        }, 0);

        return (
            <div key={category.id} className="cc-category-mini-chart">
                <div className="cc-category-mini-header">
                    <div className="cc-category-mini-title">
                        <span
                            className="cc-category-color"
                            style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                    </div>
                    <div className="cc-category-mini-total">
                        {formatTime(totalTime)}
                    </div>
                </div>
                <div className="cc-category-mini-content">
                    <TimeSeriesChart
                        data={data}
                        categories={[category, ...children]}
                        categoryVisibility={forcedVis}
                        expandedCategories={{ [category.id]: true }}
                        isMinified={true}
                        chartId={`mini-chart-${category.id}`}
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
                    {children.length > 0 && (
                        <div className="cc-category-mini-children">
                            {`${children.length} subcategories`}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Expanded modal
    const renderExpandedModal = () => {
        if (!selectedCategory) return null;
        const childCats = getChildCategories(selectedCategory.id);

        // Sum total time
        const categoryTotal = data.reduce((sum, day) => {
            const key = `category_${selectedCategory.id}`;
            let val = 0;
            const item = day[key];
            if (item && typeof item === 'object' && item.value != null) {
                val = item.value;
            } else if (typeof item === 'number') {
                val = item;
            } else if (item && item.y1 != null && item.y0 != null) {
                val = item.y1 - item.y0;
            } else {
                val = item || 0;
            }
            return sum + val;
        }, 0);

        return (
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`${selectedCategory.name} - ${formatTime(categoryTotal)}`}
                size="2xl"
            >
                <div className="modal-chart-container">
                    {childCats.length > 0 && (
                        <div className="modal-subcategory-controls">
                            <div className="modal-subcategory-header">
                                Subcategories:
                            </div>
                            <div className="modal-subcategory-items">
                                {childCats.map(child => (
                                    <div
                                        key={child.id}
                                        className="modal-subcategory-item"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`subcategory-${child.id}`}
                                            checked={
                                                modalVisibility[child.id] !==
                                                false
                                            }
                                            onChange={() =>
                                                handleToggleModalSubcategory(
                                                    child.id
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor={`subcategory-${child.id}`}
                                        >
                                            <span
                                                className="modal-subcategory-color"
                                                style={{
                                                    backgroundColor:
                                                        child.color ||
                                                        '#6B7280'
                                                }}
                                            />
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
                            categories={[selectedCategory, ...childCats]}
                            categoryVisibility={modalVisibility}
                            expandedCategories={{ [selectedCategory.id]: true }}
                            chartId={`modal-chart-${selectedCategory.id}-${Date.now()}`}
                        />
                    </div>
                </div>
            </Modal>
        );
    };

    // Format time
    const formatTime = (minutes) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${String(mins).padStart(2, '0')}m`;
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

            <div
                className="cc-category-charts-scrollable"
                ref={scrollContainerRef}
            >
                {rootCategories.map(renderCategoryMiniChart)}
            </div>

            {renderExpandedModal()}
        </div>
    );
};

export default CategoryCharts;
