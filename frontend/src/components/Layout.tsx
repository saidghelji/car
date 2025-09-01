import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Store current path in localStorage whenever it changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location]);

  // If your AuthContext provides a loading flag in the future, add the check here.

  if (!user) {
    const lastPath = localStorage.getItem('lastPath') || '/';
    return <Navigate to="/login" state={{ from: lastPath }} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden"> {/* Ensure the main container handles overflow */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-y-auto"> {/* Allow main content to scroll vertically */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 md:p-6"> {/* Remove overflow-x-hidden, let content manage its own overflow */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
