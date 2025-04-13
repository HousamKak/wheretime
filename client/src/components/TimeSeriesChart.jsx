import React, { useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import { format } from "date-fns";

const TimeSeriesChart = ({
  data,
  categories,
  categoryVisibility,
  expandedCategories,
  isMinified = false,
  chartId = "chart-" + Math.random().toString(36).substr(2, 9),
  // Global threshold visibility setting (for backward compatibility)
  showThresholds = true,
  // New prop for per-category threshold visibility
  categoryThresholdVisibility = {}
}) => {
  // Unique ID for this chart instance to prevent interference
  const chartInstanceId = useMemo(() => chartId, [chartId]);

  const svgRef = useRef();
  const chartContainerRef = useRef();
  const tooltipRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [chartError, setChartError] = useState(null);

  // Different margins based on chart mode
  const margin = isMinified
    ? { top: 10, right: 10, bottom: 20, left: 30 }
    : { top: 30, right: 70, bottom: 60, left: 70 };

  // Process the category hierarchy once with useMemo to avoid recalculating
  const categoryHierarchy = useMemo(() => {
    const categoryMap = {};
    const rootCategories = [];

    // Create category objects
    categories.forEach((category) => {
      categoryMap[category.id] = {
        ...category,
        children: [],
      };
    });

    // Find all categories that might be children
    const childCategories = categories.filter((cat) => cat.parent_id);

    // Build hierarchy
    childCategories.forEach((child) => {
      const parentId = child.parent_id;
      if (categoryMap[parentId]) {
        categoryMap[parentId].children.push(categoryMap[child.id]);
      }
    });

    // Collect root categories
    categories.forEach((category) => {
      if (!category.parent_id) {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    return { categoryMap, rootCategories };
  }, [categories]);

  // Initialize dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        // Get dimensions from bounding client rect for more accuracy
        const rect = chartContainerRef.current.getBoundingClientRect();
        const containerWidth =
          rect.width || chartContainerRef.current.clientWidth;

        // Use different height for minified vs modal charts
        let containerHeight;
        if (isMinified) {
          containerHeight = 120; // Fixed height for minified charts
        } else {
          // For modal and full-size charts, prioritize using container height
          if (rect.height > 50) {
            // Use actual container height if it's reasonably sized
            containerHeight = rect.height;
          } else {
            // Otherwise fallback to calculated height based on width
            containerHeight = Math.max(400, containerWidth * 0.6);
          }
        }

        // Only update dimensions if they've actually changed
        if (
          dimensions.width !== containerWidth ||
          dimensions.height !== containerHeight
        ) {
          setDimensions({
            width: containerWidth,
            height: containerHeight,
          });
        }
      }
    };

    // Initial sizing with multiple attempts to ensure DOM is fully rendered
    updateDimensions(); // Try immediately
    const initialTimer1 = setTimeout(updateDimensions, 50); // Try after 50ms
    const initialTimer2 = setTimeout(updateDimensions, 200); // Try after 200ms

    // Add resize listener
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Also listen to window resize events for good measure
    window.addEventListener("resize", updateDimensions);

    // Cleanup
    return () => {
      clearTimeout(initialTimer1);
      clearTimeout(initialTimer2);
      if (chartContainerRef.current) {
        resizeObserver.unobserve(chartContainerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [chartInstanceId, dimensions, isMinified]);

  // Create chart whenever data, dimensions, or visibility changes
  useEffect(() => {
    // Only create chart if dimensions are valid
    if (
      !dimensions.width ||
      !dimensions.height ||
      dimensions.width < 10 ||
      dimensions.height < 10
    ) {
      return;
    }

    // Clear previous chart
    if (svgRef.current) {
      // Use a specific selector with the chart ID to avoid affecting other charts
      d3.select(svgRef.current).selectAll("*").remove();
    }

    if (!data || data.length === 0 || !categories || categories.length === 0) {
      return;
    }

    // Extract visible categories based on categoryVisibility
    const visibleCategories = categories.filter(
      (category) => categoryVisibility[category.id] !== false
    );

    if (visibleCategories.length === 0) {
      // No visible categories, clear chart and show message
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      svg
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6B7280")
        .text("Please select at least one category to display data");

      return;
    }

    try {
      setChartError(null);

      // Create the SVG container with a specific ID to avoid interference between charts
      const svg = d3
        .select(svgRef.current)
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .attr("id", `chart-svg-${chartInstanceId}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Calculate inner dimensions
      const innerWidth = dimensions.width - margin.left - margin.right;
      const innerHeight = dimensions.height - margin.top - margin.bottom;

      // Format dates properly
      const formattedData = data.map((d) => ({
        ...d,
        date: typeof d.date === "string" ? new Date(d.date) : d.date,
      }));

      // Create scales
      const xDomain = d3.extent(formattedData, (d) => d.date);

      const xScale = d3
        .scaleTime()
        .domain(xDomain)
        .range([0, innerWidth])
        .nice();

      // Prepare category series
      const processedCategories = [];
      let maxY = 0;

      // Process visible categories for the chart
      visibleCategories.forEach((category) => {
        const isParent = categoryHierarchy.rootCategories.some(
          (root) => root.id === category.id
        );

        // Prepare the time series data for this category
        const categoryKey = `category_${category.id}`;
        const seriesData = formattedData.map((day) => ({
          date: day.date,
          value: day[categoryKey] || 0,
        }));

        // Update max Y value
        const categoryMax = d3.max(seriesData, (d) => d.value);
        if (categoryMax > maxY) {
          maxY = categoryMax;
        }

        processedCategories.push({
          id: category.id,
          name: category.name,
          color: category.color,
          data: seriesData,
          isParent,
          isAggregation: false,
          threshold_minutes: category.threshold_minutes
        });
      });

      visibleCategories.forEach((category) => {
        // Only process root categories with expanded state
        const isParent = categoryHierarchy.rootCategories.some(
          (root) => root.id === category.id
        );
        const isExpanded = isParent && expandedCategories[category.id];

        if (isParent && isExpanded) {
          // Get all subcategories of this parent
          const childrenIds = categoryHierarchy.categoryMap[
            category.id
          ].children.map((child) => child.id);

          // Filter to only include subcategories that are currently visible/selected
          const visibleChildren = childrenIds.filter(
            (id) => categoryVisibility[id] !== false
          );

          if (visibleChildren.length > 0) {
            // Create aggregation data series
            const aggSeriesData = formattedData.map((day) => {
              // Sum up only the selected subcategories
              const total = visibleChildren.reduce((sum, childId) => {
                return sum + (day[`category_${childId}`] || 0);
              }, 0);

              return {
                date: day.date,
                value: total,
              };
            });

            // Update max Y value if needed
            const aggMax = d3.max(aggSeriesData, (d) => d.value);
            if (aggMax > maxY) {
              maxY = aggMax;
            }

            // Add this as a special aggregation series
            processedCategories.push({
              id: `agg_${category.id}`,
              name: `${category.name} (Sum)`,
              color: category.color, // Use same color but we'll make it thicker/dashed
              data: aggSeriesData,
              isParent: false,
              isAggregation: true,
              threshold_minutes: category.threshold_minutes
            });
          }
        }
      });

      // Create Y scale based on max value, including some extra space for thresholds
      // Find the maximum threshold value if any exists
      const maxThreshold = d3.max(processedCategories, d => d.threshold_minutes) || 0;
      const maxYValue = Math.max(maxY, maxThreshold);
      
      const yScale = d3
        .scaleLinear()
        .domain([0, maxYValue > 0 ? maxYValue * 1.1 : 10])
        .range([innerHeight, 0])
        .nice();

      // Create axes - simpler for minified mode
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(isMinified ? 3 : Math.min(formattedData.length, innerWidth / 80))
        .tickFormat((d) => format(d, isMinified ? "MM/dd" : "MMM d"));

      const yAxis = d3
        .axisLeft(yScale)
        .ticks(isMinified ? 3 : 8)
        .tickFormat((d) => {
          if (isMinified) {
            return d >= 60 ? `${Math.floor(d / 60)}h` : `${d}m`;
          }
          if (d >= 60) {
            const hours = Math.floor(d / 60);
            const minutes = d % 60;
            return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
          }
          return `${d}m`;
        });

      // Add gridlines (only for full size charts)
      if (!isMinified) {
        svg
          .append("g")
          .attr("class", "grid")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(
            d3
              .axisBottom(xScale)
              .ticks(10)
              .tickSize(-innerHeight)
              .tickFormat("")
          )
          .attr("stroke-opacity", 0.1);

        svg
          .append("g")
          .attr("class", "grid")
          .call(
            d3.axisLeft(yScale).ticks(8).tickSize(-innerWidth).tickFormat("")
          )
          .attr("stroke-opacity", 0.1);
      }

      // Add axes
      svg
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .attr("font-size", isMinified ? "9px" : "12px")
        .attr("color", "#4B5563")
        .selectAll("text")
        .attr("transform", isMinified ? "" : "rotate(-30)")
        .style("text-anchor", isMinified ? "middle" : "end");

      svg
        .append("g")
        .call(yAxis)
        .attr("font-size", isMinified ? "9px" : "12px")
        .attr("color", "#4B5563");

      // Create tooltip (only for full size charts)
      let tooltip;
      if (!isMinified && tooltipRef.current) {
        tooltip = d3
          .select(tooltipRef.current)
          .style("position", "absolute")
          .style("visibility", "hidden")
          .style("background-color", "white")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("padding", "8px")
          .style("z-index", "100")
          .style("pointer-events", "none");

        // Add axis labels (only for full size charts)
        svg
          .append("text")
          .attr("x", -innerHeight / 2)
          .attr("y", -margin.left + 15)
          .attr("transform", "rotate(-90)")
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "#374151")
          .text("Time Spent (hours/minutes)");

        svg
          .append("text")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight + margin.bottom - 10)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "#374151")
          .text("Date");
      }

      // Create line and area generators
      const lineGenerator = d3
        .line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      const areaGenerator = d3
        .area()
        .x((d) => xScale(d.date))
        .y0(() => yScale(0))
        .y1((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Add series for each processed category
      processedCategories.forEach((category, index) => {
        // Add area (only for non-aggregation series)
        if (!category.isAggregation) {
          svg
            .append("path")
            .datum(category.data)
            .attr("fill", category.color || "#ccc")
            .attr("fill-opacity", 0.3)
            .attr("d", areaGenerator);
        }

        // Add line with different styling for aggregation vs regular series
        svg
          .append("path")
          .datum(category.data)
          .attr("fill", "none")
          .attr("stroke", category.color || "#ccc")
          .attr("stroke-width", category.isAggregation ? 3 : 2) // Thicker line for aggregation
          .attr("stroke-dasharray", category.isAggregation ? "6,3" : null) // Dashed line for aggregation
          .attr("d", lineGenerator);

        // Check if this threshold should be shown based on multiple conditions:
        // 1. Category has a threshold
        // 2. Either global showThresholds is true OR
        // 3. Category-specific threshold visibility is true
        const shouldShowThreshold = category.threshold_minutes && (
          // For minified charts, use only global setting
          (isMinified && showThresholds) ||
          // For non-minified charts, first check if category-specific settings exist
          (!isMinified && (
            // If category-specific setting exists, use it
            (categoryThresholdVisibility[category.id] !== undefined 
              ? categoryThresholdVisibility[category.id] 
              // Otherwise fall back to global setting
              : showThresholds)
          ))
        );
        
        // Add threshold line if it should be shown
        if (shouldShowThreshold) {
          // Create threshold line across the width of the chart
          svg
            .append("line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", yScale(category.threshold_minutes))
            .attr("y2", yScale(category.threshold_minutes))
            .attr("stroke", category.color || "#ccc")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,4")
            .attr("class", "threshold-line");

          // Add threshold label
          svg
            .append("text")
            .attr("x", innerWidth + 5)
            .attr("y", yScale(category.threshold_minutes) - 5)
            .attr("text-anchor", "start")
            .attr("font-size", isMinified ? "8px" : "10px")
            .attr("fill", category.color || "#666")
            .text(isMinified ? "Limit" : `${category.name} Limit`);
        }
      });

      // Add hover effects (only for full size charts)
      if (!isMinified && tooltip) {
        const focus = svg
          .append("g")
          .attr("class", "focus")
          .style("display", "none");

        focus
          .append("line")
          .attr("class", "x-hover-line")
          .attr("y1", 0)
          .attr("y2", innerHeight)
          .attr("stroke", "#9CA3AF")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");

        // Create overlay rect for mouse tracking
        svg
          .append("rect")
          .attr("class", "overlay")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .on("mouseover", () => focus.style("display", null))
          .on("mouseout", () => {
            focus.style("display", "none");
            tooltip.style("visibility", "hidden");
          })
          .on("mousemove", function (event) {
            try {
              // Get x position of mouse
              const [mouseX] = d3.pointer(event, this);
              const x0 = xScale.invert(mouseX);

              // Find the closest date in the data
              const bisectDate = d3.bisector((d) => d.date).left;
              const index = bisectDate(formattedData, x0, 1);
              if (index >= formattedData.length) return;

              const d0 = formattedData[Math.max(0, index - 1)];
              const d1 = formattedData[index];
              if (!d0 || !d1) return;

              const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

              // Position the vertical line
              focus.attr("transform", `translate(${xScale(d.date)},0)`);

              // Create tooltip content
              let tooltipContent = `
                <div style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
                  ${format(d.date, "EEEE, MMMM d, yyyy")}
                </div>
                <div>
              `;
              // Group categories by whether they're parent or child categories
              const tooltipParentCategories = [];
              const tooltipChildCategories = [];

              processedCategories.forEach(category => {
                // Skip aggregation series in tooltip data
                if (category.isAggregation) return;

                const dateValue = category.data.find(item =>
                  item.date.getTime() === d.date.getTime()
                );

                if (dateValue && dateValue.value > 0) {
                  if (category.isParent) {
                    tooltipParentCategories.push({
                      name: category.name,
                      color: category.color,
                      value: dateValue.value,
                      threshold: category.threshold_minutes
                    });
                  } else {
                    tooltipChildCategories.push({
                      name: category.name,
                      color: category.color,
                      value: dateValue.value,
                      threshold: category.threshold_minutes
                    });
                  }
                }
              });

              // First show parent categories
              tooltipParentCategories.forEach(category => {
                // Determine if we should show threshold info in the tooltip
                const shouldShowThresholdInTooltip = category.threshold && (
                  categoryThresholdVisibility[category.id] !== undefined 
                    ? categoryThresholdVisibility[category.id] 
                    : showThresholds
                );
                
                const thresholdText = (shouldShowThresholdInTooltip) ? 
                  ` <span style="color: ${category.value > category.threshold ? '#ef4444' : '#10b981'}">
                     (${Math.round(category.value / category.threshold * 100)}% of limit)
                    </span>` : '';
                
                tooltipContent += `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center;">
                    <div style="display: flex; align-items: center;">
                      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${category.color}; margin-right: 6px;"></span>
                      <span>${category.name}:</span>
                    </div>
                    <span style="font-weight: 500; margin-left: 12px;">${formatTime(category.value)}${thresholdText}</span>
                  </div>
                `;
              });

              // Then show child categories
              tooltipChildCategories.forEach(category => {
                // Determine if we should show threshold info in the tooltip
                const shouldShowThresholdInTooltip = category.threshold && (
                  categoryThresholdVisibility[category.id] !== undefined 
                    ? categoryThresholdVisibility[category.id] 
                    : showThresholds
                );
                
                const thresholdText = (shouldShowThresholdInTooltip) ? 
                  ` <span style="color: ${category.value > category.threshold ? '#ef4444' : '#10b981'}">
                     (${Math.round(category.value / category.threshold * 100)}% of limit)
                    </span>` : '';
                
                tooltipContent += `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; padding-left: 12px;">
                      <div style="display: flex; align-items: center;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${category.color}; margin-right: 6px;"></span>
                        <span>${category.name}:</span>
                      </div>
                      <span style="font-weight: 500; margin-left: 12px;">${formatTime(category.value)}${thresholdText}</span>
                    </div>
                  `;
              });

              // Calculate total time properly - include both parent and child category values
              const totalValue = [...tooltipParentCategories, ...tooltipChildCategories].reduce((total, category) => {
                return total + category.value;
              }, 0);

              // Add total
              tooltipContent += `
                </div>
                <div style="margin-top: 8px; padding-top: 4px; border-top: 1px solid #E5E7EB;">
                  <div style="display: flex; justify-content: space-between; font-weight: 600;">
                    <span>Total:</span>
                    <span>${formatTime(totalValue || 0)}</span>
                  </div>
                </div>
              `;

              // Show tooltip
              tooltip.style("visibility", "visible").html(tooltipContent);

              // Position tooltip near the mouse
              const tooltipNode = tooltipRef.current;
              const tooltipWidth = tooltipNode.getBoundingClientRect().width;
              const tooltipHeight = tooltipNode.getBoundingClientRect().height;

              const chartRect = svgRef.current.getBoundingClientRect();
              const tooltipX = event.clientX - chartRect.left + 10;
              const tooltipY =
                event.clientY - chartRect.top - tooltipHeight - 10;

              // Adjust if tooltip would go off the edge
              const adjustedX = Math.min(
                tooltipX,
                chartRect.width - tooltipWidth - 20
              );
              const adjustedY = Math.max(tooltipY, 10);

              tooltip
                .style("left", `${adjustedX}px`)
                .style("top", `${adjustedY}px`);
            } catch (error) {
              console.error("Error handling mouse interaction:", error);
              tooltip.style("visibility", "hidden");
            }
          });
      }
    } catch (error) {
      console.error("Error creating chart:", error);
      setChartError(
        "Failed to render chart. There may be an issue with the data format."
      );
    }
  }, [
    data,
    dimensions,
    categories,
    categoryVisibility,
    expandedCategories,
    categoryHierarchy,
    isMinified,
    chartInstanceId,
    showThresholds,
    categoryThresholdVisibility
  ]);

  // Helper function to format time
  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return "0m";

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
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 text-center">
          No data available for the selected date range
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      ref={chartContainerRef}
      style={{
        isolation: "isolate", // Ensures this chart doesn't leak out
        display: "flex", // Allow flex sizing
        flexDirection: "column",
        flex: "1 1 auto", // Allow growing and shrinking
        minHeight: "0", // Important for flex child sizing
        overflow: "hidden", // Prevent scrolling
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          position: "relative",
          zIndex: 1,
          flex: "1 1 auto", // Allow the SVG to grow/shrink as needed
        }}
      ></svg>
      <div
        ref={tooltipRef}
        className="absolute"
        style={{ visibility: "hidden", zIndex: 2 }}
      ></div>
    </div>
  );
};

export default TimeSeriesChart;