import React, { useState } from 'react';
import { Plus, Search, Filter, FileText, Calendar, CheckCircle, Trash2 } from 'lucide-react';
import EditButton from '../components/EditButton';

interface Vehicle {
  id: string;
  matricule: string;
  model: string;
  pricePerDay: number;
}

interface Client {
  name: string;
  permis: string;
  validite: string;
}

interface Equipment {
  climatisation: boolean;
  cric: boolean;
  documents: boolean;
  extincteur: boolean;
  gilet: boolean;
  posteRadio: boolean;
  roueSecours: boolean;
  siegeBebe: boolean;
}

type FuelLevel = 'reserve' | '1/4' | '1/2' | '3/4' | 'plein';
type PaymentType = 'espece' | 'cheque' | 'carte_bancaire' | 'virement';
type ContractStatus = 'en_cours' | 'retournee';

interface Contract {
  id: string;
  client: Client;
  contractNumber: string;
  contractDate: string;
  departureDate: string;
  contractLocation: string;
  duration: number;
  pickupLocation: string;
  matricule: string;
  vehicle: Vehicle;
  pricePerDay: number;
  startingKm: number;
  discount: number;
  fuelLevel: FuelLevel;
  total: number;
  guarantee: number;
  paymentType: PaymentType;
  advance: number;
  remaining: number;
  status: ContractStatus;
  secondDriver?: Client;
  equipment: Equipment;
  extension?: {
    duration: number;
    pricePerDay: number;
  };
}

// Sample initial data
const initialContracts: Contract[] = [
  {
    id: '1',
    client: {
      name: 'Jean Dupont',
      permis: 'P123456789',
      validite: '2026-05-15'
    },
    contractNumber: 'CTR-2025-001',
    contractDate: '2025-05-07',
    departureDate: '2025-05-08',
    contractLocation: 'Casablanca Centre',
    duration: 7,
    pickupLocation: 'Agence Principale',
    matricule: 'AB-123-CD',
    vehicle: {
      id: '1',
      matricule: 'AB-123-CD',
      model: 'Renault Clio',
      pricePerDay: 350
    },
    pricePerDay: 350,
    startingKm: 45000,
    discount: 200,
    fuelLevel: 'plein',
    total: 2250,
    guarantee: 5000,
    paymentType: 'carte_bancaire',
    advance: 1000,
    remaining: 1250,
    status: 'en_cours',
    equipment: {
      climatisation: true,
      cric: true,
      documents: true,
      extincteur: true,
      gilet: true,
      posteRadio: true,
      roueSecours: true,
      siegeBebe: false
    }
  },
  {
    id: '2',
    client: {
      name: 'Marie Martin',
      permis: 'P987654321',
      validite: '2026-08-20'
    },
    contractNumber: 'CTR-2025-002',
    contractDate: '2025-05-05',
    departureDate: '2025-05-06',
    contractLocation: 'Rabat Centre',
    duration: 3,
    pickupLocation: 'Agence Rabat',
    matricule: 'EF-456-GH',
    vehicle: {
      id: '2',
      matricule: 'EF-456-GH',
      model: 'Peugeot 208',
      pricePerDay: 400
    },
    pricePerDay: 400,
    startingKm: 28000,
    discount: 0,
    fuelLevel: '3/4',
    total: 1200,
    guarantee: 5000,
    paymentType: 'espece',
    advance: 1200,
    remaining: 0,
    status: 'retournee',
    equipment: {
      climatisation: true,
      cric: true,
      documents: true,
      extincteur: true,
      gilet: true,
      posteRadio: true,
      roueSecours: true,
      siegeBebe: false
    }
  },
  {
    id: '3',
    client: {
      name: 'Pierre Blanc',
      permis: 'P456789123',
      validite: '2025-12-10'
    },
    contractNumber: 'CTR-2025-003',
    contractDate: '2025-05-06',
    departureDate: '2025-05-07',
    contractLocation: 'Marrakech',
    duration: 14,
    pickupLocation: 'Aéroport Marrakech',
    matricule: 'IJ-789-KL',
    vehicle: {
      id: '3',
      matricule: 'IJ-789-KL',
      model: 'Dacia Logan',
      pricePerDay: 300
    },
    pricePerDay: 300,
    startingKm: 15000,
    discount: 500,
    fuelLevel: '1/2',
    total: 3700,
    guarantee: 5000,
    paymentType: 'virement',
    advance: 2000,
    remaining: 1700,
    status: 'en_cours',
    secondDriver: {
      name: 'Sophie Blanc',
      permis: 'P789123456',
      validite: '2026-03-15'
    },
    equipment: {
      climatisation: true,
      cric: true,
      documents: true,
      extincteur: true,
      gilet: true,
      posteRadio: true,
      roueSecours: true,
      siegeBebe: true
    },
    extension: {
      duration: 7,
      pricePerDay: 280
    }
  }
];

const initialVehicles: Vehicle[] = [
  {
    id: '1',
    matricule: 'AB-123-CD',
    model: 'Renault Clio',
    pricePerDay: 350
  },
  {
    id: '2',
    matricule: 'EF-456-GH',
    model: 'Peugeot 208',
    pricePerDay: 400
  },
  {
    id: '3',
    matricule: 'IJ-789-KL',
    model: 'Dacia Logan',
    pricePerDay: 300
  }
];

const Contrats: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContract, setEditedContract] = useState<Contract | null>(null);

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getFuelLevelColor = (level: FuelLevel): string => {
    const colors = {
      'reserve': 'text-red-500',
      '1/4': 'text-yellow-500',
      '1/2': 'text-blue-500',
      '3/4': 'text-green-300',
      'plein': 'text-green-500'
    };
    return colors[level];
  };

  const getStatusColor = (status: ContractStatus): string => {
    return status === 'en_cours' ? 'text-blue-500' : 'text-green-500';
  };

  const calculateTotal = (pricePerDay: number, duration: number, discount: number) => {
    return (pricePerDay * duration) - discount;
  };
  
  const handleEditClick = (contract: Contract, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContract(contract);
    setEditedContract({ ...contract });
    setEditMode(true);
  };
  
  const handleSaveEdit = () => {
    if (editedContract) {
      setContracts(contracts.map(contract => 
        contract.id === editedContract.id ? editedContract : contract
      ));
      setSelectedContract(editedContract);
      setEditMode(false);
      setEditedContract(null);
    }
  };
  
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedContract(null);
  };
  
  const handleInputChange = (field: string, value: any) => {
    if (editedContract) {
      const updatedContract = { ...editedContract } as Contract;
      
      if (field === 'pricePerDay' || field === 'duration' || field === 'discount') {
        // Recalculate total when price, duration or discount changes
        const pricePerDay = field === 'pricePerDay' ? Number(value) : editedContract.pricePerDay;
        const duration = field === 'duration' ? Number(value) : editedContract.duration;
        const discount = field === 'discount' ? Number(value) : editedContract.discount;
        updatedContract.total = calculateTotal(pricePerDay, duration, discount);
        
        // Update remaining amount
        updatedContract.remaining = updatedContract.total - updatedContract.advance;
      }
      
      if (field === 'advance') {
        // Update remaining amount when advance changes
        const advance = Number(value);
        updatedContract.advance = advance;
        updatedContract.remaining = updatedContract.total - advance;
      }
      
      // Handle nested objects
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        if (parentField === 'client') {
          updatedContract.client = {
            ...updatedContract.client,
            [childField]: value
          };
        } else if (parentField === 'secondDriver' && updatedContract.secondDriver) {
          updatedContract.secondDriver = {
            ...updatedContract.secondDriver,
            [childField]: value
          };
        } else if (parentField === 'vehicle') {
          updatedContract.vehicle = {
            ...updatedContract.vehicle,
            [childField]: childField === 'pricePerDay' ? Number(value) : value
          };
        } else if (parentField === 'equipment') {
          updatedContract.equipment = {
            ...updatedContract.equipment,
            [childField]: value
          };
        } else if (parentField === 'extension') {
          if (!updatedContract.extension) {
            updatedContract.extension = { duration: 0, pricePerDay: 0 };
          }
          updatedContract.extension = {
            ...updatedContract.extension,
            [childField]: Number(value)
          };
        }
      } else {
        (updatedContract[field as keyof Contract] as any) = value;
      }
      
      setEditedContract(updatedContract);
    }
  };
  
  const handleDeleteContract = (contractId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      setContracts(contracts.filter(contract => contract.id !== contractId));
      if (selectedContract?.id === contractId) {
        setSelectedContract(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Contrats</h1>
        <button
          onClick={() => setShowNewContractModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouveau Contrat
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un contrat..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ContractStatus)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="retournee">Retournée</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrat
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client & Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr 
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedContract?.id === contract.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <FileText size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.contractNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contract.duration} jours
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{contract.client.name}</div>
                      <div className="text-sm text-gray-500">{contract.vehicle.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(contract.departureDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.contractLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.total.toLocaleString('fr-FR')} DH
                      </div>
                      <div className={`text-xs ${
                        contract.remaining > 0 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {contract.remaining > 0 
                          ? `Reste: ${contract.remaining.toLocaleString('fr-FR')} DH`
                          : 'Payé'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contract.status === 'en_cours'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {contract.status === 'en_cours' ? 'En cours' : 'Retournée'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContract(contract);
                          setEditedContract({ ...contract });
                          setEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContract(contract.id, e);
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

        {/* Contract Details Panel */}
        <div className="lg:col-span-1">
          {selectedContract ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Détails du contrat</h2>
                  {!editMode ? (
                    <>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full mr-3 ${
                          selectedContract.status === 'en_cours'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedContract.status === 'en_cours' ? 'En cours' : 'Retournée'}
                        </span>
                        <EditButton
                          onClick={() => {
                            setEditedContract({ ...selectedContract });
                            setEditMode(true);
                          }}
                          size="sm"
                        />
                      </div>
                    </>
                  ) : (
                    <select
                      className="px-2 py-1 text-xs leading-5 font-semibold rounded border"
                      value={editedContract?.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="en_cours">En cours</option>
                      <option value="retournee">Retournée</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Contract Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">N° de Contrat</h3>
                  <div className="mt-1 flex items-center">
                    <FileText size={16} className="text-gray-400 mr-2" />
                    {editMode ? (
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editedContract?.contractNumber}
                        onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{selectedContract.contractNumber}</p>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Client</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Nom</label>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.client.name}
                            onChange={(e) => handleInputChange('client.name', e.target.value)}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Permis</label>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.client.permis}
                            onChange={(e) => handleInputChange('client.permis', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Validité</label>
                          <input
                            type="date"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.client.validite}
                            onChange={(e) => handleInputChange('client.validite', e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedContract.client.name}</p>
                        <p className="text-sm text-gray-500">Permis: {selectedContract.client.permis}</p>
                        <p className="text-sm text-gray-500">
                          Validité: {new Date(selectedContract.client.validite).toLocaleDateString('fr-FR')}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Vehicle Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Véhicule</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Modèle</label>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.vehicle.model}
                            onChange={(e) => handleInputChange('vehicle.model', e.target.value)}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Matricule</label>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.vehicle.matricule}
                            onChange={(e) => handleInputChange('vehicle.matricule', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Km départ</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.startingKm}
                            onChange={(e) => handleInputChange('startingKm', Number(e.target.value))}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedContract.vehicle.model}</p>
                        <p className="text-sm text-gray-500">Matricule: {selectedContract.vehicle.matricule}</p>
                        <p className="text-sm text-gray-500">Km départ: {selectedContract.startingKm}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Dates and Duration */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Période</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Date de départ</label>
                          <div className="flex items-center">
                            <Calendar size={16} className="text-gray-400 mr-2" />
                            <input
                              type="date"
                              className="w-full border rounded-lg p-2"
                              value={editedContract?.departureDate}
                              onChange={(e) => handleInputChange('departureDate', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Durée (jours)</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.duration}
                            onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                          />
                        </div>
                        {editedContract?.extension && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-500">Prolongation (jours)</label>
                            <input
                              type="number"
                              className="w-full border rounded-lg p-2"
                              value={editedContract?.extension?.duration}
                              onChange={(e) => handleInputChange('extension.duration', Number(e.target.value))}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <p className="text-sm text-gray-900">
                            Du {new Date(selectedContract.departureDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 ml-6">
                          {selectedContract.duration} jours
                          {selectedContract.extension && (
                            <span className="text-blue-600 ml-2">
                              (+{selectedContract.extension.duration} jours prolongation)
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Paiement</h3>
                  <div className="mt-1 space-y-2">
                    {editMode ? (
                      <>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Prix par jour (DH)</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.pricePerDay}
                            onChange={(e) => handleInputChange('pricePerDay', Number(e.target.value))}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Remise (DH)</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.discount}
                            onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex justify-between font-medium mb-2">
                          <span className="text-sm text-gray-500">Total:</span>
                          <span className="text-sm text-gray-900">{editedContract?.total} DH</span>
                        </div>
                        <div className="mb-2">
                          <label className="text-xs text-gray-500">Avance (DH)</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedContract?.advance}
                            onChange={(e) => handleInputChange('advance', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-sm text-gray-500">Reste à payer:</span>
                          <span className="text-sm text-amber-600">{editedContract?.remaining} DH</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Prix/jour:</span>
                          <span className="text-sm text-gray-900">{selectedContract.pricePerDay} DH</span>
                        </div>
                        {selectedContract.discount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Remise:</span>
                            <span className="text-sm text-red-600">-{selectedContract.discount} DH</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium">
                          <span className="text-sm text-gray-500">Total:</span>
                          <span className="text-sm text-gray-900">{selectedContract.total} DH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Avance:</span>
                          <span className="text-sm text-green-600">{selectedContract.advance} DH</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-sm text-gray-500">Reste à payer:</span>
                          <span className="text-sm text-amber-600">{selectedContract.remaining} DH</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Équipements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {editMode ? (
                      Object.entries(editedContract?.equipment || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => handleInputChange(`equipment.${key}`, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        </div>
                      ))
                    ) : (
                      Object.entries(selectedContract.equipment).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <CheckCircle 
                            size={16} 
                            className={value ? 'text-green-500' : 'text-gray-300'} 
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Edit Buttons */}
                {editMode && (
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Enregistrer
                    </button>
                  </div>
                )}

                {!editMode && (
                  <div className="pt-4 border-t">
                    <div className="flex space-x-3">
                      <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Imprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <FileText size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun contrat sélectionné
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez un contrat pour voir ses détails
                </p>
                <button
                  onClick={() => setShowNewContractModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouveau contrat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Contract Modal */}
      {showNewContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouveau Contrat</h2>
            <form className="space-y-6">
              {/* Client Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Nom"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="text"
                    placeholder="N° Permis"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="date"
                    placeholder="Validité"
                    className="border rounded-lg p-2"
                  />
                </div>
              </section>

              {/* Contract Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information Contrat</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="N° de Contrat"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="date"
                    placeholder="Date de Contrat"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="date"
                    placeholder="Date de Sortie"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="text"
                    placeholder="Lieu de Contrat"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="Durée (jours)"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="text"
                    placeholder="Lieu Récupération"
                    className="border rounded-lg p-2"
                  />
                  <select className="border rounded-lg p-2">
                    <option value="">Sélectionner Véhicule</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.matricule} - {vehicle.model}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Prix par Jour"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="Km Départ"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="Remise (DH)"
                    className="border rounded-lg p-2"
                  />
                  <select className="border rounded-lg p-2">
                    <option value="">Carburant Départ</option>
                    <option value="reserve" className="text-red-500">Réserve</option>
                    <option value="1/4" className="text-yellow-500">1/4</option>
                    <option value="1/2" className="text-blue-500">1/2</option>
                    <option value="3/4" className="text-green-300">3/4</option>
                    <option value="plein" className="text-green-500">Plein</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Garantie"
                    className="border rounded-lg p-2"
                  />
                  <select className="border rounded-lg p-2">
                    <option value="">Type Paiement</option>
                    <option value="espece">Espèce</option>
                    <option value="cheque">Chèque</option>
                    <option value="carte_bancaire">Carte Bancaire</option>
                    <option value="virement">Virement</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Avance"
                    className="border rounded-lg p-2"
                  />
                </div>
              </section>

              {/* Second Driver */}
              <section className="border-b pb-4">
                <div className="flex items-center mb-3">
                  <h3 className="font-semibold">Deuxième Conducteur</h3>
                  <input type="checkbox" className="ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Nom"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="text"
                    placeholder="N° Permis"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="date"
                    placeholder="Validité"
                    className="border rounded-lg p-2"
                  />
                </div>
              </section>

              {/* Equipment */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Équipements/Accessoires</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Climatisation
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Cric
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Documents
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Extincteur
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Gilet
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Poste Radio
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Roue Secours
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Siège Bébé
                  </label>
                </div>
              </section>

              {/* Extension */}
              <section>
                <div className="flex items-center mb-3">
                  <h3 className="font-semibold">Prolongation</h3>
                  <input type="checkbox" className="ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Durée (jours)"
                    className="border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="Prix par Jour"
                    className="border rounded-lg p-2"
                  />
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewContractModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Créer Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contrats;