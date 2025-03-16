# Time Tracker

![Time Tracker Banner](https://via.placeholder.com/1200x300/4361ee/ffffff?text=Time+Tracker)

A comprehensive time visualization and tracking application that helps you monitor how you spend your time with intuitive charts and insightful analytics.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Server Setup](#server-setup)
  - [Client Setup](#client-setup)
- [Usage Guide](#usage-guide)
  - [Adding Time Entries](#adding-time-entries)
  - [Visualizing Time Data](#visualizing-time-data)
  - [Managing Categories](#managing-categories)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Database Schema](#database-schema)
- [Development Guide](#development-guide)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

Time Tracker is a full-stack web application designed to help users track, visualize, and analyze how they spend their time. The application provides a hierarchical category-based tracking system, powerful data visualization tools, and detailed analytics to help users optimize their time management and productivity.

The application follows a category-based approach where users can track time spent on different activities, view trends using interactive charts, and analyze their time distribution across custom categories.

## Features

### Core Features

- **Hierarchical Category System**: Organize activities in a parent-child relationship for better categorization
- **Daily Time Logging**: Log the time spent on different activities per day
- **Interactive Time Series Visualization**: See your time trends with expandable categories
- **Category Analytics**: Detailed breakdown of time spent per category
- **Customizable Date Ranges**: Filter data by predefined periods or custom date ranges
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Key Visualizations

- **Time Series Graph**: Interactive chart showing time spent trends over time
- **Category Breakdown**: Hierarchical view of time distribution across categories
- **Daily Averages**: Track your typical time allocation patterns

### User Experience

- **Expandable Categories**: Drill down into subcategories to see detailed time allocation
- **Intuitive Interface**: Clean, modern UI with clear navigation
- **Real-time Updates**: Charts and stats update immediately after logging time

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **SQLite**: Lightweight, embedded database
- **better-sqlite3**: High-performance SQLite client for Node.js

### Frontend
- **React**: Frontend UI library
- **D3.js**: Data visualization library for interactive charts
- **date-fns**: Date manipulation library
- **Axios**: HTTP client for API requests

### Development Tools
- **Vite**: Fast, modern frontend build tool
- **ESLint**: JavaScript linting utility
- **nodemon**: Development utility for auto-restarting server

## Project Structure

```
time-tracker/
├── server/                # Backend code
│   ├── middleware/        # Express middleware
│   ├── schema.sql         # Database schema
│   ├── server.js          # Express server
│   └── package.json       # Server dependencies
│
└── client/                # Frontend code
    ├── public/            # Static assets
    ├── src/
    │   ├── components/    # React components
    │   │   ├── common/    # Reusable UI components
    │   │   └── ...        # Feature-specific components
    │   ├── contexts/      # React contexts
    │   ├── hooks/         # Custom React hooks
    │   ├── pages/         # Page components
    │   ├── routes/        # Routing configuration
    │   ├── services/      # API service layer
    │   └── utils/         # Utility functions
    ├── index.html         # HTML entry point
    ├── vite.config.js     # Vite configuration
    └── package.json       # Client dependencies
```

## Installation

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Git

### Server Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/time-tracker.git
cd time-tracker
```

2. Set up server:
```bash
cd server
npm install
```

3. Initialize the database:
```bash
sqlite3 time_tracker.db < schema.sql
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

### Client Setup

1. Navigate to the client directory:
```bash
cd ../client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The client will be available at `http://localhost:3000`.

## Usage Guide

### Adding Time Entries

1. Navigate to the Dashboard page
2. Click "Add Time Entry" to open the time entry form
3. Select a date, category, and enter the time spent
4. Optionally add notes about the activity
5. Click "Save Time Entry" to log your time

### Visualizing Time Data

#### Time Series Chart

The main dashboard features a time series chart that displays your time trends:

- **Date Range**: Use the date controls to adjust the time period displayed
- **Category Toggling**: Show/hide specific categories using the checkbox controls
- **Expandable Categories**: Click on a parent category in the legend to expand and show its subcategories
- **Interactive Tooltips**: Hover over the chart to see detailed time information for specific dates

#### Category Breakdown

The category breakdown section shows how your time is distributed:

- View total time spent per category
- See percentage distribution across categories
- When categories are expanded, view the breakdown of subcategories

### Managing Categories

1. Navigate to the Categories page
2. Add new categories and subcategories
3. Edit existing categories (name, color, parent category)
4. Delete categories (note: this will also delete associated time logs)

## API Documentation

### Categories Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/categories` | GET | Get all categories | `flat=true` (optional) for flat structure |
| `/categories` | POST | Create a new category | `name`, `parent_id` (optional), `color` (optional) |
| `/categories/:id` | PUT | Update a category | `name`, `parent_id`, `color` |
| `/categories/:id` | DELETE | Delete a category | - |

### Time Logs Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/logs` | GET | Get time logs | `start_date`, `end_date`, `category_id` (all optional) |
| `/logs` | POST | Create/update a time log | `category_id`, `date`, `total_time`, `notes` (optional) |
| `/logs/:id` | DELETE | Delete a time log | - |

### Statistics Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/stats` | GET | Get aggregated stats | `start_date`, `end_date`, `group_by` (`category`, `date`, `week`, `month`) |

## Frontend Components

### Main Components

- **Dashboard**: Main view with time series visualization and stats
- **TimeSeriesChart**: Interactive D3.js chart with expandable categories
- **TimeEntryForm**: Form for logging time entries
- **CategoryManager**: Interface for managing categories
- **TimeLogViewer**: List and edit view of past time logs

### Common UI Components

- **Alert**: Notification component for success/error messages
- **Skeleton**: Loading placeholder component
- **Button**: Styled button component with variants
- **Card**: Container component with header, content, and footer sections
- **Modal**: Dialog component for forms and confirmations

## Database Schema

### Categories Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Category name (unique) |
| parent_id | INTEGER | Foreign key to parent category (nullable) |
| color | TEXT | Hex color code for the category |

### Time Logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| category_id | INTEGER | Foreign key to categories table |
| date | TEXT | ISO date (YYYY-MM-DD) |
| total_time | INTEGER | Time in minutes |
| notes | TEXT | Optional notes (nullable) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Development Guide

### Adding New Features

1. **Backend Changes**:
   - Add new endpoints in `server.js`
   - Update database schema if needed
   - Test API endpoints with a tool like Postman

2. **Frontend Changes**:
   - Create new components in the appropriate directories
   - Update routes if adding new pages
   - Connect to backend using the API service layer

### Code Style

- Follow the existing patterns in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Structure components with clear separation of concerns

### Testing

- Test API endpoints to ensure they return expected data
- Verify UI components render correctly with different data
- Test interactions and state changes
- Ensure responsive design works on different screen sizes

## Customization

### Styling

The application uses a custom CSS system with variables for colors, spacing, and other design elements. To customize the look and feel:

1. Modify the CSS variables at the top of `index.css`
2. Adjust component-specific styles as needed
3. Update color schemes for categories in the database

### Adding New Visualizations

To add new types of visualizations:

1. Create a new component in the `components` directory
2. Use D3.js or other visualization libraries
3. Connect to the existing data sources
4. Add the new component to the relevant page

## Troubleshooting

### Common Issues

#### Server Won't Start

- Check if port 5000 is already in use
- Verify the database file exists and has correct permissions
- Check for errors in the server console

#### Client Build Errors

- Clear the node_modules folder and reinstall dependencies
- Verify `.env` file has the correct API URL
- Check console for specific error messages

#### Charts Not Rendering

- Verify that data is being fetched correctly from the API
- Check browser console for D3.js errors
- Ensure the DOM elements exist for D3 to attach to

#### Database Issues

- Check server logs for SQLite errors
- Verify schema is correctly applied
- Use the SQLite CLI to inspect the database directly

### Getting Help

If you encounter issues not covered here, you can:

- Open an issue on GitHub
- Check the project wiki for more detailed documentation
- Join our community Discord server for real-time help

## Contributing

We welcome contributions to the Time Tracker project! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please follow the existing code style and include appropriate tests for your changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgements

- [D3.js](https://d3js.org/) for the powerful visualization library
- [React](https://reactjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend API
- [SQLite](https://www.sqlite.org/) for the database engine
- [date-fns](https://date-fns.org/) for date manipulation utilities
- [Vite](https://vitejs.dev/) for the build tool