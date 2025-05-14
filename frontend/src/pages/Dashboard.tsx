import React from 'react';
import { Car, Users, CalendarDays, Banknote, AlertTriangle, TrendingUp, ArrowDownToLine, PenTool as Tools } from 'lucide-react';

// Widget component
const StatWidget = ({ title, value, icon, color }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string; 
}) => (
  <div className="bg-white rounded-lg shadow p-5 transition-all duration-300 hover:shadow-md">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Activity item component
const ActivityItem = ({ title, time, icon }: { 
  title: string; 
  time: string; 
  icon: React.ReactNode; 
}) => (
  <div className="flex items-start space-x-3 py-3">
    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

const Dashboard = () => {
  // Sample data
  const stats = [
    { 
      title: "Véhicules actifs", 
      value: "48", 
      icon: <Car size={20} className="text-white" />, 
      color: "bg-blue-600" 
    },
    { 
      title: "Réservations aujourd'hui", 
      value: "12", 
      icon: <CalendarDays size={20} className="text-white" />, 
      color: "bg-green-600" 
    },
    { 
      title: "Clients actifs", 
      value: "156", 
      icon: <Users size={20} className="text-white" />, 
      color: "bg-purple-600" 
    },
    { 
      title: "Revenus du mois", 
      value: "35 850 €", 
      icon: <Banknote size={20} className="text-white" />, 
      color: "bg-amber-600" 
    },
  ];
  
  const recentActivity = [
    { 
      title: "Nouvelle réservation - Renault Clio", 
      time: "Il y a 5 minutes", 
      icon: <CalendarDays size={18} /> 
    },
    { 
      title: "Retour de véhicule - Peugeot 308", 
      time: "Il y a 45 minutes", 
      icon: <ArrowDownToLine size={18} /> 
    },
    { 
      title: "Maintenance programmée - Citroën C3", 
      time: "Il y a 2 heures", 
      icon: <Tools size={18} /> 
    },
    { 
      title: "Nouveau client - Marie Dupont", 
      time: "Il y a 3 heures", 
      icon: <Users size={18} /> 
    },
  ];
  
  const alerts = [
    {
      title: "Maintenance requise (4 véhicules)",
      description: "Des véhicules nécessitent une maintenance programmée cette semaine",
      action: "Voir les détails",
      type: "warning",
    },
    {
      title: "Paiements en attente (8)",
      description: "Des factures clients sont en attente de paiement",
      action: "Gérer les factures",
      type: "info",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatWidget key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations */}
        <div className="bg-white rounded-lg shadow col-span-2">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Réservations récentes</h2>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              Voir tout
            </button>
          </div>
          <div className="p-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de début
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Pierre Martin</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Renault Clio</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">15/05/2025</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Confirmé
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Sophie Petit</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Peugeot 208</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">16/05/2025</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      En attente
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Jean Dupont</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Citroën C4</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">18/05/2025</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Payé
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Marie Leroy</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Audi A3</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">20/05/2025</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Confirmé
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts and Activity */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-medium">Alertes</h2>
            </div>
            <div className="p-4 space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  alert.type === 'warning' ? 'bg-amber-50 border-l-4 border-amber-400' : 'bg-blue-50 border-l-4 border-blue-400'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {alert.type === 'warning' ? (
                        <AlertTriangle size={18} className="text-amber-400" />
                      ) : (
                        <TrendingUp size={18} className="text-blue-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">
                        {alert.title}
                      </h3>
                      <div className="mt-1 text-sm text-gray-600">
                        {alert.description}
                      </div>
                      <div className="mt-2">
                        <button className={`text-sm font-medium ${
                          alert.type === 'warning' ? 'text-amber-700 hover:text-amber-600' : 'text-blue-700 hover:text-blue-600'
                        }`}>
                          {alert.action}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-medium">Activité récente</h2>
            </div>
            <div className="p-4 divide-y divide-gray-100">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;