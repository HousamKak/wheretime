import { Link } from 'react-router-dom';

const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center py-6">
          {/* Copyright and logo */}
          <div className="flex items-center mb-4 md:mb-0">
            <svg
              className="h-6 w-6 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="ml-2 text-sm text-gray-600">
              © {currentYear} WhereTime. All rights reserved.
            </span>
          </div>

          {/* Navigation links */}
          <div className="flex space-x-6">
            <Link to="/" className="footer-link">
              Dashboard
            </Link>
            <Link to="/categories" className="footer-link">
              Categories
            </Link>
            <Link to="/logs" className="footer-link">
              Time Logs
            </Link>
            <a href="#" className="footer-link">
              Help
            </a>
          </div>
        </div>
        
        {/* Additional footer content */}
        <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
          <p>WhereTime helps you visualize how you spend your time with intuitive charts and reports.</p>
          <p className="mt-1">Track, analyze, and optimize your daily activities for better productivity and work-life balance.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;