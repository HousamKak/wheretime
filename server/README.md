# Time Tracker API Server

This is the backend server for the Time Spent Visualization & Tracking Web App. It provides API endpoints for managing categories and time logs.

## Features

- Category management with hierarchical structure
- Daily time logging for different categories
- Filtering and aggregating time data
- Statistical endpoints for data analysis

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **SQLite** - Embedded database (using better-sqlite3)
- **CORS** - Cross-origin resource sharing middleware

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (see `.env.example`)
4. Start the server:
   ```bash
   npm start
   ```

## Development

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Categories

- `GET /categories` - Get all categories
- `POST /categories` - Create a new category
- `PUT /categories/:id` - Update a category
- `DELETE /categories/:id` - Delete a category

### Time Logs

- `GET /logs` - Get time logs (with optional filters)
- `POST /logs` - Create or update a time log
- `DELETE /logs/:id` - Delete a time log

### Statistics

- `GET /stats` - Get aggregated statistics

## License

MIT