import { useState } from 'react';
import { 
  Search, Plus, Trash2, UserCircle,
  Mail, Phone, MapPin, FileText, Clock 
} from 'lucide-react';
import EditButton from '../components/EditButton';
import CustomerForm from '../components/CustomerForm';

// Sample customer data
const initialCustomers = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '06 12 34 56 78',
    address: '123 Rue de Paris, 75001 Paris',
    licenseNumber: 'AZ123456789',
    createdAt: '12/01/2023',
    totalRentals: 5,
    status: 'Actif'
  },
  {
    id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    phone: '06 23 45 67 89',
    address: '456 Avenue Victor Hugo, 69002 Lyon',
    licenseNumber: 'BY987654321',
    createdAt: '05/03/2023',
    totalRentals: 2,
    status: 'Actif'
  },
  {
    id: '3',
    name: 'Pierre Blanc',
    email: 'pierre.blanc@example.com',
    phone: '06 34 56 78 90',
    address: '789 Boulevard Jean Jaurès, 33000 Bordeaux',
    licenseNumber: 'CX456789123',
    createdAt: '18/06/2023',
    totalRentals: 3,
    status: 'Actif'
  },
  {
    id: '4',
    name: 'Sophie Petit',
    email: 'sophie.petit@example.com',
    phone: '06 45 67 89 01',
    address: '12 Rue de la Liberté, 13001 Marseille',
    licenseNumber: 'DW789123456',
    createdAt: '27/09/2023',
    totalRentals: 1,
    status: 'Inactif'
  },
  {
    id: '5',
    name: 'Thomas Moreau',
    email: 'thomas.moreau@example.com',
    phone: '06 56 78 90 12',
    address: '34 Allée des Pins, 44000 Nantes',
    licenseNumber: 'EV321654987',
    createdAt: '03/11/2023',
    totalRentals: 4,
    status: 'Actif'
  }
];

const Customers = () => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [showModalForm, setShowModalForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof initialCustomers[0] | null>(null);

  // Handle search
  const filteredCustomers = customers.filter(customer => {
    return (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  });

  const handleAddCustomer = (data: any) => {
    // Here you would typically make an API call to save the customer
    const newCustomer = {
      id: String(customers.length + 1),
      name: `${data.prenomFr} ${data.nomFr}`,
      email: '',  // Add these fields if needed in your customer list
      phone: data.telephone || '',
      address: data.adresseFr || '',
      licenseNumber: data.numeroPermis,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      totalRentals: 0,
      status: 'Actif'
    };

    setCustomers([...customers, newCustomer]);
    setShowModalForm(false);
  };

  const handleEditCustomer = (customer: typeof initialCustomers[0]) => {
    setSelectedCustomer(customer);
    setShowModalForm(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      setCustomers(customers.filter(customer => customer.id !== customerId));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
        <button 
          onClick={() => setShowModalForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Ajouter un client
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un client..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Customers table */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locations
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserCircle size={24} className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">Client depuis {customer.createdAt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail size={14} className="mr-1 text-gray-500" /> {customer.email}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <Phone size={14} className="mr-1 text-gray-500" /> {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.totalRentals} locations</div>
                      <div className={`text-xs ${customer.status === 'Actif' ? 'text-green-600' : 'text-red-600'}`}>
                        {customer.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Customer Details */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails du client</h2>
                <EditButton
                  onClick={() => handleEditCustomer(selectedCustomer)}
                  size="sm"
                />
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCircle size={32} className="text-gray-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-500">Client depuis {selectedCustomer.createdAt}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                    <p className="flex items-center mt-1">
                      <Mail size={16} className="text-gray-500 mr-2" />
                      <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline">
                        {selectedCustomer.email}
                      </a>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Téléphone</p>
                    <p className="flex items-center mt-1">
                      <Phone size={16} className="text-gray-500 mr-2" />
                      <a href={`tel:${selectedCustomer.phone}`} className="text-blue-600 hover:underline">
                        {selectedCustomer.phone}
                      </a>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Adresse</p>
                    <p className="flex items-start mt-1">
                      <MapPin size={16} className="text-gray-500 mr-2 mt-1" />
                      <span>{selectedCustomer.address}</span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Numéro de permis</p>
                    <p className="flex items-center mt-1">
                      <FileText size={16} className="text-gray-500 mr-2" />
                      <span>{selectedCustomer.licenseNumber}</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Historique des locations</p>
                  
                  {selectedCustomer.totalRentals > 0 ? (
                    <div className="space-y-2">
                      {[...Array(Math.min(3, selectedCustomer.totalRentals))].map((_, index) => (
                        <div key={index} className="flex items-start p-2 bg-gray-50 rounded-md">
                          <Clock size={16} className="text-gray-500 mr-2 mt-1" />
                          <div>
                            <p className="text-sm font-medium">
                              Location {selectedCustomer.totalRentals - index}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(2023, 11 - index, 15 + index * 5).toLocaleDateString('fr-FR')} - 
                              {new Date(2023, 11 - index, 19 + index * 5).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {selectedCustomer.totalRentals > 3 && (
                        <a href="#" className="text-sm text-blue-600 hover:underline block text-center mt-2">
                          Voir toutes les locations ({selectedCustomer.totalRentals})
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Aucune location enregistrée</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <EditButton
                  onClick={() => handleEditCustomer(selectedCustomer)}
                  size="sm"
                  withText={true}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <UserCircle size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun client sélectionné</h3>
                <p className="text-gray-500 mb-4">Sélectionnez un client pour voir ses détails</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                  <Plus size={16} className="mr-2" />
                  Nouveau client
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {showModalForm && (
        <CustomerForm
          onSubmit={handleAddCustomer}
          onClose={() => setShowModalForm(false)}
        />
      )}
    </div>
  );
};

export default Customers;