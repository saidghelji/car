import React, { useState } from 'react';
import { Plus, Search, Filter, FileText, Car, User2, Calendar, Trash2 } from 'lucide-react';
import EditButton from '../components/EditButton';

type ReservationStatus = 'en_cours' | 'validee' | 'annulee' | 'ratee';

interface Client {
  id: string;
  name: string;
  permis: string;
  validite: string;
  email: string;
  phone: string;
}

interface Vehicle {
  id: string;
  matricule: string;
  model: string;
  pricePerDay: number;
  isAvailable: boolean;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  reservationDate: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: ReservationStatus;
  client: Client;
  vehicle: Vehicle;
  totalAmount: number;
  advance: number;
  notes?: string;
}

// Sample data
const sampleClients: Client[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    permis: 'P123456789',
    validite: '2026-05-15',
    email: 'jean.dupont@example.com',
    phone: '06 12 34 56 78'
  },
  {
    id: '2',
    name: 'Marie Martin',
    permis: 'P987654321',
    validite: '2026-08-20',
    email: 'marie.martin@example.com',
    phone: '06 23 45 67 89'
  },
  {
    id: '3',
    name: 'Pierre Blanc',
    permis: 'P456789123',
    validite: '2025-12-10',
    email: 'pierre.blanc@example.com',
    phone: '06 34 56 78 90'
  }
];

const sampleVehicles: Vehicle[] = [
  {
    id: '1',
    matricule: 'AB-123-CD',
    model: 'Renault Clio',
    pricePerDay: 350,
    isAvailable: true
  },
  {
    id: '2',
    matricule: 'EF-456-GH',
    model: 'Peugeot 208',
    pricePerDay: 400,
    isAvailable: true
  },
  {
    id: '3',
    matricule: 'IJ-789-KL',
    model: 'Dacia Logan',
    pricePerDay: 300,
    isAvailable: false
  }
];

const initialReservations: Reservation[] = [
  {
    id: '1',
    reservationNumber: 'RES-2025-001',
    reservationDate: '2025-05-07',
    startDate: '2025-05-15',
    endDate: '2025-05-22',
    duration: 7,
    status: 'en_cours',
    client: sampleClients[0],
    vehicle: sampleVehicles[0],
    totalAmount: 2450,
    advance: 500,
    notes: 'Client régulier'
  },
  {
    id: '2',
    reservationNumber: 'RES-2025-002',
    reservationDate: '2025-05-06',
    startDate: '2025-05-20',
    endDate: '2025-05-23',
    duration: 3,
    status: 'validee',
    client: sampleClients[1],
    vehicle: sampleVehicles[1],
    totalAmount: 1200,
    advance: 1200
  },
  {
    id: '3',
    reservationNumber: 'RES-2025-003',
    reservationDate: '2025-05-05',
    startDate: '2025-05-12',
    endDate: '2025-05-26',
    duration: 14,
    status: 'annulee',
    client: sampleClients[2],
    vehicle: sampleVehicles[2],
    totalAmount: 4200,
    advance: 1000,
    notes: 'Annulation 24h avant'
  }
];

const StatusBadge = ({ status }: { status: ReservationStatus }) => {
  const statusConfig = {
    en_cours: { color: 'bg-blue-100 text-blue-800', label: 'En cours' },
    validee: { color: 'bg-green-100 text-green-800', label: 'Validée' },
    annulee: { color: 'bg-red-100 text-red-800', label: 'Annulée' },
    ratee: { color: 'bg-gray-100 text-gray-800', label: 'Ratée' }
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedReservation, setEditedReservation] = useState<Reservation | null>(null);

  // Handle edit functions
  const handleEditClick = () => {
    if (selectedReservation) {
      setEditedReservation({ ...selectedReservation });
      setEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedReservation) {
      setReservations(reservations.map(reservation =>
        reservation.id === editedReservation.id ? editedReservation : reservation
      ));
      setSelectedReservation(editedReservation);
      setEditMode(false);
      setEditedReservation(null);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedReservation(null);
  };

  const handleDeleteReservation = (reservationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      setReservations(reservations.filter(reservation => reservation.id !== reservationId));
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(null);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (editedReservation) {
      const updatedReservation = { ...editedReservation } as Reservation;
      
      // Handle nested objects
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        if (parentField === 'client') {
          updatedReservation.client = {
            ...updatedReservation.client,
            [childField]: value
          };
        } else if (parentField === 'vehicle') {
          updatedReservation.vehicle = {
            ...updatedReservation.vehicle,
            [childField]: childField === 'pricePerDay' ? Number(value) : value
          };
        }
      } else if (field === 'startDate' || field === 'endDate') {
        // Update duration when dates change
        updatedReservation[field] = value as string;
        
        if (field === 'startDate' && updatedReservation.endDate) {
          const start = new Date(value);
          const end = new Date(updatedReservation.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updatedReservation.duration = diffDays;
          
          // Update total amount based on duration and price per day
          updatedReservation.totalAmount = updatedReservation.vehicle.pricePerDay * diffDays;
        } else if (field === 'endDate' && updatedReservation.startDate) {
          const start = new Date(updatedReservation.startDate);
          const end = new Date(value);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updatedReservation.duration = diffDays;
          
          // Update total amount based on duration and price per day
          updatedReservation.totalAmount = updatedReservation.vehicle.pricePerDay * diffDays;
        }
      } else if (field === 'advance') {
        // Convert to number for amount
        updatedReservation.advance = parseFloat(value);
      } else if (field === 'totalAmount') {
        // Convert to number for amount
        updatedReservation.totalAmount = parseFloat(value);
      } else {
        // For other fields, just update the value
        // Use type assertion based on the field type
        if (field === 'status') {
          updatedReservation.status = value as ReservationStatus;
        } else if (field === 'notes') {
          updatedReservation.notes = value as string;
        } else if (field === 'reservationNumber' || field === 'reservationDate' || field === 'id') {
          updatedReservation[field] = value as string;
        } else {
          // For any other fields, use a safer approach
          console.warn(`Unhandled field type: ${field}`);
        }
      }
      
      setEditedReservation(updatedReservation);
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h1>
        <button
          onClick={() => setShowNewReservationModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Réservation
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
              placeholder="Rechercher une réservation..."
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
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ReservationStatus)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
              <option value="ratee">Ratée</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reservations List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Réservation
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
                {filteredReservations.map((reservation) => (
                  <tr 
                    key={reservation.id}
                    onClick={() => setSelectedReservation(reservation)}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedReservation?.id === reservation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <FileText size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.reservationNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {reservation.duration} jours
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{reservation.client.name}</div>
                      <div className="text-sm text-gray-500">{reservation.vehicle.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(reservation.startDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.totalAmount.toLocaleString('fr-FR')} DH
                      </div>
                      <div className={`text-xs ${
                        reservation.advance < reservation.totalAmount ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {reservation.advance < reservation.totalAmount 
                          ? `Avance: ${reservation.advance.toLocaleString('fr-FR')} DH`
                          : 'Payé'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                          setEditedReservation({ ...reservation });
                          setEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => handleDeleteReservation(reservation.id, e)}
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

        {/* Reservation Details or New Reservation Form */}
        <div className="lg:col-span-1">
          {selectedReservation ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Détails de la réservation</h2>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={selectedReservation.status} />
                    {!editMode && (
                      <EditButton
                        onClick={handleEditClick}
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Reservation Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">N° de Réservation</h3>
                  <div className="mt-1 flex items-center">
                    <FileText size={16} className="text-gray-400 mr-2" />
                    {editMode ? (
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editedReservation?.reservationNumber}
                        onChange={(e) => handleInputChange('reservationNumber', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{selectedReservation.reservationNumber}</p>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Client</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedReservation?.client.name}
                          onChange={(e) => handleInputChange('client.name', e.target.value)}
                          placeholder="Nom du client"
                        />
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedReservation?.client.permis}
                          onChange={(e) => handleInputChange('client.permis', e.target.value)}
                          placeholder="Numéro de permis"
                        />
                        <input
                          type="date"
                          className="w-full border rounded-lg p-2"
                          value={editedReservation?.client.validite}
                          onChange={(e) => handleInputChange('client.validite', e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedReservation.client.name}</p>
                        <p className="text-sm text-gray-500">Permis: {selectedReservation.client.permis}</p>
                        <p className="text-sm text-gray-500">
                          Validité: {new Date(selectedReservation.client.validite).toLocaleDateString('fr-FR')}
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
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedReservation?.vehicle.model}
                          onChange={(e) => handleInputChange('vehicle.model', e.target.value)}
                          placeholder="Modèle du véhicule"
                        />
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedReservation?.vehicle.matricule}
                          onChange={(e) => handleInputChange('vehicle.matricule', e.target.value)}
                          placeholder="Matricule"
                        />
                        <input
                          type="number"
                          className="w-full border rounded-lg p-2"
                          value={editedReservation?.vehicle.pricePerDay}
                          onChange={(e) => handleInputChange('vehicle.pricePerDay', e.target.value)}
                          placeholder="Prix par jour"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedReservation.vehicle.model}</p>
                        <p className="text-sm text-gray-500">
                          Matricule: {selectedReservation.vehicle.matricule}
                        </p>
                        <p className="text-sm text-gray-500">
                          Prix/jour: {selectedReservation.vehicle.pricePerDay} DH
                        </p>
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
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-500">Du:</label>
                          <input
                            type="date"
                            className="w-full border rounded-lg p-2"
                            value={editedReservation?.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-500">Au:</label>
                          <input
                            type="date"
                            className="w-full border rounded-lg p-2"
                            value={editedReservation?.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-500">Durée (jours):</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedReservation?.duration}
                            onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <p className="text-sm text-gray-900">
                            Du {new Date(selectedReservation.startDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 ml-6">
                          Au {new Date(selectedReservation.endDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-500 ml-6">
                          {selectedReservation.duration} jours
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
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-500">Total:</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedReservation?.totalAmount}
                            onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-500">Avance:</label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={editedReservation?.advance}
                            onChange={(e) => handleInputChange('advance', e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-500">Statut:</label>
                          <select
                            className="w-full border rounded-lg p-2"
                            value={editedReservation?.status}
                            onChange={(e) => handleInputChange('status', e.target.value as ReservationStatus)}
                          >
                            <option value="en_cours">En cours</option>
                            <option value="validee">Validée</option>
                            <option value="annulee">Annulée</option>
                            <option value="ratee">Ratée</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total:</span>
                          <span className="text-sm text-gray-900">
                            {selectedReservation.totalAmount.toLocaleString('fr-FR')} DH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Avance:</span>
                          <span className="text-sm text-green-600">
                            {selectedReservation.advance.toLocaleString('fr-FR')} DH
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-sm text-gray-500">Reste à payer:</span>
                          <span className="text-sm text-amber-600">
                            {(selectedReservation.totalAmount - selectedReservation.advance).toLocaleString('fr-FR')} DH
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  {editMode ? (
                    <textarea
                      className="w-full border rounded-lg p-2 mt-1"
                      value={editedReservation?.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Ajouter des notes..."
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{selectedReservation.notes || 'Aucune note'}</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    {editMode ? (
                      <>
                        <button 
                          onClick={handleSaveEdit}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Enregistrer
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Imprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Calendar size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucune réservation sélectionnée
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une réservation pour voir ses détails
                </p>
                <button
                  onClick={() => setShowNewReservationModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouvelle réservation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Reservation Modal */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Réservation</h2>
            <form className="space-y-6">
              {/* Client Section */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2"
                      onChange={(e) => {
                        const client = sampleClients.find(c => c.id === e.target.value);
                        setSelectedClient(client || null);
                      }}
                    >
                      <option value="">Sélectionner un client</option>
                      {sampleClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° Permis
                    </label>
                    <input
                      type="text"
                      value={selectedClient?.permis || ''}
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de validité
                    </label>
                    <input
                      type="text"
                      value={selectedClient?.validite ? new Date(selectedClient.validite).toLocaleDateString('fr-FR') : ''}
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              </section>

              {/* Reservation Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informations Réservation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° Réservation
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="RES-2025-XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de réservation
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      État
                    </label>
                    <select className="w-full border rounded-lg p-2">
                      <option value="en_cours">En cours</option>
                      <option value="validee">Validée</option>
                      <option value="annulee">Annulée</option>
                      <option value="ratee">Ratée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée (jours)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Véhicule
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2"
                      onChange={(e) => {
                        const vehicle = sampleVehicles.find(v => v.id === e.target.value);
                        setSelectedVehicle(vehicle || null);
                      }}
                    >
                      <option value="">Sélectionner un véhicule</option>
                      {sampleVehicles.filter(v => v.isAvailable).map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.model} - {vehicle.matricule}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix par jour
                    </label>
                    <input
                      type="number"
                      value={selectedVehicle?.pricePerDay || ''}
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant total
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avance
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full border rounded-lg p-2"
                      rows={3}
                      placeholder="Ajouter des notes ou commentaires..."
                    ></textarea>
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewReservationModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Créer Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;