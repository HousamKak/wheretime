import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';

const TimeSeriesChart = ({ data, categories, categoryVisibility, expandedCategories }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const margin = { top: 30, right: 70, bottom: 60, left: 70 };

  // Process the category hierarchy once with useMemo to avoid recalculating
  const categoryHierarchy = useMemo(() => {
    const categoryMap = {};
    const rootCategories = [];

    // Create category objects
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: [],
      };
    });

    // Build hierarchy
    categories.forEach(category => {
      if (category.parent_id) {
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(categoryMap[category.id]);
        }
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    return { categoryMap, rootCategories };
  }, [categories]);

  // Initialize dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement.clientWidth;
        const containerHeight = Math.max(400, containerWidth * 0.5);
        
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

  // Create chart whenever data, dimensions, or visibility changes
  useEffect(() => {
    if (!data || data.length === 0 || !dimensions.width || !dimensions.height || !categories || categories.length === 0) {
      return;
    }

    // Extract visible categories based on categoryVisibility
    const visibleCategories = categories.filter(category => 
      categoryVisibility[category.id] !== false
    );

    if (visibleCategories.length === 0) {
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
      const formattedData = data.map(d => ({
        ...d,
        date: typeof d.date === 'string' ? new Date(d.date) : d.date
      }));

      // Create scales
      const xDomain = d3.extent(formattedData, d => d.date);
      
      const xScale = d3.scaleTime()
        .domain(xDomain)
        .range([0, innerWidth])
        .nice();

      // Prepare stacked data
      let stackedData = formattedData.map(dayData => {
        const day = { date: dayData.date };
        let yBase = 0;
        
        // Process root categories first
        categoryHierarchy.rootCategories.forEach(rootCategory => {
          if (categoryVisibility[rootCategory.id] !== false) {
            let categoryValue = dayData[`category_${rootCategory.id}`] || 0;
            
            // If this category is expanded, we need to handle children separately
            if (expandedCategories[rootCategory.id]) {
              // Subtract visible children values from parent
              rootCategory.children.forEach(child => {
                if (categoryVisibility[child.id] !== false) {
                  categoryValue -= dayData[`category_${child.id}`] || 0;
                }
              });
              
              // Ensure value is not negative
              categoryValue = Math.max(0, categoryValue);
              
              // Add parent value first
              day[`parent_${rootCategory.id}`] = { 
                value: categoryValue, 
                y0: yBase, 
                y1: yBase + categoryValue, 
                category: rootCategory,
                isParent: true
              };
              
              yBase += categoryValue;
              
              // Then add each visible child
              rootCategory.children.forEach(child => {
                if (categoryVisibility[child.id] !== false) {
                  const childValue = dayData[`category_${child.id}`] || 0;
                  
                  day[`child_${child.id}`] = { 
                    value: childValue, 
                    y0: yBase, 
                    y1: yBase + childValue, 
                    category: child,
                    isChild: true
                  };
                  
                  yBase += childValue;
                }
              });
            } else {
              // Category not expanded, just add the total value
              day[`category_${rootCategory.id}`] = { 
                value: categoryValue, 
                y0: yBase, 
                y1: yBase + categoryValue, 
                category: rootCategory
              };
              
              yBase += categoryValue;
            }
          }
        });
        
        day.total = yBase;
        return day;
      });

      // Find max y value for scale
      const maxY = d3.max(stackedData, d => d.total) || 0;

      const yScale = d3.scaleLinear()
        .domain([0, maxY > 0 ? maxY * 1.1 : 10])
        .range([innerHeight, 0])
        .nice();

      // Create axes
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
      Object.keys(stackedData[0] || {}).forEach(key => {
        if (key === 'date' || key === 'total') return;
        
        // Get a sample data point to extract category info
        const samplePoint = stackedData[0][key];
        if (!samplePoint || !samplePoint.category) return;
        
        const category = samplePoint.category;
        const isChild = key.startsWith('child_');
        
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
          .attr('fill-opacity', isChild ? 0.8 : 0.6) // Child categories are slightly more opaque
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
          .attr('stroke-width', 2)
          .attr('d', lineGenerator);
      });

      // Add hover effects
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
                if (expandedCategories[rootCategory.id]) {
                  // Add parent category
                  const parentKey = `parent_${rootCategory.id}`;
                  const parentData = d[parentKey];
                  
                  if (parentData) {
                    tooltipContent += `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center;">
                        <div style="display: flex; align-items: center;">
                          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${rootCategory.color}; margin-right: 6px;"></span>
                          <span>${rootCategory.name}:</span>
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
                      
                      if (childData) {
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
                  
                  if (categoryData) {
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
    } catch (error) {
      console.error("Error creating chart:", error);
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

  // Placeholder when no data is available
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 text-center">No data available for the selected date range</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
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