import React from 'react';
import { Bell, Menu, UserCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const { user } = useAuth();

  // Page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Tableau de bord';
    if (path === '/vehicules') return 'Gestion des Véhicules';
    if (path === '/clients') return 'Gestion des Clients';
    if (path === '/contrats') return 'Gestion des Contrats';
    if (path === '/factures') return 'Gestion des Factures';
    if (path === '/reservations') return 'Gestion des Réservations';
    if (path === '/parametres') return 'Paramètres';
    
    return 'AdminCar';
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm lg:px-6">
      {/* Left side */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="hidden md:block ml-4 text-xl font-semibold text-gray-800">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="hidden md:flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {user?.name}
          </span>
          <UserCircle size={28} className="text-gray-600" />
        </div>
      </div>
    </header>
  );
};

export default Header;