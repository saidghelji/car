// Removed unused React import as it is not necessary with the new JSX transform.
import { Menu } from 'lucide-react';
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

    const pageTitles: { [key: string]: string } = {
      '/': 'Tableau de bord',
      '/vehicules': 'Gestion des Véhicules',
      '/clients': 'Gestion des Clients',
      '/contrats': 'Gestion des Contrats',
      '/factures': 'Gestion des Factures',
      '/reservations': 'Gestion des Réservations',
      '/parametres': 'Paramètres',
      '/accidents': 'Gestion des Accidents',
      '/charges': 'Gestion des Charges',
      '/clientpayments': 'Gestion des Paiements Clients',
      '/infractions': 'Gestion des Infractions',
      '/interventions': 'Gestion des Interventions',
      '/login': 'Connexion',
      '/traites': 'Gestion des Traites',
      '/vehicleinspections': 'Gestion des Inspections Véhicules',
      '/vehicleinsurance': 'Gestion des Assurances Véhicules',
    };

    return pageTitles[path] || 'AdminCar';
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm lg:px-6 md:px-4">
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
        {/* Show logged-in username if available */}
        {user && (
          <div className="text-sm text-gray-700">{user.username}</div>
        )}
      </div>
    </header>
  );
};

export default Header;
