# WhereTime - Technical Architecture

This document provides a detailed overview of the WhereTime application architecture, including the component structure, data flow, state management, database schema, and API endpoints.

## System Architecture Overview

WhereTime follows a client-server architecture with a clear separation between the frontend and backend components:

```
┌─────────────────┐                ┌─────────────────┐
│                 │                │                 │
│  React Frontend │◄───REST API────►  Node.js Server │
│  (Vite + React) │                │  (Express.js)   │
│                 │                │                 │
└─────────────────┘                └────────┬────────┘
                                           │
                                   ┌───────▼────────┐
                                   │                │
                                   │  SQLite        │
                                   │  Database      │
                                   │                │
                                   └────────────────┘
```

### Frontend Architecture

The frontend is built with React and follows a component-based architecture with custom hooks for state management and data fetching.

#### Key Frontend Patterns

1. **Component-Based Structure**: UI elements are broken down into reusable components
2. **Context API for Global State**: Application-wide state is managed via React Context
3. **Custom Hooks**: Encapsulated logic for API calls and state management
4. **Responsive Design**: CSS styling that adapts to different screen sizes
5. **Client-Side Routing**: Using React Router for navigation

### Backend Architecture

The backend uses Express.js with a SQLite database, providing a RESTful API for the frontend to consume.

#### Key Backend Patterns

1. **RESTful API Design**: Standard endpoints for CRUD operations
2. **Data Validation**: Input validation before database operations
3. **Error Handling Middleware**: Centralized error handling
4. **Hierarchical Data Structure**: Support for parent-child relationships in categories

## Component Structure

### Frontend Components

```
components/
├── common/              # Reusable UI components
│   ├── Alert.jsx        # Notification alerts
│   ├── Button.jsx       # Custom button component
│   ├── Card.jsx         # Card container component
│   ├── Loader.jsx       # Loading state component
│   ├── Modal.jsx        # Modal dialog component
│   └── Skeleton.jsx     # Loading placeholder component
│
├── CategoryCharts.jsx   # Category-specific charts
├── CategoryLegend.jsx   # Category toggle controls
├── CategoryManager.jsx  # Category CRUD interface
├── Dashboard.jsx        # Main dashboard component
├── Footer.jsx           # Application footer
├── Header.jsx           # Navigation header
├── LeftSidebar.jsx      # Dashboard left controls
├── RightSidebar.jsx     # Dashboard right controls
├── Sidebar.jsx          # Generic sidebar component
├── TimeEntryForm.jsx    # Form for adding time entries
├── TimeLogViewer.jsx    # View and manage time logs
└── TimeSeriesChart.jsx  # D3.js time series chart
```

### Pages Structure

```
pages/
├── CategoriesPage.jsx   # Category management page
├── DashboardPage.jsx    # Main dashboard page
├── LogsPage.jsx         # Time logs page
└── NotFoundPage.jsx     # 404 error page
```

## State Management

WhereTime uses React Context for global state management along with custom hooks for component-specific state. This approach balances centralized state with performance and maintainability.

### AppContext

The `AppContext` provides application-wide state and functions:

```javascript
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // Functions for fetching, updating categories
  const initialize = useCallback(async () => {...});
  const updateCategories = useCallback(async () => {...});
  
  // Context value
  const value = {
    categories,
    loading,
    error,
    initializing,
    initialize,
    updateCategories,
    clearError
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

### Custom Hooks

The application uses several custom hooks to encapsulate specific functionality:

1. **useCategories**: Manages category data and operations
2. **useTimeLogs**: Manages time log data and operations
3. **useApp**: Provides access to the AppContext

## Database Schema

WhereTime uses SQLite with two main tables:

### Categories Table

```sql
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    color TEXT NOT NULL DEFAULT '#6B7280',
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

### Time Logs Table

```sql
CREATE TABLE IF NOT EXISTS time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    date TEXT NOT NULL,  -- Stored in ISO format (YYYY-MM-DD)
    total_time INTEGER NOT NULL,  -- Total time in minutes
    notes TEXT,  -- Optional notes for the time entry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, date)  -- Ensure only one log per category per day
);
```

## API Endpoints

The backend provides a RESTful API with the following endpoints:

### Categories API

| Endpoint                | Method | Description                    | Parameters                      |
|-------------------------|--------|--------------------------------|---------------------------------|
| `/categories`           | GET    | Get all categories             | `?flat=true` - Return flat list |
| `/categories`           | POST   | Create a new category          | `name`, `parent_id`, `color`    |
| `/categories/:id`       | PUT    | Update a category              | `name`, `parent_id`, `color`    |
| `/categories/:id`       | DELETE | Delete a category              | -                               |

### Time Logs API

| Endpoint                | Method | Description                    | Parameters                      |
|-------------------------|--------|--------------------------------|---------------------------------|
| `/logs`                 | GET    | Get time logs with filters     | `start_date`, `end_date`, `category_id` |
| `/logs`                 | POST   | Create or update a time log    | `category_id`, `date`, `total_time`, `notes` |
| `/logs/:id`             | DELETE | Delete a time log              | -                               |

### Statistics API

| Endpoint                | Method | Description                    | Parameters                      |
|-------------------------|--------|--------------------------------|---------------------------------|
| `/stats`                | GET    | Get aggregated statistics      | `start_date`, `end_date`, `group_by` |

## Data Flow

1. **Data Fetching**:
   - The application initializes by fetching categories from the server
   - Dashboard fetches time logs and stats based on selected date range
   - Categories and logs pages fetch their respective data when mounted

2. **User Interactions**:
   - User actions trigger state updates (e.g., changing date range)
   - State changes trigger re-rendering and potentially new API calls
   - Forms collect user input for creating/updating data

3. **Data Visualization**:
   - Raw data is processed into format needed for D3.js charts
   - Processed data is passed to chart components
   - User interactions with charts (e.g., hover, click) trigger UI updates

## Security Considerations

1. **Input Validation**: Both frontend and backend validate input data
2. **CORS**: The backend implements CORS to restrict access
3. **Error Handling**: Proper error handling without exposing sensitive information

## Performance Optimizations

1. **Memoization**: Using `useMemo` and `useCallback` to prevent unnecessary re-renders
2. **Lazy Loading**: Components are rendered only when needed
3. **Efficient Chart Rendering**: The D3.js charts are optimized for performance
4. **Pagination**: Future enhancement for handling large datasets

## Deployment Considerations

### Frontend Deployment

The React application can be built for production using:

```bash
cd client
npm run build
```

This creates optimized static files in the `dist/` directory that can be served by any static file server.

### Backend Deployment

The Node.js server can be deployed to any platform that supports Node.js applications. For production:

1. Set `NODE_ENV=production` in the `.env` file
2. Consider using a process manager like PM2
3. For larger deployments, consider migrating from SQLite to a more robust database like PostgreSQL

## Future Architecture Enhancements

1. **Authentication System**: User accounts and authentication
2. **Real-time Updates**: WebSocket integration for live updates
3. **Data Export/Import**: Functionality to export and import data
4. **Mobile Application**: React Native version for mobile users
5. **Offline Support**: PWA features for offline functionality
6. **Analytics Engine**: Advanced analytics and insights