import { useState } from 'react';
import { Plus, Search, Building2, Mail, Phone, X, Check, Trash2 } from 'lucide-react';
import EditButton from '../components/EditButton';

interface Agency {
  id: string;
  name: string;
  manager: string;
  patent: string;
  ice: string;
  taxId: string;
  cnss: string;
  email: string;
  contact: string;
  status: 'open' | 'closed';
}

// Sample data
const initialAgencies: Agency[] = [
  {
    id: '1',
    name: 'Agence Centrale',
    manager: 'Mohammed Alami',
    patent: 'PAT123456',
    ice: 'ICE000123456789',
    taxId: 'IF123456',
    cnss: 'CNSS987654',
    email: 'contact@agencecentrale.ma',
    contact: '0522123456',
    status: 'open'
  }
];

const VehicleAgencies = () => {
  const [agencies, setAgencies] = useState(initialAgencies);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAgencyModal, setShowNewAgencyModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedAgency, setEditedAgency] = useState<Agency | null>(null);

  const filteredAgencies = agencies.filter(agency => {
    const searchString = searchTerm.toLowerCase();
    return (
      agency.name.toLowerCase().includes(searchString) ||
      agency.manager.toLowerCase().includes(searchString) ||
      agency.ice.toLowerCase().includes(searchString)
    );
  });

  const handleEditClick = () => {
    setEditMode(true);
    setEditedAgency(selectedAgency);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedAgency(null);
  };

  const handleSaveEdit = () => {
    if (editedAgency) {
      setAgencies(agencies.map(agency => 
        agency.id === editedAgency.id ? editedAgency : agency
      ));
      setSelectedAgency(editedAgency);
      setEditMode(false);
      setEditedAgency(null);
    }
  };

  const handleInputChange = (field: keyof Agency, value: string) => {
    if (editedAgency) {
      setEditedAgency({
        ...editedAgency,
        [field]: value
      });
    }
  };

  const handleDeleteAgency = (agencyId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) {
      setAgencies(agencies.filter(agency => agency.id !== agencyId));
      if (selectedAgency?.id === agencyId) {
        setSelectedAgency(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Agences</h1>
        <button
          onClick={() => setShowNewAgencyModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Agence
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une agence..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agencies List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agence
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ICE
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgencies.map((agency) => (
                  <tr
                    key={agency.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedAgency?.id === agency.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedAgency(agency)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Building2 size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                          <div className="text-xs text-gray-500">{agency.manager}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agency.email}</div>
                      <div className="text-xs text-gray-500">{agency.contact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agency.ice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agency.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agency.status === 'open' ? 'Ouvert' : 'Fermé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgency(agency);
                          setEditedAgency({ ...agency });
                          setEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgency(agency.id);
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

        {/* Agency Details Panel */}
        <div className="lg:col-span-1">
          {selectedAgency ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de l'agence</h2>
                {!editMode ? (
                  <EditButton
                    onClick={handleEditClick}
                    size="sm"
                  />
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Information générale</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Nom:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.name}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Gérant:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.manager}
                          onChange={(e) => handleInputChange('manager', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.manager}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Legal Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Information légale</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Patent:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.patent}
                          onChange={(e) => handleInputChange('patent', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.patent}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">ICE:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.ice}
                          onChange={(e) => handleInputChange('ice', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.ice}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">IF:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.taxId}
                          onChange={(e) => handleInputChange('taxId', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.taxId}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">CNSS:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.cnss}
                          onChange={(e) => handleInputChange('cnss', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.cnss}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Email:</span>
                      </div>
                      {editMode ? (
                        <input
                          type="email"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.email}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Contact:</span>
                      </div>
                      {editMode ? (
                        <input
                          type="tel"
                          className="text-sm border rounded p-1 w-2/3"
                          value={editedAgency?.contact}
                          onChange={(e) => handleInputChange('contact', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedAgency.contact}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">État</h3>
                  {editMode ? (
                    <div className="mt-2 flex space-x-4">
                      <label className="inline-flex items-center relative">
                        <input
                          type="radio"
                          name="status"
                          value="open"
                          checked={editedAgency?.status === 'open'}
                          onChange={() => handleInputChange('status', 'open')}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 border-2 border-green-500 rounded-md peer-checked:bg-green-500 peer-checked:border-green-600 transition-colors">
                          <svg 
                            className="w-4 h-4 text-white absolute left-1 top-1 hidden peer-checked:block" 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="ml-2 text-sm text-gray-700">Ouvert</span>
                      </label>
                      <label className="inline-flex items-center relative">
                        <input
                          type="radio"
                          name="status"
                          value="closed"
                          checked={editedAgency?.status === 'closed'}
                          onChange={() => handleInputChange('status', 'closed')}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 border-2 border-red-500 rounded-md peer-checked:bg-red-500 peer-checked:border-red-600 transition-colors">
                          <svg 
                            className="w-4 h-4 text-white absolute left-1 top-1 hidden peer-checked:block" 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="ml-2 text-sm text-gray-700">Fermé</span>
                      </label>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedAgency.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedAgency.status === 'open' ? 'Ouvert' : 'Fermé'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Building2 size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune agence sélectionnée</h3>
                <p className="text-gray-500 mb-4">Sélectionnez une agence pour voir ses détails</p>
                <button 
                  onClick={() => setShowNewAgencyModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouvelle agence
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Agency Modal */}
      {showNewAgencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Agence</h2>
            <form className="space-y-6">
              {/* Basic Information */}
              <section className="space-y-4">
                <h3 className="font-semibold">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agence (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gérant (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Legal Information */}
              <section className="space-y-4">
                <h3 className="font-semibold">Informations légales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patent
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ICE
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IF
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CNSS
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="space-y-4">
                <h3 className="font-semibold">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact
                    </label>
                    <input
                      type="tel"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              </section>

              {/* Status */}
              <section className="space-y-4">
                <h3 className="font-semibold">État</h3>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="open"
                      className="form-radio text-green-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Ouvert</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="closed"
                      className="form-radio text-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Fermé</span>
                  </label>
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewAgencyModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAgencies;