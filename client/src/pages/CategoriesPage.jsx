import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import AdminTable from '../components/common/AdminTable';
import FilterBar from '../components/common/FilterBar';
import { Alert } from '../components/common/Alert';
import CategoryFormModal from '../components/CategoryFormModal';
import '../styles/pages/adminpages.css';

const CategoriesPage = () => {
  const { categories, updateCategories } = useApp();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Filtering state
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Build category hierarchy maps
  const categoryMaps = useMemo(() => {
    const childrenMap = {};
    const parentsMap = {};

    categories.forEach(cat => {
      if (cat.parent_id) {
        if (!childrenMap[cat.parent_id]) {
          childrenMap[cat.parent_id] = [];
        }
        childrenMap[cat.parent_id].push(cat.id);
        parentsMap[cat.id] = cat.parent_id;
      }
    });

    return { childrenMap, parentsMap };
  }, [categories]);
  
  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Calculate hierarchy level
  const getHierarchyLevel = (categoryId, parentsMap) => {
    let level = 0;
    let currentId = categoryId;

    while (parentsMap[currentId]) {
      level++;
      currentId = parentsMap[currentId];
    }

    return level;
  };

  // Process categories for display with expandable rows
  const displayCategories = useMemo(() => {
    const { childrenMap, parentsMap } = categoryMaps;
    
    // First, gather all root categories
    let rootCategories = categories.filter(cat => !cat.parent_id).map(category => {
      const hasChildren = childrenMap[category.id] && childrenMap[category.id].length > 0;
      return {
        ...category,
        level: 0,
        hasChildren
      };
    });
    
    // Apply filtering to root categories
    if (filters.parent_id === 'root') {
      // Already showing only root categories
    } else if (filters.parent_id) {
      // Show only children of the specified parent
      const parentId = parseInt(filters.parent_id);
      rootCategories = categories
        .filter(cat => cat.parent_id === parentId)
        .map(category => ({
          ...category,
          level: 1,
          hasChildren: childrenMap[category.id] && childrenMap[category.id].length > 0
        }));
    }
    
    // Apply search term to root categories
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      
      // For search, we want to include both matching categories and their parents/children
      const matchingCategoryIds = new Set();
      const matchingWithParentsIds = new Set();
      
      // Find all categories that match the search
      categories.forEach(cat => {
        if (cat.name.toLowerCase().includes(search)) {
          matchingCategoryIds.add(cat.id);
          
          // Also include all parent categories
          let parentId = cat.parent_id;
          while (parentId) {
            matchingWithParentsIds.add(parentId);
            parentId = parentsMap[parentId];
          }
        }
      });
      
      // Filter root categories to those matching or with matching children
      rootCategories = rootCategories.filter(cat => 
        matchingCategoryIds.has(cat.id) || matchingWithParentsIds.has(cat.id)
      );
    }
    
    // Now we have our filtered root categories, let's add children for expanded categories
    const result = [];
    
    const addCategoryWithChildren = (category) => {
      result.push(category);
      
      // If this category is expanded and has children, add them too
      if (expandedCategories[category.id] && childrenMap[category.id]) {
        const children = childrenMap[category.id]
          .map(childId => categories.find(c => c.id === childId))
          .filter(Boolean) // Remove any undefined values
          .map(child => ({
            ...child,
            level: category.level + 1,
            hasChildren: childrenMap[child.id] && childrenMap[child.id].length > 0
          }));
        
        // Sort children by name
        children.sort((a, b) => a.name.localeCompare(b.name));
        
        // For each child, add it and potentially its children
        children.forEach(child => {
          addCategoryWithChildren(child);
        });
      }
    };
    
    // Sort root categories by name
    rootCategories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add each root category and its children if expanded
    rootCategories.forEach(category => {
      addCategoryWithChildren(category);
    });
    
    return result;
  }, [categories, expandedCategories, filters, searchTerm, categoryMaps]);
  
  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (row) => (
        <div className="category-name-cell">
          <span 
            className="category-indent"
            style={{ paddingLeft: `${row.level * 1.5}rem` }}
          >
            {row.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoryExpansion(row.id);
                }}
                className={`expand-toggle-btn ${expandedCategories[row.id] ? 'expanded' : ''}`}
                title={expandedCategories[row.id] ? "Collapse" : "Expand"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {!row.hasChildren && row.level > 0 && (
              <span className="subcategory-indent"></span>
            )}
            <span 
              className="category-color-dot"
              style={{ backgroundColor: row.color || '#6B7280' }}
            ></span>
            {row.name}
          </span>
        </div>
      )
    },
    {
      key: 'parent_id',
      label: 'Parent Category',
      sortable: true,
      render: (row) => {
        if (!row.parent_id) return <span className="text-gray-400">None</span>;
        const parent = categories.find(cat => cat.id === row.parent_id);
        return parent ? parent.name : <span className="text-red-500">Unknown</span>;
      }
    },
    {
      key: 'color',
      label: 'Color',
      sortable: false,
      width: '100px',
      render: (row) => (
        <div className="color-preview-cell">
          <span 
            className="color-preview"
            style={{ backgroundColor: row.color || '#6B7280' }}
            title={row.color}
          ></span>
        </div>
      )
    }
  ];
  
  // Filter options
  const filterOptions = [
    {
      id: 'parent_id',
      label: 'Filter by Parent',
      options: [
        { value: 'root', label: 'Root Categories Only' },
        ...categories
          .filter(cat => !cat.parent_id) // Only top-level categories
          .map(cat => ({ 
            value: cat.id.toString(), 
            label: `Children of ${cat.name}` 
          }))
      ]
    }
  ];
  
  // Bulk actions
  const bulkActions = [
    {
      id: 'delete',
      label: 'Delete Selected',
      destructive: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
      )
    }
  ];
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset expanded categories when filters change
    setExpandedCategories({});
  };
  
  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    // When searching, expand all categories for better visibility
    if (term) {
      const expanded = {};
      categories.forEach(cat => {
        if (!cat.parent_id) {
          expanded[cat.id] = true;
        }
      });
      setExpandedCategories(expanded);
    } else {
      setExpandedCategories({});
    }
  };
  
  // Reset filters and search
  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setExpandedCategories({});
  };
  
  // Handle bulk actions
  const handleBulkAction = async (actionId) => {
    if (actionId === 'delete' && selectedRows.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedRows.length} categories? This cannot be undone.`)) {
        try {
          setLoading(true);
          setError(null);
          
          // Delete categories one by one
          for (const categoryId of selectedRows) {
            await deleteCategory(categoryId);
          }
          
          // Refresh data
          await updateCategories();
          setSelectedRows([]);
          setSuccess(`Successfully deleted ${selectedRows.length} categories.`);
        } catch (err) {
          setError('Failed to delete some categories. Some may have been deleted already.');
        } finally {
          setLoading(false);
        }
      }
    }
  };
  
  // Open modal to create new category
  const handleCreateNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };
  
  // Open modal to edit category
  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };
  
  // Handle category deletion
  const handleDelete = (category) => {
    setConfirmDelete(category);
  };
  
  // Confirm category deletion
  const confirmDeleteCategory = async () => {
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      await deleteCategory(confirmDelete.id);
      
      // Refresh categories
      await updateCategories();
      
      setSuccess(`Category "${confirmDelete.name}" deleted successfully.`);
      setConfirmDelete(null);
    } catch (err) {
      setError(`Failed to delete category: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission for create/edit
  const handleFormSubmit = async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, categoryData);
        setSuccess(`Category "${categoryData.name}" updated successfully.`);
      } else {
        // Create new category
        await createCategory(categoryData);
        setSuccess(`Category "${categoryData.name}" created successfully.`);
      }
      
      // Refresh categories
      await updateCategories();
      
      // Close modal
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Expand all categories with one click
  const expandAllCategories = () => {
    const expanded = {};
    categories.forEach(cat => {
      if (categoryMaps.childrenMap[cat.id] && categoryMaps.childrenMap[cat.id].length > 0) {
        expanded[cat.id] = true;
      }
    });
    setExpandedCategories(expanded);
  };

  // Collapse all categories with one click
  const collapseAllCategories = () => {
    setExpandedCategories({});
  };
  
  return (
    <div className="admin-page categories-admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Categories Management</h1>
        <p className="admin-page-description">
          Create and manage hierarchical categories for time tracking.
        </p>
      </div>
      
      {/* Alert messages */}
      {error && (
        <Alert 
          type="error" 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <Alert 
          type="success" 
          message={success} 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      {/* Filter bar */}
      <FilterBar 
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        searchPlaceholder="Search categories..."
        createButtonLabel="Add Category"
        onCreateClick={handleCreateNew}
        selectedCount={selectedRows.length}
        bulkActions={bulkActions}
        onBulkActionClick={handleBulkAction}
      />
      
      {/* Expand/Collapse All buttons */}
      <div className="expand-collapse-controls">
        <button 
          onClick={expandAllCategories}
          className="expand-all-btn"
          disabled={loading}
        >
          Expand All
        </button>
        <button 
          onClick={collapseAllCategories}
          className="collapse-all-btn"
          disabled={loading}
        >
          Collapse All
        </button>
      </div>
      
      {/* Categories table */}
      <AdminTable 
        columns={columns}
        data={displayCategories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelectionChange={setSelectedRows}
      />
      
      {/* Category form modal */}
      <CategoryFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        allCategories={categories}
        loading={loading}
      />
      
      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-dialog">
            <div className="delete-confirmation-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="delete-icon">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
              </svg>
              <h2>Delete Category</h2>
            </div>
            
            <div className="delete-confirmation-content">
              <p>
                Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>?
              </p>
              
              {/* Warning if has children */}
              {confirmDelete.hasChildren && (
                <div className="delete-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="warning-icon">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Warning:</strong> This category has subcategories that will also be deleted.
                  </div>
                </div>
              )}
              
              <p className="delete-confirmation-note">
                This action cannot be undone. All time logs associated with this category will also be deleted.
              </p>
            </div>
            
            <div className="delete-confirmation-footer">
              <button 
                className="cancel-btn"
                onClick={() => setConfirmDelete(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={confirmDeleteCategory}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;