const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const dbPath = path.resolve(__dirname, 'time_tracker.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database with schema if needed
const fs = require('fs');
const schemaPath = path.resolve(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Utility function to build nested category tree
function buildCategoryTree(categories, parentId = null) {
  const result = [];
  
  categories
    .filter(category => category.parent_id === parentId)
    .forEach(category => {
      const children = buildCategoryTree(categories, category.id);
      
      if (children.length) {
        category.children = children;
      }
      
      result.push(category);
    });
  
  return result;
}

// Helper function to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;
  
  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  if (isNaN(timestamp)) return false;
  
  return date.toISOString().startsWith(dateString);
}

// API Routes

// Get all categories (with nested structure)
app.get('/categories', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    const categories = stmt.all();
    
    if (req.query.flat === 'true') {
      return res.json(categories);
    }
    
    const nestedCategories = buildCategoryTree(categories);
    res.json(nestedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add a new category
app.post('/categories', (req, res) => {
  try {
    const { name, parent_id, color, threshold_minutes } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Validate parent_id if provided
    if (parent_id !== null && parent_id !== undefined) {
      const parentCheck = db.prepare('SELECT id FROM categories WHERE id = ?').get(parent_id);
      if (!parentCheck) {
        return res.status(400).json({ error: 'Parent category does not exist' });
      }
    }
    
    // Validate threshold_minutes if provided
    if (threshold_minutes !== null && threshold_minutes !== undefined) {
      if (typeof threshold_minutes !== 'number' || threshold_minutes <= 0) {
        return res.status(400).json({ error: 'Threshold minutes must be a positive number' });
      }
    }
    
    const stmt = db.prepare(
      'INSERT INTO categories (name, parent_id, color, threshold_minutes) VALUES (?, ?, ?, ?)'
    );
    
    const info = stmt.run(name, parent_id || null, color || '#6B7280', threshold_minutes || null);
    
    res.status(201).json({ 
      id: info.lastInsertRowid,
      name, 
      parent_id: parent_id || null,
      color: color || '#6B7280',
      threshold_minutes: threshold_minutes || null
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Handle unique constraint violation
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category
app.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, color, threshold_minutes } = req.body;
    
    // Check if category exists
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Prevent circular references in hierarchy
    if (parent_id && parent_id !== null) {
      // Check that parent exists
      const parentCheck = db.prepare('SELECT id FROM categories WHERE id = ?').get(parent_id);
      if (!parentCheck) {
        return res.status(400).json({ error: 'Parent category does not exist' });
      }
      
      // Check it's not setting itself as parent
      if (parseInt(id) === parseInt(parent_id)) {
        return res.status(400).json({ error: 'A category cannot be its own parent' });
      }
      
      // Check that we're not creating a circular reference
      let currentParent = parent_id;
      while (currentParent !== null) {
        const parent = db.prepare('SELECT parent_id FROM categories WHERE id = ?').get(currentParent);
        if (!parent) break;
        if (parseInt(parent.parent_id) === parseInt(id)) {
          return res.status(400).json({ error: 'This would create a circular reference in the category hierarchy' });
        }
        currentParent = parent.parent_id;
      }
    }
    
    // Validate threshold_minutes if provided
    if (threshold_minutes !== undefined && threshold_minutes !== null) {
      if (typeof threshold_minutes !== 'number' || threshold_minutes <= 0) {
        return res.status(400).json({ error: 'Threshold minutes must be a positive number' });
      }
    }
    
    const stmt = db.prepare(
      'UPDATE categories SET name = ?, parent_id = ?, color = ?, threshold_minutes = ? WHERE id = ?'
    );
    
    stmt.run(
      name || category.name,
      parent_id === undefined ? category.parent_id : parent_id,
      color || category.color,
      threshold_minutes === undefined ? category.threshold_minutes : threshold_minutes,
      id
    );
    
    res.json({
      id: parseInt(id),
      name: name || category.name,
      parent_id: parent_id === undefined ? category.parent_id : parent_id,
      color: color || category.color,
      threshold_minutes: threshold_minutes === undefined ? category.threshold_minutes : threshold_minutes
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    // Handle unique constraint violation
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
app.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Delete the category (cascade will handle children and logs due to FK constraints)
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(id);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get time logs with filtering options
app.get('/logs', (req, res) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    
    let query = 'SELECT l.*, c.name as category_name, c.color as category_color, c.threshold_minutes FROM time_logs l JOIN categories c ON l.category_id = c.id';
    const params = [];
    const conditions = [];
    
    // Apply date range filter
    if (start_date) {
      if (!isValidDate(start_date)) {
        return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD.' });
      }
      conditions.push('l.date >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      if (!isValidDate(end_date)) {
        return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD.' });
      }
      conditions.push('l.date <= ?');
      params.push(end_date);
    }
    
    // Apply category filter
    if (category_id) {
      conditions.push('l.category_id = ?');
      params.push(category_id);
    }
    
    // Compose the final query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.date DESC, c.name ASC';
    
    const stmt = db.prepare(query);
    const logs = stmt.all(...params);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching time logs:', error);
    res.status(500).json({ error: 'Failed to fetch time logs' });
  }
});

// Add or update a time log
app.post('/logs', (req, res) => {
  try {
    const { category_id, date, total_time, notes } = req.body;
    
    // Validate required fields
    if (!category_id || !date || total_time === undefined) {
      return res.status(400).json({ error: 'category_id, date, and total_time are required' });
    }
    
    // Validate date format
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    
    // Validate total_time is a positive number
    if (typeof total_time !== 'number' || total_time < 0) {
      return res.status(400).json({ error: 'total_time must be a positive number' });
    }
    
    // Check if category exists and enforce subcategory logging (not allowed for main categories)
    const category = db.prepare('SELECT id, parent_id, threshold_minutes FROM categories WHERE id = ?').get(category_id);
    if (!category) {
      return res.status(400).json({ error: 'Category does not exist' });
    }
    if (category.parent_id === null) {
      return res.status(400).json({ error: 'Logging time for main categories is not allowed. Please select a subcategory.' });
    }
    
    // Check if threshold is exceeded (if threshold is set)
    if (category.threshold_minutes !== null) {
      // Get the sum of all time logs for this category in the current period
      // We'll check for the current month as the default period
      const startOfMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0).toISOString().split('T')[0];
      
      const existingTimeQuery = db.prepare(
        `SELECT SUM(total_time) as total FROM time_logs 
         WHERE category_id = ? AND date >= ? AND date <= ? AND date != ?`
      );
      const existingTime = existingTimeQuery.get(category_id, startOfMonth, endOfMonth, date);
      
      const totalTimeForMonth = (existingTime.total || 0) + total_time;
      
      if (totalTimeForMonth > category.threshold_minutes) {
        // We'll still allow it but send a warning
        res.header('X-Threshold-Exceeded', 'true');
        res.header('X-Threshold-Value', category.threshold_minutes.toString());
        res.header('X-Threshold-Current', totalTimeForMonth.toString());
      }
    }
    
    // Check if log already exists for this category and date
    const existingLog = db.prepare('SELECT id FROM time_logs WHERE category_id = ? AND date = ?').get(category_id, date);
    let stmt, result;
    
    if (existingLog) {
      // Update existing log
      stmt = db.prepare(
        'UPDATE time_logs SET total_time = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );
      stmt.run(total_time, notes || null, existingLog.id);
      result = { ...existingLog, total_time, notes, updated: true };
    } else {
      // Insert new log
      stmt = db.prepare(
        'INSERT INTO time_logs (category_id, date, total_time, notes) VALUES (?, ?, ?, ?)'
      );
      const info = stmt.run(category_id, date, total_time, notes || null);
      result = { 
        id: info.lastInsertRowid,
        category_id,
        date,
        total_time,
        notes,
        created: true
      };
    }
    
    res.status(existingLog ? 200 : 201).json(result);
  } catch (error) {
    console.error('Error saving time log:', error);
    res.status(500).json({ error: 'Failed to save time log' });
  }
});

// Delete a time log
app.delete('/logs/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if log exists
    const log = db.prepare('SELECT * FROM time_logs WHERE id = ?').get(id);
    if (!log) {
      return res.status(404).json({ error: 'Time log not found' });
    }
    
    // Delete the log
    const stmt = db.prepare('DELETE FROM time_logs WHERE id = ?');
    stmt.run(id);
    
    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(500).json({ error: 'Failed to delete time log' });
  }
});

// Get aggregated stats
app.get('/stats', (req, res) => {
  try {
    const { start_date, end_date, group_by } = req.query;
    
    // Validate date format if provided
    if (start_date && !isValidDate(start_date)) {
      return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD.' });
    }
    
    if (end_date && !isValidDate(end_date)) {
      return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD.' });
    }
    
    // Default grouping is by category
    const validGroupings = ['category', 'date', 'week', 'month'];
    const grouping = validGroupings.includes(group_by) ? group_by : 'category';
    
    let query = '';
    const params = [];
    
    if (grouping === 'category') {
      query = `
        SELECT c.id, c.name, c.color, c.threshold_minutes, SUM(l.total_time) as total_time
        FROM time_logs l
        JOIN categories c ON l.category_id = c.id
        WHERE 1=1
      `;
      
      if (start_date) {
        query += ' AND l.date >= ?';
        params.push(start_date);
      }
      
      if (end_date) {
        query += ' AND l.date <= ?';
        params.push(end_date);
      }
      
      query += ' GROUP BY c.id ORDER BY total_time DESC';
    } else if (grouping === 'date') {
      query = `
        SELECT l.date, SUM(l.total_time) as total_time
        FROM time_logs l
        WHERE 1=1
      `;
      
      if (start_date) {
        query += ' AND l.date >= ?';
        params.push(start_date);
      }
      
      if (end_date) {
        query += ' AND l.date <= ?';
        params.push(end_date);
      }
      
      query += ' GROUP BY l.date ORDER BY l.date';
    } else if (grouping === 'month') {
      // SQLite doesn't have built-in date formatting, so we use substr
      query = `
        SELECT substr(l.date, 1, 7) as month, SUM(l.total_time) as total_time
        FROM time_logs l
        WHERE 1=1
      `;
      
      if (start_date) {
        query += ' AND l.date >= ?';
        params.push(start_date);
      }
      
      if (end_date) {
        query += ' AND l.date <= ?';
        params.push(end_date);
      }
      
      query += ' GROUP BY month ORDER BY month';
    } else if (grouping === 'week') {
      // This is a bit more complex in SQLite since it doesn't have week functions
      // We'll use a simple approximation by truncating to the week start date
      query = `
        SELECT date(l.date, 'weekday 0', '-6 days') as week_start,
               SUM(l.total_time) as total_time
        FROM time_logs l
        WHERE 1=1
      `;
      
      if (start_date) {
        query += ' AND l.date >= ?';
        params.push(start_date);
      }
      
      if (end_date) {
        query += ' AND l.date <= ?';
        params.push(end_date);
      }
      
      query += ' GROUP BY week_start ORDER BY week_start';
    }
    
    const stmt = db.prepare(query);
    const stats = stmt.all(...params);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Apply error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection');
  db.close();
  process.exit(0);
});

module.exports = app;