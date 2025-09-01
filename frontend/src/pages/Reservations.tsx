import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Car, Trash2, FileText, Calendar, X } from 'lucide-react';
import EditButton from '../components/EditButton';
import CloseButton from '../components/CloseButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Customer } from './Customers';
import { Vehicle } from './Vehicles';

registerLocale('fr', fr);

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

export type ReservationStatus = 'en_cours' | 'validee' | 'annulee' | 'fin_de_periode';

export interface Reservation {
  _id: string;
  reservationNumber: string;
  reservationDate: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: ReservationStatus;
  customer: Customer | string;
  vehicle: Vehicle | string;
  totalAmount: number;
  advance: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const formatDateToFrench = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const StatusBadge = ({ status }: { status: ReservationStatus }) => {
  const statusConfig = {
    en_cours: { color: 'bg-blue-100 text-blue-800', label: 'En cours' },
    validee: { color: 'bg-green-100 text-green-800', label: 'Validée' },
    annulee: { color: 'bg-red-100 text-red-800', label: 'Annulée' },
    fin_de_periode: { color: 'bg-gray-100 text-gray-800', label: 'Fin de période' }
  };
  const config = statusConfig[status];
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

const API_URL = 'http://localhost:5000';

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('');
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedReservation, setEditedReservation] = useState<Reservation | null>(null);
  const [editValidationErrors, setEditValidationErrors] = useState<{[key: string]: string}>({});

  const API_URL_RESERVATIONS = `${API_URL}/api/reservations`;
  const API_URL_CUSTOMERS = `${API_URL}/api/customers`;
  const API_URL_VEHICLES = `${API_URL}/api/vehicles`;

  const handleViewDetails = (reservation: Reservation) => {
    if (editMode) {
      if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
        setSelectedReservation(reservation);
        setEditMode(false);
        setEditedReservation(null);
        setEditValidationErrors({});
      }
    } else {
      setSelectedReservation(reservation);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reservationsRes, customersRes, vehiclesRes] = await Promise.all([
        axios.get<Reservation[]>(API_URL_RESERVATIONS),
        axios.get<Customer[]>(API_URL_CUSTOMERS),
        axios.get<Vehicle[]>(API_URL_VEHICLES)
      ]);

      const populatedReservations = reservationsRes.data.map(res => {
        const customer = customersRes.data.find(c => c._id === (res.customer as any));
        const vehicle = vehiclesRes.data.find(v => v._id === (res.vehicle as any));
        return { ...res, customer: customer || res.customer, vehicle: vehicle || res.vehicle };
      });

      setReservations(populatedReservations);
      setCustomers(customersRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredReservations = reservations.filter(reservation => {
    const searchString = searchTerm.toLowerCase();
    const currentCustomer = typeof reservation.customer === 'object' && reservation.customer ? reservation.customer : null;
    const customerName = currentCustomer ? `${currentCustomer.prenomFr || ''} ${currentCustomer.nomFr || ''}`.toLowerCase() : '';

    const currentVehicle = typeof reservation.vehicle === 'object' && reservation.vehicle ? reservation.vehicle : null;
    const vehicleModel = currentVehicle ? (currentVehicle.model || '').toLowerCase() : '';

    const matchesSearch = (
      reservation.reservationNumber.toLowerCase().includes(searchString) ||
      customerName.includes(searchString) ||
      vehicleModel.includes(searchString)
    );

    const reservationDate = new Date(reservation.reservationDate);
    const matchesDate = selectedDateFilter ?
      reservationDate.toDateString() === selectedDateFilter.toDateString() :
      true;

    const matchesStatus = statusFilter ? reservation.status === statusFilter : true;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const handleAddReservation = async (data: Partial<Reservation>) => {
    try {
      const response = await axios.post<Reservation>(API_URL_RESERVATIONS, data);
      const newReservation = response.data;
      const customer = customers.find(c => c._id === (newReservation.customer as any));
      const vehicle = vehicles.find(v => v._id === (newReservation.vehicle as any));
      const populatedReservation = { ...newReservation, customer: customer || newReservation.customer, vehicle: vehicle || newReservation.vehicle };

      setReservations([...reservations, populatedReservation]);
      setShowNewReservationModal(false);
      toast.success('Reservation added successfully.');
    } catch (err) {
      console.error('Error adding reservation:', err);
      toast.error('Failed to add reservation.');
    }
  };

  const handleUpdateReservation = async (data: Partial<Reservation>) => {
    if (!selectedReservation || !editedReservation) return;

    const errors: {[key: string]: string} = {};
    if (editedReservation.notes && isOnlySpaces(editedReservation.notes)) {
      errors.notes = 'Les notes ne peuvent pas contenir uniquement des espaces.';
    }
    if (editedReservation.advance !== undefined && editedReservation.advance < 0) {
      errors.advance = 'L\'avance ne peut pas être inférieure à 0.';
    }
    setEditValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    try {
      const response = await axios.put<Reservation>(`${API_URL_RESERVATIONS}/${selectedReservation._id}`, data);
      const updatedReservation = response.data;
      const customer = customers.find(c => c._id === (updatedReservation.customer as any));
      const vehicle = vehicles.find(v => v._id === (updatedReservation.vehicle as any));
      const populatedReservation = { ...updatedReservation, customer: customer || updatedReservation.customer, vehicle: vehicle || updatedReservation.vehicle };

      setReservations(reservations.map(res => (res._id === populatedReservation._id ? populatedReservation : res)));
      setSelectedReservation(populatedReservation);
      setEditMode(false);
      setEditedReservation(null);
      setEditValidationErrors({});
      toast.success('Reservation updated successfully.');
    } catch (err) {
      console.error('Error updating reservation:', err);
      toast.error('Failed to update reservation.');
    }
  };

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteConfirmation = (reservationId: string) => {
    setSelectedReservation(reservations.find(r => r._id === reservationId) || null);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteReservation = async () => {
    if (selectedReservation) {
      try {
        await axios.delete(`${API_URL_RESERVATIONS}/${selectedReservation._id}`);
        setReservations(reservations.filter(r => r._id !== selectedReservation._id));
        setSelectedReservation(null);
        setShowDeleteConfirmation(false);
        toast.success('Reservation deleted successfully.');
      } catch (err) {
        console.error('Error deleting reservation:', err);
        toast.error('Failed to delete reservation.');
      }
    }
  };

  useEffect(() => {
    if (editMode && editedReservation && editedReservation.startDate && editedReservation.endDate) {
      const start = new Date(editedReservation.startDate);
      const end = new Date(editedReservation.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let newTotalAmount = editedReservation.totalAmount;
        let vehicleId = null;
        if (typeof editedReservation.vehicle === 'object' && editedReservation.vehicle) {
          vehicleId = editedReservation.vehicle._id;
        } else if (typeof editedReservation.vehicle === 'string') {
          vehicleId = editedReservation.vehicle;
        }
        
        const vehicle = vehicles.find(v => v._id === vehicleId);
        
        if (vehicle) {
            newTotalAmount = diffDays * vehicle.rentalPrice;
        } else {
            // If vehicle is not found, set total amount to 0 or handle as appropriate
            newTotalAmount = 0; 
        }

        setEditedReservation(prev => {
            if (!prev || (prev.duration === diffDays && prev.totalAmount === newTotalAmount)) {
                return prev;
            }
            return {
                ...prev,
                duration: diffDays,
                totalAmount: newTotalAmount
            };
        });
      }
    }
  }, [editedReservation?.startDate, editedReservation?.endDate, editedReservation?.vehicle, vehicles, editMode]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h1>
        <button
          onClick={() => {
            setSelectedReservation(null);
            setShowNewReservationModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Réservation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label htmlFor="status-filter" className="sr-only">Filtrer par statut</label>
            <select
              id="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | '')}
            >
              <option value="">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
              <option value="fin_de_periode">Fin de période</option>
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="sr-only">Filtrer par date de réservation</label>
            <DatePicker
              id="date-filter"
              selected={selectedDateFilter}
              onChange={(date: Date | null) => setSelectedDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              placeholderText="Sélectionner une date"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réservation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client & Véhicule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation._id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedReservation?._id === reservation._id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleViewDetails(reservation)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="md:block overflow-x-auto md:overflow-visible">
                        <div className="flex items-center min-w-[220px] md:min-w-0">
                          <div className="flex-shrink-0 h-10 w-10">
                            {typeof reservation.vehicle === 'object' && reservation.vehicle?.imageUrl ? (
                              <img
                                src={reservation.vehicle.imageUrl.startsWith('data:') ? reservation.vehicle.imageUrl : `${API_URL}/${reservation.vehicle.imageUrl.replace(/\\/g, '/')}`}
                                alt={`${reservation.vehicle.brand || 'N/A'} ${reservation.vehicle.model || 'N/A'}`}
                                className="w-10 h-10 object-cover rounded-full"
                              />
                            ) : (
                              <Car size={24} className="mx-auto mt-2 text-gray-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.reservationNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {typeof reservation.customer === 'object' && reservation.customer ? `${reservation.customer.prenomFr || ''} ${reservation.customer.nomFr || ''}`.trim() || 'N/A' : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {typeof reservation.vehicle === 'object' && reservation.vehicle ? reservation.vehicle.model || 'N/A' : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {typeof reservation.vehicle === 'object' && reservation.vehicle ? reservation.vehicle.licensePlate || 'N/A' : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateToFrench(reservation.startDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateToFrench(reservation.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.totalAmount.toLocaleString('fr-FR')} DH
                      </div>
                      <div className={`text-xs ${
                        (reservation.totalAmount - reservation.advance) > 0 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {(reservation.totalAmount - reservation.advance) > 0
                          ? `Reste: ${(reservation.totalAmount - reservation.advance).toLocaleString('fr-FR')} DH`
                          : 'Payé'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reservation.status === 'en_cours'
                          ? 'bg-blue-100 text-blue-800'
                          : reservation.status === 'validee'
                          ? 'bg-green-100 text-green-800'
                          : reservation.status === 'annulee'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status === 'en_cours' ? 'En cours' :
                         reservation.status === 'validee' ? 'Validée' :
                         reservation.status === 'annulee' ? 'Annulée' :
                         'Fin de période'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(reservation);
                          setEditMode(true);
                          setEditedReservation({
                            ...reservation,
                            customer: typeof reservation.customer === 'object' ? reservation.customer._id : reservation.customer,
                            vehicle: typeof reservation.vehicle === 'object' ? reservation.vehicle._id : reservation.vehicle,
                          });
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(reservation._id); }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedReservation ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de la réservation</h2>
                <div className="flex items-center space-x-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir annuler les modifications ?')) {
                            setEditMode(false);
                            setEditedReservation(null);
                            setEditValidationErrors({});
                          }
                        }}
                        className="px-3 py-1 border rounded-lg text-sm"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          if (editedReservation) {
                            handleUpdateReservation(editedReservation);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                      >
                        Enregistrer
                      </button>
                    </>
                  ) : (
                    <EditButton
                      onClick={() => {
                        setEditedReservation({ ...selectedReservation });
                        setEditMode(true);
                        setEditValidationErrors({});
                      }}
                      withText={true}
                      className="mr-2"
                    />
                  )}
                  <button onClick={() => setSelectedReservation(null)} className="p-2">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-150px)]">
                {selectedReservation.vehicle && typeof selectedReservation.vehicle === 'object' ? (
                  <div className="mb-6 relative">
                    {selectedReservation.vehicle.imageUrl ? (
                      <img
                        src={selectedReservation.vehicle.imageUrl.startsWith('data:') ? selectedReservation.vehicle.imageUrl : `${API_URL}/${selectedReservation.vehicle.imageUrl.replace(/\\/g, '/').replace(/^\//, '')}`}
                        alt={`${selectedReservation.vehicle.brand || 'N/A'} ${selectedReservation.vehicle.model || 'N/A'}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Car size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-6 relative">
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Car size={48} className="text-gray-400" />
                    </div>
                  </div>
                )}
                <section>
                  <h3 className="text-lg font-medium mb-4">Informations générales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">N° de Réservation</p>
                  {editMode && editedReservation ? (
                    <input
                      type="text"
                      name="reservationNumber"
                      value={editedReservation.reservationNumber || ''}
                      onChange={(e) => setEditedReservation(prev => prev ? { ...prev, reservationNumber: e.target.value } : null)}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedReservation.reservationNumber || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  {editMode && editedReservation ? (
                    <select
                      name="customer"
                      onChange={(e) => {
                        const selectedCustomerId = e.target.value;
                        setEditedReservation(prev => prev ? { ...prev, customer: selectedCustomerId } : null);
                      }}
                      value={typeof editedReservation?.customer === 'object' && editedReservation.customer ? editedReservation.customer._id : (editedReservation?.customer || '')}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="">Sélectionner un client</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.prenomFr} {c.nomFr}</option>)}
                    </select>
                  ) : (
                    <p className="font-medium">
                      {typeof selectedReservation.customer === 'object' && selectedReservation.customer ? `${selectedReservation.customer.prenomFr || ''} ${selectedReservation.customer.nomFr || ''}`.trim() || 'N/A' : 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Véhicule</p>
                  {editMode && editedReservation ? (
                    <select
                      name="vehicle"
                      onChange={(e) => {
                        const selectedVehicleId = e.target.value;
                        setEditedReservation(prev => prev ? { ...prev, vehicle: selectedVehicleId } : null);
                      }}
                      value={typeof editedReservation?.vehicle === 'object' && editedReservation.vehicle ? editedReservation.vehicle._id : (editedReservation?.vehicle || '')}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="">Sélectionner un véhicule</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>)}
                    </select>
                  ) : (
                    <p className="font-medium">
                      {typeof selectedReservation.vehicle === 'object' && selectedReservation.vehicle ? `${selectedReservation.vehicle.brand || 'N/A'} ${selectedReservation.vehicle.model || 'N/A'}` : 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de Réservation</p>
                  {editMode && editedReservation ? (
                    <DatePicker
                      selected={editedReservation.reservationDate ? new Date(editedReservation.reservationDate) : null}
                      onChange={(date) => setEditedReservation(prev => prev ? { ...prev, reservationDate: date ? date.toISOString() : '' } : null)}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{formatDateToFrench(selectedReservation.reservationDate) || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de Début</p>
                  {editMode && editedReservation ? (
                    <DatePicker
                      selected={editedReservation.startDate ? new Date(editedReservation.startDate) : null}
                      onChange={(date) => setEditedReservation(prev => prev ? { ...prev, startDate: date ? date.toISOString() : '' } : null)}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{formatDateToFrench(selectedReservation.startDate) || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de Fin</p>
                  {editMode && editedReservation ? (
                    <DatePicker
                      selected={editedReservation.endDate ? new Date(editedReservation.endDate) : null}
                      onChange={(date) => setEditedReservation(prev => prev ? { ...prev, endDate: date ? date.toISOString() : '' } : null)}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{formatDateToFrench(selectedReservation.endDate) || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Durée</p>
                  <p className="font-medium">{selectedReservation.duration || 'N/A'} jours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant Total</p>
                  {editMode && editedReservation ? (
                    <input
                      type="number"
                      name="totalAmount"
                      value={editedReservation.totalAmount || 0}
                      onChange={(e) => setEditedReservation(prev => prev ? { ...prev, totalAmount: Number(e.target.value) } : null)}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedReservation.totalAmount?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avance</p>
                  {editMode && editedReservation ? (
                    <input
                      type="number"
                      name="advance"
                      value={editedReservation.advance || 0}
                      onChange={(e) => {
                        setEditedReservation(prev => prev ? { ...prev, advance: Number(e.target.value) } : null);
                        if (Number(e.target.value) < 0) {
                          setEditValidationErrors(prev => ({ ...prev, advance: 'L\'avance ne peut pas être inférieure à 0.' }));
                        } else {
                          setEditValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.advance;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full border rounded-lg p-2 mt-1 ${editValidationErrors.advance ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  ) : (
                    <p className="font-medium">{selectedReservation.advance?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                  {editValidationErrors.advance && <p className="text-red-500 text-xs mt-1">{editValidationErrors.advance}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reste à payer</p>
                  <p className="font-medium">{(selectedReservation.totalAmount - selectedReservation.advance)?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  {editMode && editedReservation ? (
                    <select
                      name="status"
                      value={editedReservation.status || ''}
                      onChange={(e) => setEditedReservation(prev => prev ? { ...prev, status: e.target.value as ReservationStatus } : null)}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="en_cours">En cours</option>
                      <option value="validee">Validée</option>
                      <option value="annulee">Annulée</option>
                      <option value="fin_de_periode">Fin de période</option>
                    </select>
                  ) : (
                    <p className="font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedReservation.status === 'en_cours'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedReservation.status === 'validee'
                          ? 'bg-green-100 text-green-800'
                          : selectedReservation.status === 'annulee'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedReservation.status === 'en_cours' ? 'En cours' :
                         selectedReservation.status === 'validee' ? 'Validée' :
                         selectedReservation.status === 'annulee' ? 'Annulée' :
                         'Fin de période'}
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  {editMode && editedReservation ? (
                    <textarea
                      name="notes"
                      value={editedReservation.notes || ''}
                      onChange={(e) => {
                        setEditedReservation(prev => prev ? { ...prev, notes: e.target.value } : null);
                        if (isOnlySpaces(e.target.value)) {
                          setEditValidationErrors(prev => ({ ...prev, notes: 'Les notes ne peuvent pas contenir uniquement des espaces.' }));
                        } else {
                          setEditValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.notes;
                            return newErrors;
                          });
                        }
                      }}
                      rows={3}
                      className={`w-full border rounded-lg p-2 mt-1 ${editValidationErrors.notes ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    ></textarea>
                  ) : (
                    <p className="font-medium">{selectedReservation.notes || 'Aucune note'}</p>
                  )}
                  {editValidationErrors.notes && <p className="text-red-500 text-xs mt-1">{editValidationErrors.notes}</p>}
                </div>
              </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Calendar size={64} className="mx-auto mb-4 text-gray-400" />
              <p>Aucune réservation sélectionnée</p>
            </div>
          )}
        </div>
      </div>

      {showNewReservationModal && (
        <ReservationForm
          onSubmit={handleAddReservation}
          onClose={() => setShowNewReservationModal(false)}
          initialData={null}
          customers={customers}
          vehicles={vehicles}
        />
      )}

      {showDeleteConfirmation && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer la réservation "{selectedReservation.reservationNumber}" ?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteReservation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReservationForm = ({
  onSubmit,
  onClose,
  initialData,
  customers,
  vehicles,
}: {
  onSubmit: (data: Partial<Reservation>) => void;
  onClose: () => void;
  initialData: Reservation | null;
  customers: Customer[];
  vehicles: Vehicle[];
}) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Reservation>>(() => {
    if (initialData) {
      return {
        ...initialData,
        customer: typeof initialData.customer === 'object' ? initialData.customer._id : initialData.customer,
        vehicle: typeof initialData.vehicle === 'object' ? initialData.vehicle._id : initialData.vehicle,
      };
    }
    return {
      reservationNumber: '',
      reservationDate: today,
      startDate: today,
      endDate: tomorrowString, // Set default endDate to tomorrow
      duration: 0,
      status: 'en_cours',
      customer: '',
      vehicle: '',
      totalAmount: 0,
      advance: 0,
      notes: '',
    };
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let newTotalAmount = formData.totalAmount || 0;
        if (formData.vehicle) {
            const selectedVehicle = vehicles.find(v => v._id === formData.vehicle);
            if (selectedVehicle) {
                newTotalAmount = diffDays * selectedVehicle.rentalPrice;
            }
        }
        
        setFormData(prev => ({ ...prev, duration: diffDays, totalAmount: newTotalAmount }));
      }
    }
  }, [formData.startDate, formData.endDate, formData.vehicle, vehicles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'notes') {
      if (value && isOnlySpaces(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Les notes ne peuvent pas contenir uniquement des espaces.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null, name: string) => {
    setFormData(prev => ({ ...prev, [name]: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: {[key: string]: string} = {};
    if (!formData.customer || !formData.vehicle || !formData.startDate || !formData.endDate || !formData.reservationDate) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (formData.notes && isOnlySpaces(formData.notes)) {
      errors.notes = 'Les notes ne peuvent pas contenir uniquement des espaces.';
    }
    if (formData.advance !== undefined && formData.advance < 0) {
      errors.advance = 'L\'avance ne peut pas être inférieure à 0.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    const dataToSend = {
      ...formData,
      customer: formData.customer,
      vehicle: formData.vehicle,
      duration: Number(formData.duration),
      totalAmount: Number(formData.totalAmount),
      advance: Number(formData.advance),
    };
    onSubmit(dataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? 'Modifier la réservation' : 'Ajouter une réservation'}
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h3 className="text-lg font-medium mb-4">Informations sur la Réservation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  id="customer"
                  name="customer"
                  value={formData.customer as string || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.prenomFr} {c.nomFr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                <select
                  id="vehicle"
                  name="vehicle"
                  value={formData.vehicle as string || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="reservationDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Réservation</label>
                <DatePicker
                  selected={formData.reservationDate ? new Date(formData.reservationDate) : null}
                  onChange={(date) => handleDateChange(date, 'reservationDate')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="Date de réservation"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Début</label>
                <DatePicker
                  selected={formData.startDate ? new Date(formData.startDate) : null}
                  onChange={(date) => handleDateChange(date, 'startDate')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="Date de début"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Fin</label>
                <DatePicker
                  selected={formData.endDate ? new Date(formData.endDate) : null}
                  onChange={(date) => handleDateChange(date, 'endDate')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="Date de fin"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  placeholder="Durée"
                  value={formData.duration || ''}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="rentalPrice" className="block text-sm font-medium text-gray-700 mb-1">Prix de journée</label>
                <input
                  type="number"
                  id="rentalPrice"
                  name="rentalPrice"
                  placeholder="Prix de journée"
                  value={vehicles.find(v => v._id === formData.vehicle)?.rentalPrice || ''}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                <option value="en_cours">En cours</option>
                <option value="validee">Validée</option>
                <option value="annulee">Annulée</option>
                <option value="fin_de_periode">Fin de période</option>
              </select>
              </div>
              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">Montant Total</label>
                <input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  placeholder="Montant total"
                  value={formData.totalAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor="advance" className="block text-sm font-medium text-gray-700 mb-1">Avance</label>
                <input
                  type="number"
                  id="advance"
                  name="advance"
                  placeholder="Avance"
                  value={formData.advance || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, advance: parseFloat(e.target.value) }));
                    if (parseFloat(e.target.value) < 0) {
                      setValidationErrors(prev => ({ ...prev, advance: 'L\'avance ne peut pas être inférieure à 0.' }));
                    } else {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.advance;
                        return newErrors;
                      });
                    }
                  }}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 ${validationErrors.advance ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.advance && <p className="text-red-500 text-xs mt-1">{validationErrors.advance}</p>}
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 ${validationErrors.notes ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.notes && <p className="text-red-500 text-xs mt-1">{validationErrors.notes}</p>}
              </div>
            </div>
          </section>
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {initialData ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reservations;
