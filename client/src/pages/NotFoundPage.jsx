import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-6xl font-bold text-primary-500 mb-4">404</div>
      <h1 className="text-2xl font-semibold mb-4">Page Not Found</h1>
      <p className="text-gray-600 text-center max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;