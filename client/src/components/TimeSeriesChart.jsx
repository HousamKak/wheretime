import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';

const TimeSeriesChart = ({ data, categories, categoryVisibility, expandedCategories }) => {
  console.log("TimeSeriesChart render - props received:", {
    dataPoints: data?.length || 0,
    categoriesCount: categories?.length || 0,
    categoryVisibilityCount: Object.keys(categoryVisibility || {}).length,
    expandedCategoriesCount: Object.keys(expandedCategories || {}).length
  });

  console.log("Full data sample (first item):", data?.[0]);
  console.log("Full categoryVisibility state:", categoryVisibility);
  console.log("Full expandedCategories state:", expandedCategories);

  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [chartError, setChartError] = useState(null);
  
  const margin = { top: 30, right: 70, bottom: 60, left: 70 };

  // Debug component to show expansion state (can be removed in production)
  const DebugInfo = () => {
    if (process.env.NODE_ENV === 'production') return null;
    
    const expandedCount = Object.values(expandedCategories || {})
      .filter(Boolean).length;
    
    return (
      <div 
        style={{ 
          position: 'absolute', 
          top: 5, 
          right: 5, 
          background: 'rgba(0,0,0,0.05)', 
          padding: '2px 5px', 
          borderRadius: '3px',
          fontSize: '10px',
          color: '#666',
          zIndex: 10
        }}
      >
        {expandedCount > 0 ? 
          `${expandedCount} categories expanded` : 
          'No expanded categories'}
      </div>
    );
  };

  // Process the category hierarchy once with useMemo to avoid recalculating
  const categoryHierarchy = useMemo(() => {
    console.log("Processing category hierarchy for TimeSeriesChart");
    const categoryMap = {};
    const rootCategories = [];

    // Create category objects
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: [],
      };
    });

    // Find all categories that might be children
    const childCategories = categories.filter(cat => cat.parent_id);
    console.log(`Found ${childCategories.length} potential child categories`);

    // Build hierarchy
    childCategories.forEach(child => {
      const parentId = child.parent_id;
      if (categoryMap[parentId]) {
        console.log(`Adding child ${child.id} (${child.name}) to parent ${parentId}`);
        categoryMap[parentId].children.push(categoryMap[child.id]);
      } else {
        console.warn(`Parent category ${parentId} not found for child ${child.id}`);
      }
    });

    // Collect root categories
    categories.forEach(category => {
      if (!category.parent_id) {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    console.log(`Found ${rootCategories.length} root categories with hierarchy`);
    return { categoryMap, rootCategories };
  }, [categories]);

  // Initialize dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement.clientWidth;
        const containerHeight = Math.max(400, containerWidth * 0.5);
        
        console.log("Chart container dimensions:", { width: containerWidth, height: containerHeight });
        
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Helper function to prepare stacked data with expanded categories
  const prepareStackedData = (formattedData) => {
    console.log("Preparing stacked data with expandedCategories:", expandedCategories);
    
    // Get expanded category IDs for easy lookup
    const expandedCategoryIds = Object.entries(expandedCategories)
      .filter(([_, isExpanded]) => isExpanded)
      .map(([id]) => parseInt(id));
    
    console.log("Expanded category IDs:", expandedCategoryIds);
    
    try {
      return formattedData.map(dayData => {
        const day = { date: dayData.date };
        let yBase = 0;
        
        // Process root categories
        categoryHierarchy.rootCategories.forEach(rootCategory => {
          if (categoryVisibility[rootCategory.id] !== false) {
            let categoryValue = dayData[`category_${rootCategory.id}`] || 0;
            
            // Check if this category should be expanded
            const shouldExpand = expandedCategoryIds.includes(parseInt(rootCategory.id));
            console.log(`Category ${rootCategory.id} (${rootCategory.name}) expanded: ${shouldExpand}`);
            
            if (shouldExpand && rootCategory.children && rootCategory.children.length > 0) {
              // Subtract visible children values from parent
              let childrenTotal = 0;
              rootCategory.children.forEach(child => {
                if (categoryVisibility[child.id] !== false) {
                  const childValue = dayData[`category_${child.id}`] || 0;
                  childrenTotal += childValue;
                }
              });
              
              // Calculate parent's own value (subtract children values)
              const parentOwnValue = Math.max(0, categoryValue - childrenTotal);
              
              // Add parent value first
              day[`parent_${rootCategory.id}`] = { 
                value: parentOwnValue, 
                y0: yBase, 
                y1: yBase + parentOwnValue, 
                category: rootCategory,
                isParent: true
              };
              
              yBase += parentOwnValue;
              
              // Then add each visible child
              rootCategory.children.forEach(child => {
                if (categoryVisibility[child.id] !== false) {
                  const childValue = dayData[`category_${child.id}`] || 0;
                  
                  if (childValue > 0) {
                    day[`child_${child.id}`] = { 
                      value: childValue, 
                      y0: yBase, 
                      y1: yBase + childValue, 
                      category: child,
                      isChild: true
                    };
                    
                    yBase += childValue;
                    console.log(`Added child ${child.id} (${child.name}) with value ${childValue} to stacked data`);
                  }
                }
              });
            } else {
              // Category not expanded, just add the total value
              if (categoryValue > 0) {
                day[`category_${rootCategory.id}`] = { 
                  value: categoryValue, 
                  y0: yBase, 
                  y1: yBase + categoryValue, 
                  category: rootCategory
                };
                
                yBase += categoryValue;
                console.log(`Category ${rootCategory.id} is not expanded, adding total value ${categoryValue}`);
              }
            }
          }
        });
        
        day.total = yBase;
        return day;
      });
    } catch (error) {
      console.error("Error preparing stacked data:", error);
      setChartError("Error preparing chart data");
      return [];
    }
  };

  // Create chart whenever data, dimensions, or visibility changes
  useEffect(() => {
    console.log("TimeSeriesChart useEffect for chart creation triggered");
    console.log("Chart render conditions:", {
      hasData: data && data.length > 0,
      hasDimensions: dimensions.width > 0 && dimensions.height > 0,
      hasCategories: categories && categories.length > 0
    });
    
    if (!data || data.length === 0 || !dimensions.width || !dimensions.height || !categories || categories.length === 0) {
      console.warn("Missing required data for chart rendering");
      return;
    }

    // Extract visible categories based on categoryVisibility
    const visibleCategories = categories.filter(category => 
      categoryVisibility[category.id] !== false
    );
    
    console.log("Visible categories count:", visibleCategories.length);
    console.log("Visible category IDs:", visibleCategories.map(c => c.id));

    if (visibleCategories.length === 0) {
      console.warn("No visible categories, not rendering chart data");
      // No visible categories, clear chart and show message
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      
      svg.attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6B7280')
        .text('Please select at least one category to display data');
      
      return;
    }

    try {
      console.log("Starting chart creation");
      setChartError(null);
      
      // Clear previous chart
      d3.select(svgRef.current).selectAll('*').remove();
      
      // Create the SVG container
      const svg = d3.select(svgRef.current)
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Calculate inner dimensions
      const innerWidth = dimensions.width - margin.left - margin.right;
      const innerHeight = dimensions.height - margin.top - margin.bottom;

      // Format dates properly
      console.log("Formatting data dates");
      const formattedData = data.map(d => ({
        ...d,
        date: typeof d.date === 'string' ? new Date(d.date) : d.date
      }));

      // Create scales
      console.log("Creating scales");
      const xDomain = d3.extent(formattedData, d => d.date);
      console.log("X domain:", xDomain);

      const xScale = d3.scaleTime()
        .domain(xDomain)
        .range([0, innerWidth])
        .nice();

      // Prepare stacked data
      const stackedData = prepareStackedData(formattedData);

      console.log("Stacked data sample:", stackedData[0]);

      // Find max y value for scale
      const maxY = d3.max(stackedData, d => d.total) || 0;
      console.log("Max Y value:", maxY);

      const yScale = d3.scaleLinear()
        .domain([0, maxY > 0 ? maxY * 1.1 : 10])
        .range([innerHeight, 0])
        .nice();

      // Create axes
      console.log("Creating axes");
      const xAxis = d3.axisBottom(xScale)
        .ticks(Math.min(formattedData.length, innerWidth / 80))
        .tickFormat(d => format(d, 'MMM d'));

      const yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(d => {
          if (d >= 60) {
            const hours = Math.floor(d / 60);
            const minutes = d % 60;
            return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
          }
          return `${d}m`;
        });

      // Add gridlines
      svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale)
          .ticks(10)
          .tickSize(-innerHeight)
          .tickFormat('')
        )
        .attr('stroke-opacity', 0.1);

      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
          .ticks(8)
          .tickSize(-innerWidth)
          .tickFormat('')
        )
        .attr('stroke-opacity', 0.1);

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .attr('font-size', '12px')
        .attr('color', '#4B5563')
        .selectAll('text')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end');

      svg.append('g')
        .call(yAxis)
        .attr('font-size', '12px')
        .attr('color', '#4B5563');

      // Create tooltip
      const tooltip = d3.select(tooltipRef.current)
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('z-index', '100')
        .style('pointer-events', 'none');

      // Add axis labels
      svg.append('text')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#374151')
        .text('Time Spent (hours/minutes)');

      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#374151')
        .text('Date');

      // Create areas for visible categories with proper stacking
      console.log("Creating category areas");
      const stackKeys = Object.keys(stackedData[0] || {}).filter(key => 
        key !== 'date' && key !== 'total'
      );
      
      console.log("Stack keys to render:", stackKeys);
      
      // Create areas for each key
      stackKeys.forEach(key => {
        // Get a sample data point to extract category info
        const samplePoint = stackedData[0][key];
        if (!samplePoint || !samplePoint.category) {
          console.warn(`Key ${key} missing category information in sample point:`, samplePoint);
          return;
        }
        
        const category = samplePoint.category;
        const isChild = key.startsWith('child_');
        const isParent = key.startsWith('parent_');
        
        console.log(`Rendering area for ${isChild ? 'child' : isParent ? 'parent' : 'root'} category: ${category.id} (${category.name})`);
        
        // Area generator
        const areaGenerator = d3.area()
          .x(d => xScale(d.date))
          .y0(d => yScale(d[key]?.y0 || 0))
          .y1(d => yScale(d[key]?.y1 || 0))
          .curve(d3.curveMonotoneX);

        // Add area
        svg.append('path')
          .datum(stackedData)
          .attr('fill', category.color || '#ccc')
          .attr('fill-opacity', isChild ? 0.8 : (isParent ? 0.5 : 0.6)) // Different opacities for different levels
          .attr('d', areaGenerator);

        // Add line on top
        const lineGenerator = d3.line()
          .x(d => xScale(d.date))
          .y(d => yScale(d[key]?.y1 || 0))
          .curve(d3.curveMonotoneX);

        svg.append('path')
          .datum(stackedData)
          .attr('fill', 'none')
          .attr('stroke', category.color || '#ccc')
          .attr('stroke-width', isChild ? 2 : 1) // Make child lines thicker
          .attr('d', lineGenerator);
      });

      // Add hover effects
      console.log("Adding hover effects");
      const focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

      focus.append('line')
        .attr('class', 'x-hover-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#9CA3AF')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      // Create overlay rect for mouse tracking
      svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseover', () => focus.style('display', null))
        .on('mouseout', () => {
          focus.style('display', 'none');
          tooltip.style('visibility', 'hidden');
        })
        .on('mousemove', function (event) {
          try {
            // Get x position of mouse
            const [mouseX] = d3.pointer(event, this);
            const x0 = xScale.invert(mouseX);

            // Find the closest date
            const bisectDate = d3.bisector(d => d.date).left;
            const index = bisectDate(stackedData, x0, 1);
            if (index >= stackedData.length) return;

            const d0 = stackedData[Math.max(0, index - 1)];
            const d1 = stackedData[index];
            if (!d0 || !d1) return;

            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            // Position the vertical line
            focus.attr('transform', `translate(${xScale(d.date)},0)`);

            // Create tooltip content
            let tooltipContent = `
              <div style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
                ${format(d.date, 'EEEE, MMMM d, yyyy')}
              </div>
              <div>
            `;

            // Process categories in the right order for the tooltip
            categoryHierarchy.rootCategories.forEach(rootCategory => {
              if (categoryVisibility[rootCategory.id] !== false) {
                const isExpanded = expandedCategories[rootCategory.id] === true;
                
                if (isExpanded) {
                  // Add parent category (its own value)
                  const parentKey = `parent_${rootCategory.id}`;
                  const parentData = d[parentKey];
                  
                  if (parentData && parentData.value > 0) {
                    tooltipContent += `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center;">
                        <div style="display: flex; align-items: center;">
                          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${rootCategory.color}; margin-right: 6px;"></span>
                          <span>${rootCategory.name} (parent):</span>
                        </div>
                        <span style="font-weight: 500; margin-left: 12px;">${formatTime(parentData.value)}</span>
                      </div>
                    `;
                  }
                  
                  // Add visible children
                  rootCategory.children.forEach(child => {
                    if (categoryVisibility[child.id] !== false) {
                      const childKey = `child_${child.id}`;
                      const childData = d[childKey];
                      
                      if (childData && childData.value > 0) {
                        tooltipContent += `
                          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; padding-left: 16px;">
                            <div style="display: flex; align-items: center;">
                              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${child.color}; margin-right: 6px;"></span>
                              <span style="font-size: 0.9em;">${child.name}:</span>
                            </div>
                            <span style="font-weight: 500; margin-left: 12px; font-size: 0.9em;">${formatTime(childData.value)}</span>
                          </div>
                        `;
                      }
                    }
                  });
                } else {
                  // Add the whole category
                  const categoryKey = `category_${rootCategory.id}`;
                  const categoryData = d[categoryKey];
                  
                  if (categoryData && categoryData.value > 0) {
                    tooltipContent += `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center;">
                        <div style="display: flex; align-items: center;">
                          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${rootCategory.color}; margin-right: 6px;"></span>
                          <span>${rootCategory.name}:</span>
                        </div>
                        <span style="font-weight: 500; margin-left: 12px;">${formatTime(categoryData.value)}</span>
                      </div>
                    `;
                  }
                }
              }
            });

            // Add total
            tooltipContent += `
              </div>
              <div style="margin-top: 8px; padding-top: 4px; border-top: 1px solid #E5E7EB;">
                <div style="display: flex; justify-content: space-between; font-weight: 600;">
                  <span>Total:</span>
                  <span>${formatTime(d.total || 0)}</span>
                </div>
              </div>
            `;

            // Show tooltip
            tooltip
              .style('visibility', 'visible')
              .html(tooltipContent);

            // Position tooltip near the mouse
            const tooltipNode = tooltipRef.current;
            const tooltipWidth = tooltipNode.getBoundingClientRect().width;
            const tooltipHeight = tooltipNode.getBoundingClientRect().height;

            const chartRect = svgRef.current.getBoundingClientRect();
            const tooltipX = event.clientX - chartRect.left + 10;
            const tooltipY = event.clientY - chartRect.top - tooltipHeight - 10;

            // Adjust if tooltip would go off the edge
            const adjustedX = Math.min(tooltipX, chartRect.width - tooltipWidth - 20);
            const adjustedY = Math.max(tooltipY, 10);

            tooltip
              .style('left', `${adjustedX}px`)
              .style('top', `${adjustedY}px`);
          } catch (error) {
            console.error("Error handling mouse interaction:", error);
            tooltip.style('visibility', 'hidden');
          }
        });
        
      console.log("Chart rendering complete");
    } catch (error) {
      console.error("Error creating chart:", error);
      setChartError("Failed to render chart. There may be an issue with the data format.");
    }
  }, [data, dimensions, categories, categoryVisibility, expandedCategories, categoryHierarchy]);

  // Helper function to format time
  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return '0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  // Show error message if chart rendering failed
  if (chartError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-600 font-medium mb-2">Chart Error</div>
        <p className="text-red-700 text-sm">{chartError}</p>
        <button 
          className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-md"
          onClick={() => setChartError(null)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Placeholder when no data is available
  if (!data || data.length === 0) {
    console.log("No data available for chart, rendering placeholder");
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 text-center">No data available for the selected date range</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <DebugInfo />
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div 
        ref={tooltipRef} 
        className="absolute"
        style={{ visibility: 'hidden' }}
      ></div>
    </div>
  );
};

export default TimeSeriesChart;