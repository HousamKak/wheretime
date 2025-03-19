import { Link } from 'react-router-dom';
import '../styles/layouts/footer.css';

const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-8">
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          {/* Logo and copyright */}
          <div className="flex items-center mb-4 md:mb-0">
            <svg
              className="h-8 w-8 text-primary-600"
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
            <div className="ml-3">
              <h3 className="text-lg font-bold text-gray-800">WhereTime</h3>
              <p className="text-sm text-gray-500">Track your time, improve your life</p>
            </div>
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-center md:text-left">
            <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors text-sm">
              Dashboard
            </Link>
            <Link to="/categories" className="text-gray-600 hover:text-primary-600 transition-colors text-sm">
              Categories
            </Link>
            <Link to="/logs" className="text-gray-600 hover:text-primary-600 transition-colors text-sm">
              Time Logs
            </Link>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors text-sm">
              Help Center
            </a>
          </div>
        </div>

        {/* Footer bottom section with divider */}
        <div className="border-t border-gray-200 pt-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-500 mb-2 md:mb-0">
            © {currentYear} WhereTime. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 text-center md:text-right">
            Track, analyze, and optimize your daily activities for better productivity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;