# WhereTime - Time Tracking & Visualization

WhereTime is a comprehensive time tracking application that helps you visualize and analyze how you spend your time. With an intuitive interface and powerful visualization tools, WhereTime makes it easy to track your activities, identify patterns, and optimize your productivity.

![WhereTime Dashboard](screenshot.png)

## Features

- **Time Tracking**: Log time spent on different activities with ease
- **Hierarchical Categories**: Organize activities with main categories and subcategories
- **Visual Analytics**: Interactive charts and graphs to visualize your time data
- **Customizable Dashboard**: Personalize your view with flexible date ranges and category filters
- **Detailed Reports**: See time breakdowns by category, date, or custom periods
- **Color Coding**: Assign colors to categories for visual differentiation

## Technologies

### Frontend

- React 19.0
- React Router for navigation
- D3.js for data visualization
- Axios for API requests
- date-fns for date manipulation
- Custom CSS with responsive design

### Backend

- Node.js
- Express.js for RESTful API
- SQLite database with better-sqlite3
- CORS for secure cross-origin requests

## Installation

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Setup Instructions

1. **Clone the repository**

   ```
   git clone https://github.com/yourusername/wheretime.git
   cd wheretime
   ```

2. **Install dependencies**

   ```
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**

   - Create a `.env` file in the `server` directory
   - Add the following variables:
     ```
     PORT=5463
     NODE_ENV=development
     ```
   - Create a `.env` file in the `client` directory
     ```
     VITE_API_URL=http://localhost:5463
     ```

4. **Initialize the database**

   ```
   cd ../server
   npm run init-db
   ```

5. **Start the application**

   ```
   # Start the backend server
   cd ../server
   npm run dev

   # In a separate terminal, start the frontend
   cd ../client
   npm run dev
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`

## Usage

### Dashboard

The dashboard provides an overview of your time data with interactive charts. You can:

- Select different time periods using preset ranges or custom date selection
- Toggle visibility of categories to focus on specific data
- Expand categories to see detailed breakdowns
- View daily, weekly, or monthly trends

### Categories

The Categories page allows you to:

- Create new categories and subcategories
- Edit existing categories (name, color, parent category)
- Delete categories (note: this will delete all associated time logs)
- Organize your activities in a hierarchical structure

### Time Logs

The Time Logs page helps you:

- Add new time entries with date, category, duration, and notes
- Edit existing time entries
- Delete time entries
- Filter logs by date range and category
- View chronological history of your activities

## Project Structure

```
wheretime/
├── client/                  # Frontend React application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── routes/          # Route definitions
│   │   ├── services/        # API service functions
│   │   ├── styles/          # CSS styles
│   │   └── utils/           # Utility functions
│   ├── .env                 # Environment variables
│   └── package.json         # Dependencies and scripts
│
├── server/                  # Backend Node.js application
│   ├── middleware/          # Express middleware
│   ├── .env                 # Environment variables
│   ├── package.json         # Dependencies and scripts
│   ├── schema.sql           # Database schema
│   └── server.js            # Main server file
│
└── README.md                # Project documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons from [Lucide](https://lucide.dev/)
- Color palette inspiration from [Tailwind CSS](https://tailwindcss.com/)
