import { NavLink } from 'react-router-dom';
import { Car, Users, Calendar, Settings, LayoutDashboard, LogOut, FileText, Receipt, UserCheck, Gauge, ShieldCheck, Building2, AlertTriangle, Wrench, DollarSign, Ambulance, CreditCard, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
  subItems?: NavItem[];
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const navItems: NavItem[] = [
    { name: 'Tableau de bord', path: '/', icon: <LayoutDashboard size={20} /> },
    { 
      name: 'Véhicules', 
      path: '/vehicules', 
      icon: <Car size={20} />,
      subItems: [
        { name: 'Visite technique', path: '/vehicules/visites-techniques', icon: <Gauge size={16} /> },
        { name: 'Liste assurances', path: '/vehicules/assurances', icon: <ShieldCheck size={16} /> }
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
    { name: 'Infractions', path: '/infractions', icon: <AlertTriangle size={20} /> },
    { name: 'Interventions', path: '/interventions', icon: <Wrench size={20} /> },
    { name: 'Accidents', path: '/accidents', icon: <Ambulance size={20} /> },
    { name: 'Contrats', path: '/contrats', icon: <Car size={20} /> },
    { name: 'Factures', path: '/factures', icon: <Receipt size={20} /> },
    { name: 'Charges', path: '/charges', icon: <DollarSign size={20} /> },
    { name: 'Traites', path: '/traites', icon: <CreditCard size={20} /> },
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
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-black transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <img src="/media/photo_2025-08-22_23-06-42.jpg" alt="AdminCar Logo" className="h-12" />
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <nav className="mt-5 px-2 overflow-y-auto">
            {navItems.map((item) => (
              <div key={item.path} className="mb-1">
                {item.subItems ? (
                  // Parent item with dropdown
                  <div>
                    <div className="flex items-center mb-1">
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => 
                          `flex flex-grow items-center px-4 py-3 text-sm rounded-l-lg transition-colors ${
                            isActive 
                              ? 'bg-gray-800 text-white' 
                              : 'text-gray-100 hover:bg-gray-800 hover:text-white'
                          }`
                        }
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </NavLink>
                      <button 
                        className={`p-2 text-gray-100 hover:text-white focus:outline-none rounded-r-lg transition-colors ${
                          expandedItems[item.path] ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'
                        }`}
                        onClick={() => toggleExpand(item.path)}
                      >
                        {expandedItems[item.path] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    </div>
                    
                    {/* Sub-items */}
                    <div className={`transition-all duration-300 overflow-hidden ${
                      expandedItems[item.path] ? 'max-h-40' : 'max-h-0'
                    }`}>
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={({ isActive }) => 
                            `flex items-center px-4 py-2 ml-6 mt-1 text-sm rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-gray-800 text-white' 
                                : 'text-gray-100 hover:bg-gray-800 hover:text-white'
                            }`
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="mr-2">{subItem.icon}</span>
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Regular item without dropdown
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-gray-800 text-white' 
                          : 'text-gray-100 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-100 rounded-lg hover:bg-gray-800 hover:text-white"
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
