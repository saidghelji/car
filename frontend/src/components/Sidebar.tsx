import React from 'react';
import { NavLink } from 'react-router-dom';
import { Car, Users, Calendar, Settings, LayoutDashboard, LogOut, FileText, Receipt, UserCheck, Gauge, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: <LayoutDashboard size={20} /> },
    { 
      name: 'Véhicules', 
      path: '/vehicules', 
      icon: <Car size={20} />,
      subItems: [
        { name: 'Visite technique', path: '/vehicules/visites-techniques', icon: <Gauge size={16} /> },
        { name: 'Liste assurances', path: '/vehicules/assurances', icon: <ShieldCheck size={16} /> },
        { name: 'Liste agences', path: '/vehicules/agences', icon: <Building2 size={16} /> }
      ]
    },
    { 
      name: 'Clients', 
      path: '/clients', 
      icon: <Users size={20} />,
      subItems: [
        { name: 'Liste réglements', path: '/clients/reglements', icon: <UserCheck size={16} /> }
      ]
    },
    { name: 'Contrats', path: '/contrats', icon: <FileText size={20} /> },
    { name: 'Factures', path: '/factures', icon: <Receipt size={20} /> },
    { name: 'Réservations', path: '/reservations', icon: <Calendar size={20} /> },
    { name: 'Paramètres', path: '/parametres', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-blue-900 transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-blue-800">
          <h1 className="text-white text-xl font-bold">AdminCar</h1>
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <nav className="mt-5 px-2">
            {navItems.map((item) => (
              <div key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 mt-1 text-sm rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-800 text-white' 
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </NavLink>
                {item.subItems?.map((subItem) => (
                  <NavLink
                    key={subItem.path}
                    to={subItem.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-2 ml-6 mt-1 text-sm rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-800 text-white' 
                          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-2">{subItem.icon}</span>
                    {subItem.name}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="p-4">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-blue-100 rounded-lg hover:bg-blue-800 hover:text-white"
            >
              <LogOut size={20} className="mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;