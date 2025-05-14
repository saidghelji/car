import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  // Store current path in localStorage whenever it changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location]);

  // Don't render anything while authentication is being checked
  if (loading) {
    return null;
  }

  if (!user) {
    const lastPath = localStorage.getItem('lastPath') || '/';
    return <Navigate to="/login" state={{ from: lastPath }} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;