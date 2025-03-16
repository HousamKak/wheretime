import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { format, parseISO } from 'date-fns';

const TimeSeriesChart = ({ data, categories, categoryVisibility }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [expandedCategories, setExpandedCategories] = useState({});
  const margin = { top: 30, right: 70, bottom: 60, left: 70 };

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

    console.log("Root categories:", rootCategories);
    return { categoryMap, rootCategories };
  }, [categories]);

  // Calculate aggregated data that combines child categories into their parents
  const calculateAggregatedData = useCallback(() => {
    console.log("Calculating aggregated data");
    if (!data || data.length === 0) {
      console.warn("No data for aggregation");
      return [];
    }

    try {
      const { categoryMap } = processCategoryHierarchy();
      const aggregatedData = JSON.parse(JSON.stringify(data)); // Deep clone data

      // Calculate aggregated values for parent categories
      aggregatedData.forEach(day => {
        // Initialize all categories to 0
        categories.forEach(category => {
          if (!day.hasOwnProperty(`category_${category.id}`)) {
            day[`category_${category.id}`] = 0;
          }
        });

        // For expanded categories, subtract child values from parent to avoid double counting
        Object.keys(expandedCategories).forEach(parentId => {
          if (expandedCategories[parentId]) {
            const parent = categoryMap[parentId];
            if (parent && parent.children && parent.children.length > 0) {
              // Find all child categories
              parent.children.forEach(child => {
                // Subtract child value from parent if child is visible
                if (categoryVisibility[child.id]) {
                  day[`category_${parentId}`] -= day[`category_${child.id}`] || 0;
                }
              });

              // Ensure no negative values
              if (day[`category_${parentId}`] < 0) {
                day[`category_${parentId}`] = 0;
              }
            }
          }
        });
      });

      return aggregatedData;
    } catch (error) {
      console.error("Error in calculateAggregatedData:", error);
      return [];
    }
  }, [data, categories, expandedCategories, categoryVisibility, processCategoryHierarchy]);

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Initialize dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement.clientWidth;
        const containerHeight = Math.max(450, containerWidth * 0.5);
        console.log("Container dimensions:", { width: containerWidth, height: containerHeight });
        
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    // Set initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);

    // Clean up listener on unmount
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create chart whenever data, dimensions, or visibility changes
  useEffect(() => {
    // First check if we have valid props
    console.log("TimeSeriesChart props check:");
    console.log("- Data:", data ? `${data.length} items` : "No data");
    console.log("- Categories:", categories ? `${categories.length} items` : "No categories");
    console.log("- CategoryVisibility:", categoryVisibility ? Object.keys(categoryVisibility).length : "No visibility settings");
    
    if (!data || data.length === 0) {
      console.warn("No data provided to TimeSeriesChart");
      return;
    }
    
    if (!categories || categories.length === 0) {
      console.warn("No categories provided to TimeSeriesChart");
      return;
    }
    
    if (!categoryVisibility || Object.keys(categoryVisibility).length === 0) {
      console.warn("No category visibility settings provided to TimeSeriesChart");
      return;
    }
    
    // Check data format
    const firstItem = data[0];
    console.log("First data item sample:", firstItem);
    
    if (!svgRef.current || !tooltipRef.current) {
      console.warn("Refs not initialized");
      return;
    }

    try {
      // Clear previous chart
      d3.select(svgRef.current).selectAll('*').remove();

      // Process categories
      const { rootCategories } = processCategoryHierarchy();
      console.log("Processed root categories:", rootCategories);

      // Get aggregated data that accounts for expanded categories
      const aggregatedData = calculateAggregatedData();
      console.log("Aggregated data sample (first 2 items):", aggregatedData.slice(0, 2));

      if (aggregatedData.length === 0) {
        console.warn("No data after aggregation");
        return;
      }

      // Calculate inner dimensions
      const innerWidth = dimensions.width - margin.left - margin.right;
      const innerHeight = dimensions.height - margin.top - margin.bottom;
      console.log("Chart dimensions:", {dimensions, innerWidth, innerHeight});

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create scales
      let xDomain;
      try {
        xDomain = d3.extent(aggregatedData, d => {
          if (!d.date) {
            console.warn("Data item missing date:", d);
            return null;
          }
          const date = new Date(d.date);
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date found: ${d.date}`);
            return null;
          }
          return date;
        }).filter(d => d !== null);
        
        console.log("X domain:", xDomain);
        
        if (!xDomain[0] || !xDomain[1]) {
          console.error("Invalid X domain calculated:", xDomain);
          throw new Error("Cannot calculate valid date range for chart");
        }
      } catch (error) {
        console.error("Error calculating X domain:", error);
        return;
      }

      const xScale = d3.scaleTime()
        .domain(xDomain)
        .range([0, innerWidth])
        .nice();

      // Find max y value across all visible categories
      const maxY = d3.max(aggregatedData, d => {
        let sum = 0;
        categories.forEach(category => {
          if (categoryVisibility[category.id]) {
            sum += d[`category_${category.id}`] || 0;
          }
        });
        return sum;
      }) || 0; // Provide default of 0 if result is undefined
      
      console.log("Max Y value:", maxY);

      const yScale = d3.scaleLinear()
        .domain([0, maxY > 0 ? maxY * 1.1 : 10]) // Add 10% padding or use default of 10 if no data
        .range([innerHeight, 0])
        .nice();

      // Create axes
      const xAxis = d3.axisBottom(xScale)
        .ticks(Math.min(aggregatedData.length, innerWidth / 80)) // Responsive number of ticks
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
        .attr('color', 'var(--color-gray-600)')
        .selectAll('text')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end');

      svg.append('g')
        .call(yAxis)
        .attr('font-size', '12px')
        .attr('color', 'var(--color-gray-600)');

      // Prepare tooltip
      const tooltip = d3.select(tooltipRef.current)
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('z-index', '100');

      // Add axis labels
      svg.append('text')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', 'var(--color-gray-700)')
        .text('Time Spent (hours/minutes)');

      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', 'var(--color-gray-700)')
        .text('Date');

      // Create area generator and line generator
      const areaGenerator = d3.area()
        .x(d => xScale(new Date(d.date)))
        .y0(innerHeight)
        .y1(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      const lineGenerator = d3.line()
        .x(d => xScale(new Date(d.date)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Define a stack generator to create stacked areas
      const stackedData = [];

      // For each date, create an array of category values for visible categories
      try {
        aggregatedData.forEach(d => {
          const dateObj = { date: d.date };
          let cumulative = 0;
          let hasAnyValue = false; // Track if we have any non-zero values

          // First process parent categories
          rootCategories.forEach(category => {
            if (categoryVisibility[category.id]) {
              if (expandedCategories[category.id]) {
                // If expanded, use the adjusted value (which has children subtracted)
                const value = d[`category_${category.id}`] || 0;
                // Include even zero values
                dateObj[`category_${category.id}`] = {
                  value,
                  start: cumulative,
                  end: cumulative + value,
                  category
                };
                if (value > 0) {
                  hasAnyValue = true;
                  cumulative += value;
                }

                // Add children separately
                if (category.children && category.children.length > 0) {
                  category.children.forEach(child => {
                    if (categoryVisibility[child.id]) {
                      const childValue = d[`category_${child.id}`] || 0;
                      // Include even zero values
                      dateObj[`category_${child.id}`] = {
                        value: childValue,
                        start: cumulative,
                        end: cumulative + childValue,
                        category: child
                      };
                      if (childValue > 0) {
                        hasAnyValue = true;
                        cumulative += childValue;
                      }
                    }
                  });
                }
              } else {
                // If not expanded, use the full value
                const value = d[`category_${category.id}`] || 0;
                // Include even zero values
                dateObj[`category_${category.id}`] = {
                  value,
                  start: cumulative,
                  end: cumulative + value,
                  category
                };
                if (value > 0) {
                  hasAnyValue = true;
                  cumulative += value;
                }
              }
            }
          });

          // Always add data points even with all zeros
          dateObj.total = cumulative;
          stackedData.push(dateObj);
        });
      } catch (error) {
        console.error("Error processing stacked data:", error);
        return;
      }

      console.log(`Created ${stackedData.length} stacked data points`);
      let hasAnyNonZeroData = stackedData.some(d => d.total > 0);
      console.log("Has any non-zero data:", hasAnyNonZeroData);

      if (!hasAnyNonZeroData) {
        console.log("All data values are zero - rendering placeholder");
        
        // Add a placeholder message on the chart
        svg.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('font-size', '16px')
          .attr('fill', 'var(--color-gray-500)')
          .text('No time data available for the selected period');
          
        // Return after drawing axes and placeholder - no need to draw the actual chart
        return;
      }

      // Generate an array of all category IDs to display
      const visibleCategoryIds = [];

      // First add parent categories
      rootCategories.forEach(category => {
        if (categoryVisibility[category.id]) {
          visibleCategoryIds.push(category.id);

          // If expanded, add children
          if (expandedCategories[category.id] && category.children) {
            category.children.forEach(child => {
              if (categoryVisibility[child.id]) {
                visibleCategoryIds.push(child.id);
              }
            });
          }
        }
      });

      console.log("Visible category IDs:", visibleCategoryIds);
      if (visibleCategoryIds.length === 0) {
        console.warn("No visible categories");
        // Draw empty chart with axes only
        return;
      }

      // Reverse to draw from bottom to top (for proper stacking)
      visibleCategoryIds.reverse();

      // Draw stacked areas
      visibleCategoryIds.forEach(categoryId => {
        // Get category data
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
          console.warn(`Category ID ${categoryId} not found in categories`);
          return;
        }

        // Extract data points for this category
        const categoryData = stackedData
          .map(d => ({
            date: d.date,
            value: d[`category_${categoryId}`]?.value || 0,
            start: d[`category_${categoryId}`]?.start || 0,
            end: d[`category_${categoryId}`]?.end || 0
          }));

        console.log(`Rendering category ${category.name} with ${categoryData.length} data points`);

        try {
          // Create custom area generator for stacked areas
          const stackedAreaGenerator = d3.area()
            .x(d => xScale(new Date(d.date)))
            .y0(d => yScale(d.start))
            .y1(d => yScale(d.end))
            .curve(d3.curveMonotoneX);

          // Add the stacked area
          svg.append('path')
            .datum(categoryData)
            .attr('fill', category.color || '#ccc')
            .attr('fill-opacity', 0.7)
            .attr('d', stackedAreaGenerator);

          // Add the top line
          svg.append('path')
            .datum(categoryData)
            .attr('fill', 'none')
            .attr('stroke', category.color || '#ccc')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
              .x(d => xScale(new Date(d.date)))
              .y(d => yScale(d.end))
              .curve(d3.curveMonotoneX)
            );
        } catch (error) {
          console.error(`Error rendering category ${category.name}:`, error);
        }
      });

      // Create overlay for hover interactions across the entire chart
      const focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

      focus.append('line')
        .attr('class', 'x-hover-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'var(--color-gray-400)')
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
            const bisectDate = d3.bisector(d => new Date(d.date)).left;
            const index = bisectDate(stackedData, x0, 1);
            if (index >= stackedData.length) return;

            const d0 = stackedData[Math.max(0, index - 1)];
            const d1 = stackedData[index];

            if (!d0 || !d1) return;

            const d = x0 - new Date(d0.date) > new Date(d1.date) - x0 ? d1 : d0;

            // Position the vertical line
            focus.attr('transform', `translate(${xScale(new Date(d.date))},0)`);

            // Create tooltip content
            let tooltipContent = `
              <div class="tooltip-title">
                ${format(new Date(d.date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div>
            `;

            // Add each visible category to the tooltip
            let hasData = false;

            // First add parent categories
            rootCategories.forEach(category => {
              if (categoryVisibility[category.id]) {
                const categoryData = d[`category_${category.id}`];
                const value = categoryData ? categoryData.value : 0;

                tooltipContent += `
                  <div class="tooltip-value" style="margin-bottom: 4px;">
                    <span style="display: flex; align-items: center;">
                      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${category.color}; margin-right: 6px;"></span>
                      <span>${category.name}:</span>
                    </span>
                    <span style="font-weight: 600; margin-left: 12px;">${formatTime(value)}</span>
                  </div>
                `;
                
                if (value > 0) {
                  hasData = true;
                }

                // If expanded, add children
                if (expandedCategories[category.id] && category.children) {
                  category.children.forEach(child => {
                    if (categoryVisibility[child.id]) {
                      const childData = d[`category_${child.id}`];
                      const childValue = childData ? childData.value : 0;

                      tooltipContent += `
                        <div class="tooltip-value" style="margin-left: 16px; margin-bottom: 4px; font-size: 0.8em;">
                          <span style="display: flex; align-items: center;">
                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${child.color}; margin-right: 6px;"></span>
                            <span>${child.name}:</span>
                          </span>
                          <span style="font-weight: 500; margin-left: 12px;">${formatTime(childValue)}</span>
                        </div>
                      `;
                      
                      if (childValue > 0) {
                        hasData = true;
                      }
                    }
                  });
                }
              }
            });

            // Add total
            tooltipContent += `
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-gray-200);">
                <div class="tooltip-value" style="font-weight: 600;">
                  <span>Total:</span>
                  <span>${formatTime(d.total || 0)}</span>
                </div>
              </div>
            `;

            // Always show tooltip, even with zeros
            tooltip
              .style('visibility', 'visible')
              .html(tooltipContent);

            // Position tooltip near the mouse but ensure it stays within the viewport
            const tooltipNode = tooltipRef.current;
            const tooltipWidth = tooltipNode.getBoundingClientRect().width;
            const tooltipHeight = tooltipNode.getBoundingClientRect().height;

            const chartRect = svgRef.current.getBoundingClientRect();
            const tooltipX = event.clientX - chartRect.left + 10;
            const tooltipY = event.clientY - chartRect.top - tooltipHeight - 10;

            // Adjust if the tooltip would go off the right edge
            const adjustedX = Math.min(tooltipX, chartRect.width - tooltipWidth - 20);
            const adjustedY = Math.max(tooltipY, 10); // Ensure it doesn't go off the top

            tooltip
              .style('left', `${adjustedX}px`)
              .style('top', `${adjustedY}px`);
          } catch (error) {
            console.error("Error handling mouse interaction:", error);
            tooltip.style('visibility', 'hidden');
          }
        });

      console.log("Chart render complete");
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, [data, dimensions, categories, categoryVisibility, expandedCategories, processCategoryHierarchy, calculateAggregatedData]);

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

  // Render category legend with expand/collapse controls
  const renderCategoryLegend = () => {
    const { rootCategories } = processCategoryHierarchy();

    console.log("Root categories for legend:", rootCategories);

    if (!rootCategories || rootCategories.length === 0) {
      return <div className="mt-4">No categories available to display</div>;
    }

    return (
      <div className="mt-4 category-legend">
        <h3 className="text-md font-semibold mb-2">Categories</h3>

        <div className="space-y-2">
          {rootCategories.map(category => {
            if (!categoryVisibility[category.id]) return null;

            const isExpanded = expandedCategories[category.id];
            const hasChildren = category.children && category.children.length > 0;

            return (
              <div key={category.id} className="category-item">
                <div
                  className={`category-graph-header ${isExpanded ? 'active' : ''}`}
                  onClick={() => hasChildren && toggleCategoryExpansion(category.id)}
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
    );
  };

  // Placeholder when no data is available
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500 text-center">No data available for the selected date range</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or logging some time</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="relative">
        <svg ref={svgRef} className="w-full"></svg>
        <div ref={tooltipRef} className="tooltip"></div>
      </div>
      {renderCategoryLegend()}
    </div>
  );
};

export default TimeSeriesChart;