import React, { useState, useEffect } from 'react';
import '../../styles/components/admintable.css';

export const AdminTable = ({
  columns,
  data,
  onRowClick,
  onEdit,
  onDelete,
  onSelectionChange,
  actions = true,
  selectable = true,
  pagination = true,
  itemsPerPageOptions = [10, 25, 50, 100],
  defaultItemsPerPage = 10,
}) => {
  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  
  // State for selected rows
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);
  
  // Reset selected rows when data changes
  useEffect(() => {
    setSelectedRows([]);
    setSelectAll(false);
  }, [data]);
  
  // Effect to notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sorted data
  const getSortedData = () => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle null/undefined values
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    });
  };
  
  // Get paginated data
  const getPaginatedData = () => {
    const sortedData = getSortedData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Handle checkbox change
  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(getPaginatedData().map(row => row.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  // Generate page buttons
  const getPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page button
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="admin-table-page-button"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="admin-table-ellipsis">...</span>);
      }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`admin-table-page-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Add last page button
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="admin-table-ellipsis">...</span>);
      }
      
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="admin-table-page-button"
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };
  
  const visibleData = getPaginatedData();
  
  return (
    <div className="admin-table-container">
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {selectable && (
                <th className="admin-table-checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="admin-table-checkbox"
                  />
                </th>
              )}
              
              {columns.map(column => (
                <th 
                  key={column.key} 
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={`
                    ${column.sortable !== false ? 'admin-table-sortable' : ''}
                    ${sortConfig.key === column.key ? `admin-table-sorted-${sortConfig.direction}` : ''}
                    ${column.className || ''}
                  `}
                  style={column.width ? { width: column.width } : {}}
                >
                  {column.label}
                  {column.sortable !== false && (
                    <span className="admin-table-sort-icon">
                      {sortConfig.key === column.key && sortConfig.direction === 'asc' && '↑'}
                      {sortConfig.key === column.key && sortConfig.direction === 'desc' && '↓'}
                      {sortConfig.key !== column.key && '⇅'}
                    </span>
                  )}
                </th>
              ))}
              
              {actions && <th className="admin-table-actions-col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="admin-table-no-data">
                  No data available
                </td>
              </tr>
            ) : (
              visibleData.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`admin-table-row ${onRowClick ? 'admin-table-clickable' : ''} ${selectedRows.includes(row.id) ? 'admin-table-selected' : ''}`}
                >
                  {selectable && (
                    <td 
                      className="admin-table-checkbox-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="admin-table-checkbox"
                      />
                    </td>
                  )}
                  
                  {columns.map(column => (
                    <td 
                      key={`${row.id}-${column.key}`} 
                      className={column.cellClassName || ''}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  
                  {actions && (
                    <td className="admin-table-actions">
                      {onEdit && (
                        <button 
                          className="admin-table-action-btn admin-table-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                        </button>
                      )}
                      
                      {onDelete && (
                        <button 
                          className="admin-table-action-btn admin-table-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row);
                          }}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && data.length > 0 && (
        <div className="admin-table-pagination">
          <div className="admin-table-pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
          </div>
          
          <div className="admin-table-pagination-controls">
            <div className="admin-table-items-per-page">
              <label>
                Show
                <select 
                  value={itemsPerPage} 
                  onChange={handleItemsPerPageChange}
                  className="admin-table-select"
                >
                  {itemsPerPageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                entries
              </label>
            </div>
            
            <div className="admin-table-pages">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="admin-table-page-nav"
              >
                Previous
              </button>
              
              <div className="admin-table-page-numbers">
                {getPageButtons()}
              </div>
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="admin-table-page-nav"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTable