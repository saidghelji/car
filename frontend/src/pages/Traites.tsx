import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Car, Trash2, Check
} from 'lucide-react';
import EditButton from '../components/EditButton';
import CloseButton from '../components/CloseButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Vehicle } from './Vehicles';
import FileUploader from '../components/FileUploader';
import { Document } from '../components/FileUploader';

registerLocale('fr', fr);

const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

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

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

interface Traite {
  _id: string;
  vehicle: Vehicle | string;
  mois: number;
  annee: number;
  montant: number;
  datePaiement?: string;
  reference?: string;
  notes?: string;
  documents?: Document[];
}

const monthOptions = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

const getMonthName = (monthNumber: number): string => {
    return monthOptions.find(m => m.value === monthNumber)?.label || '';
};

const API_URL = 'http://localhost:5000';

const Traites = () => {
  const [traites, setTraites] = useState<Traite[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<number | ''>('');
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [showNewTraiteModal, setShowNewTraiteModal] = useState(false);
  const [selectedTraite, setSelectedTraite] = useState<Traite | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTraite, setEditedTraite] = useState<Traite | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const API_URL_TRAITES = `${API_URL}/api/traites`;
  const API_URL_VEHICLES = `${API_URL}/api/vehicles`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [traitesRes, vehiclesRes] = await Promise.all([
        axios.get<Traite[]>(API_URL_TRAITES),
        axios.get<Vehicle[]>(API_URL_VEHICLES)
      ]);
      
      const populatedTraites = traitesRes.data.map(traite => {
        const vehicle = vehiclesRes.data.find(v => v._id === (traite.vehicle as any));
        return { ...traite, vehicle: vehicle || traite.vehicle };
      });

      setTraites(populatedTraites);
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

  const filteredTraites = traites.filter(traite => {
    const matchesSearch =
    (typeof traite.vehicle === 'object' && traite.vehicle?.model && traite.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof traite.vehicle === 'object' && traite.vehicle?.licensePlate && traite.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getMonthName(traite.mois).toLowerCase().includes(searchTerm.toLowerCase()) ||
      traite.annee.toString().includes(searchTerm.toLowerCase()) ||
      traite.montant.toString().includes(searchTerm.toLowerCase());

    const matchesMonth = monthFilter === '' || traite.mois === monthFilter;
    const matchesYear = yearFilter === '' || traite.annee === yearFilter;

    return matchesSearch && matchesMonth && matchesYear;
  });

  const handleAddTraite = async (data: Partial<Traite>) => {
    const formData = new FormData();

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key as keyof typeof data];
            if (key === 'vehicle' && value) {
                formData.append('vehicle', typeof value === 'string' ? value : (value as Vehicle)._id);
            } else if (key !== '_id' && key !== 'documents' && value !== null && value !== undefined) {
                formData.append(key, value as any);
            }
        }
    }

    if (newAttachmentFiles.length > 0) {
        newAttachmentFiles.forEach(file => {
            formData.append('documents', file);
        });
    }

    try {
        const response = await axios.post<Traite>(API_URL_TRAITES, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        const newTraite = response.data;
        const vehicle = vehicles.find(v => v._id === (newTraite.vehicle as any));
        const populatedTraite = { ...newTraite, vehicle: vehicle || newTraite.vehicle };

        setTraites([...traites, populatedTraite]);
        setShowNewTraiteModal(false);
        toast.success('Traite added successfully.');
        setNewAttachmentFiles([]);
    } catch (err) {
        console.error('Error adding traite:', err);
        toast.error('Failed to add traite.');
    }
  };

  const handleUpdateTraite = async (data: Partial<Traite>) => {
    if (!selectedTraite || !editedTraite) return;

    const textFieldsToValidate = [
      { name: 'Référence', value: editedTraite.reference, required: false },
      { name: 'Notes', value: editedTraite.notes, required: false },
    ];

    const errors: {[key: string]: string} = {};

    for (const field of textFieldsToValidate) {
      if (field.value && isOnlySpaces(field.value)) {
        errors[field.name.toLowerCase()] = `${field.name} ne peut pas contenir uniquement des espaces.`;
      }
    }

    if (editedTraite.montant !== undefined && editedTraite.montant < 1) {
      errors.montant = 'Montant (DH) ne peut pas être inférieur à 1.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    const formData = new FormData();

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key as keyof typeof data];
            if (key === 'vehicle' && value) {
                formData.append('vehicle', typeof value === 'string' ? value : (value as Vehicle)._id);
            } else if (key !== '_id' && key !== 'documents' && value !== null && value !== undefined) {
                formData.append(key, value as any);
            }
        }
    }

    const existingDocsToKeep = editedTraite?.documents?.filter(doc => !doc.isNew) || [];
    formData.append('existingDocuments', JSON.stringify(existingDocsToKeep));

    if (newAttachmentFiles.length > 0) {
        newAttachmentFiles.forEach(file => {
            formData.append('documents', file);
        });
    }

    try {
        const response = await axios.put<Traite>(`${API_URL_TRAITES}/${selectedTraite._id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const updatedTraite = response.data;
        const vehicle = vehicles.find(v => v._id === (updatedTraite.vehicle as any));
        const populatedTraite = { ...updatedTraite, vehicle: vehicle || updatedTraite.vehicle };

        setTraites(traites.map(t => (t._id === populatedTraite._id ? populatedTraite : t)));
        setSelectedTraite(populatedTraite);
        setEditMode(false);
        toast.success('Traite updated successfully.');
        setNewAttachmentFiles([]);
    } catch (err) {
        console.error('Error updating traite:', err);
        toast.error('Failed to update traite.');
    }
  };

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteConfirmation = (traiteId: string) => {
    setSelectedTraite(traites.find(t => t._id === traiteId) || null);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteTraite = async () => {
    if (selectedTraite) {
        try {
            await axios.delete(`${API_URL_TRAITES}/${selectedTraite._id}`);
            setTraites(traites.filter(t => t._id !== selectedTraite._id));
            setSelectedTraite(null);
            setShowDeleteConfirmation(false);
            toast.success('Traite deleted successfully.');
        } catch (err) {
            console.error('Error deleting traite:', err);
            toast.error('Failed to delete traite.');
        }
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!selectedTraite) return;
    try {
        await axios.delete(`${API_URL_TRAITES}/${selectedTraite._id}/documents`, {
            data: { documentName: docToRemove.name }
        });
        setSelectedTraite(prev => {
            if (!prev) return null;
            return {
                ...prev,
                documents: prev.documents?.filter(doc => doc.url !== docToRemove.url),
            };
        });
        toast.success('Document supprimé avec succès.');
    } catch (err) {
        console.error('Erreur lors de la suppression du document:', err);
        toast.error('Échec de la suppression du document.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Traites</h1>
        <button
          onClick={() => {
            setSelectedTraite(null);
            setShowNewTraiteModal(true);
            setNewAttachmentFiles([]);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Traite
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search-traite" className="sr-only">Rechercher une traite</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                id="search-traite"
                type="text"
                placeholder="Rechercher une traite..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="month-filter" className="text-sm font-medium text-gray-700 mb-1 block">Mois</label>
            <select
              id="month-filter"
              className="px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Tous les mois</option>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="year-filter" className="text-sm font-medium text-gray-700 mb-1 block">Année</label>
            <select
              id="year-filter"
              className="px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Toutes les années</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mois/Année</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Paiement</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTraites.map((traite) => {
                  const vehicleId = typeof traite.vehicle === 'string' ? traite.vehicle : (traite.vehicle as any)?._id;
                  const vehicle = vehicles.find(v => v._id === vehicleId);
                  const displayedVehicle = vehicle || (traite.vehicle as any);
                  return (
                    <tr
                      key={traite._id}
                      onClick={() => setSelectedTraite({ ...traite, vehicle: displayedVehicle })}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedTraite?._id === traite._id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="md:block overflow-x-auto md:overflow-visible">
                          <div className="flex items-center min-w-[220px] md:min-w-0">
                            <div className="flex-shrink-0 h-10 w-10">
                              {typeof displayedVehicle === 'object' && displayedVehicle?.imageUrl ? (
                                <img
                                  src={displayedVehicle.imageUrl.startsWith('data:') ? displayedVehicle.imageUrl : `${API_URL}/${displayedVehicle.imageUrl.replace(/\\/g, '/')}`}
                                  alt={`${displayedVehicle.brand || 'N/A'} ${displayedVehicle.model || 'N/A'}`}
                                  className="w-10 h-10 object-cover rounded-full"
                                />
                              ) : (
                                <Car size={24} className="mx-auto mt-2 text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {typeof displayedVehicle === 'object' && displayedVehicle?.brand ? displayedVehicle.brand : 'N/A'} {' '}
                                {typeof displayedVehicle === 'object' && displayedVehicle?.model ? displayedVehicle.model : 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {typeof displayedVehicle === 'object' && displayedVehicle?.licensePlate ? displayedVehicle.licensePlate : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{getMonthName(traite.mois)} {traite.annee}</div>
                      </td>
                      <td className="px-6 py-4">{traite.montant.toLocaleString('fr-FR')} DH</td>
                      <td className="px-6 py-4">{formatDateToFrench(traite.datePaiement)}</td>
                      <td className="px-6 py-4 text-right">
                        <EditButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTraite(traite);
                            setEditMode(true);
                            const existingDocs: Document[] = (traite.documents || []).map(att => ({
                              name: att.name,
                              url: att.url,
                              type: '',
                              size: 0,
                              isNew: false,
                            }));
                            const vehicleIdToSet = typeof traite.vehicle === 'object' && traite.vehicle !== null
                              ? (traite.vehicle as any)._id
                              : (traite.vehicle as any);
                            setEditedTraite({ ...traite, vehicle: vehicleIdToSet, documents: existingDocs });
                            setNewAttachmentFiles([]);
                          }}
                          size="md"
                          className="mr-3"
                        />
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(traite._id); }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedTraite ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de la traite</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setValidationErrors({}); // Clear validation errors on cancel
                      }}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      form="traite-edit-form"
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(true);
                      const existingDocs: Document[] = (selectedTraite.documents || []).map(att => ({
                          name: att.name,
                          url: att.url,
                          type: '',
                          size: 0,
                          isNew: false,
                      }));
                      const vehicleId = typeof selectedTraite.vehicle === 'object' && selectedTraite.vehicle !== null
                          ? selectedTraite.vehicle._id
                          : selectedTraite.vehicle;
                      setEditedTraite({ ...selectedTraite, vehicle: vehicleId, documents: existingDocs });
                      setNewAttachmentFiles([]);
                      setValidationErrors({}); // Clear validation errors when entering edit mode
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <form id="traite-edit-form" onSubmit={(e) => { e.preventDefault(); handleUpdateTraite(editedTraite as Partial<Traite>); }} className="p-4 space-y-4">
                {editMode && editedTraite ? (
                  <div className="p-4 border-b">
                    <h3 className="font-medium mb-2">Véhicule</h3>
                    <select
                      id="vehicle"
                      name="vehicle"
                      value={typeof editedTraite.vehicle === 'string' ? editedTraite.vehicle : (editedTraite.vehicle as Vehicle)?._id || ''}
                      onChange={(e) => setEditedTraite({ ...editedTraite, vehicle: e.target.value })}
                      className="w-full border rounded-lg p-2 mt-1"
                      required
                    >
                      <option value="">Sélectionner un véhicule</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  selectedTraite.vehicle && typeof selectedTraite.vehicle === 'object' ? (
                    <div className="p-4 border-b">
                      <h3 className="font-medium mb-2">Véhicule</h3>
                      <div className="flex items-center space-x-4">
                        {selectedTraite.vehicle.imageUrl ? (
                          <img
                            src={selectedTraite.vehicle.imageUrl.startsWith('data:') ? selectedTraite.vehicle.imageUrl : `${API_URL}/${selectedTraite.vehicle.imageUrl.replace(/\\/g, '/').replace(/^\//, '')}`}
                            alt={`${selectedTraite.vehicle.brand || 'N/A'} ${selectedTraite.vehicle.model || 'N/A'}`}
                            className="w-24 h-24 object-cover rounded-lg shadow"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow">
                            <Car size={48} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-lg">{typeof selectedTraite.vehicle === 'object' && selectedTraite.vehicle?.brand || 'N/A'} {typeof selectedTraite.vehicle === 'object' && selectedTraite.vehicle?.model || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{typeof selectedTraite.vehicle === 'object' && selectedTraite.vehicle?.licensePlate || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-b">
                      <h3 className="font-medium mb-2">Véhicule</h3>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow">
                          <Car size={48} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">N/A</p>
                          <p className="text-sm text-gray-600">N/A</p>
                        </div>
                      </div>
                    </div>
                  )
                )}

                <div>
                  <p className="text-sm text-gray-500">Mois/Année</p>
                  {editMode && editedTraite ? (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <select
                          id="mois"
                          name="mois"
                          className="w-full border rounded-lg p-2"
                          value={editedTraite.mois}
                          onChange={(e) => setEditedTraite({ ...editedTraite, mois: Number(e.target.value) })}
                      >
                          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <input
                          type="number"
                          id="annee"
                          name="annee"
                          className="w-full border rounded-lg p-2"
                          value={editedTraite.annee}
                          onChange={(e) => setEditedTraite({ ...editedTraite, annee: Number(e.target.value) })}
                      />
                    </div>
                  ) : (
                    <p className="font-medium">{getMonthName(selectedTraite.mois)} {selectedTraite.annee}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  {editMode && editedTraite ? (
                    <input
                      type="number"
                      id="montant"
                      name="montant"
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.montant ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedTraite.montant}
                      onChange={(e) => setEditedTraite({ ...editedTraite, montant: Number(e.target.value) })}
                    />
                  ) : (
                    <p className="font-medium">{selectedTraite.montant.toLocaleString('fr-FR')} DH</p>
                  )}
                  {validationErrors.montant && <p className="text-red-500 text-xs mt-1">{validationErrors.montant}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de Paiement</p>
                  {editMode && editedTraite ? (
                    <DatePicker
                      selected={editedTraite.datePaiement ? new Date(editedTraite.datePaiement) : null}
                      onChange={(date) => setEditedTraite({ ...editedTraite, datePaiement: date?.toISOString().split('T')[0] })}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{formatDateToFrench(selectedTraite.datePaiement)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Référence</p>
                  {editMode && editedTraite ? (
                    <input
                      type="text"
                      id="reference"
                      name="reference"
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.reference ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedTraite.reference || ''}
                      onChange={(e) => setEditedTraite({ ...editedTraite, reference: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{selectedTraite.reference || 'N/A'}</p>
                  )}
                  {validationErrors.reference && <p className="text-red-500 text-xs mt-1">{validationErrors.reference}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  {editMode && editedTraite ? (
                    <textarea
                      id="notes"
                      name="notes"
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.notes ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedTraite.notes || ''}
                      onChange={(e) => setEditedTraite({ ...editedTraite, notes: e.target.value })}
                    />
                  ) : (
                    <p className="font-medium">{selectedTraite.notes || 'Aucune note'}</p>
                  )}
                  {validationErrors.notes && <p className="text-red-500 text-xs mt-1">{validationErrors.notes}</p>}
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Documents Associés:</h4>
                  {editMode && editedTraite ? (
                    <FileUploader
                      api_url={API_URL}
                      existingDocuments={editedTraite.documents || []}
                      newFiles={newAttachmentFiles}
                      onNewFilesChange={setNewAttachmentFiles}
                      onRemoveExistingDocument={handleRemoveExistingDocument}
                    />
                  ) : (
                    selectedTraite.documents && selectedTraite.documents.length > 0 ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={selectedTraite.documents}
                        newFiles={[]}
                        onNewFilesChange={() => {}}
                        onRemoveExistingDocument={handleRemoveExistingDocument}
                        label=""
                        readOnly={true}
                      />
                    ) : (
                      <p className="text-sm text-gray-500">Aucun document</p>
                    )
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Car size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Aucune traite sélectionnée</p>
            </div>
          )}
        </div>
      </div>

      {showNewTraiteModal && (
        <TraiteForm
          onSubmit={handleAddTraite}
          onClose={() => setShowNewTraiteModal(false)}
          initialData={null}
          vehicles={vehicles}
          newAttachmentFiles={newAttachmentFiles}
          setNewAttachmentFiles={setNewAttachmentFiles}
        />
      )}

      {showDeleteConfirmation && selectedTraite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer la traite pour le véhicule "{typeof selectedTraite.vehicle === 'object' && selectedTraite.vehicle !== null ? selectedTraite.vehicle.licensePlate : 'N/A'}" ?</p>
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
                onClick={handleDeleteTraite}
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

const TraiteForm = ({
  onSubmit,
  onClose,
  initialData,
  vehicles,
  newAttachmentFiles,
  setNewAttachmentFiles,
}: {
  onSubmit: (data: Partial<Traite>) => void;
  onClose: () => void;
  initialData: Traite | null;
  vehicles: Vehicle[];
  newAttachmentFiles: File[];
  setNewAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) => {
  const [formData, setFormData] = useState<Partial<Omit<Traite, 'vehicle'> & { vehicle?: string }>>(() => {
    if (initialData) {
      const vehicleId = typeof initialData.vehicle === 'object' && initialData.vehicle !== null
        ? initialData.vehicle._id
        : initialData.vehicle;
      return {
        ...initialData,
        datePaiement: initialData.datePaiement ? new Date(initialData.datePaiement).toISOString().split('T')[0] : '',
        vehicle: vehicleId,
        documents: initialData.documents || [],
      };
    }
    return {
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      montant: 0,
      datePaiement: '',
      reference: '',
      notes: '',
      vehicle: undefined,
      documents: [],
    };
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (['reference', 'notes'].includes(name)) {
      if (value && isOnlySpaces(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Ce champ ne peut pas contenir uniquement des espaces.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (name === 'montant') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 1) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Le montant ne peut pas être inférieur à 1.' }));
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
    if (formData.reference && isOnlySpaces(formData.reference)) {
      errors.reference = 'La référence ne peut pas contenir uniquement des espaces.';
    }
    if (formData.notes && isOnlySpaces(formData.notes)) {
      errors.notes = 'Les notes ne peuvent pas contenir uniquement des espaces.';
    }
    if (formData.montant !== undefined && formData.montant < 1) {
      errors.montant = 'Le montant ne peut pas être inférieur à 1.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    onSubmit({
      ...formData,
      vehicle: formData.vehicle,
    } as Partial<Traite>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <CloseButton onClick={onClose} />
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Modifier' : 'Nouvelle'} Traite</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Traite Information */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Informations sur la Traite</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="vehicle" className="text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                <select
                  id="vehicle"
                  name="vehicle"
                  value={formData.vehicle || ''}
                  onChange={handleChange}
                  className="border rounded-lg p-2"
                  required
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="mois" className="text-sm font-medium text-gray-700 mb-1">Mois</label>
                <select
                    id="mois"
                    name="mois"
                    value={formData.mois || ''}
                    onChange={handleChange}
                    className="border rounded-lg p-2"
                    required
                >
                    {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="annee" className="text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  type="number"
                  id="annee"
                  name="annee"
                  value={formData.annee || ''}
                  onChange={handleChange}
                  className="border rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="montant" className="text-sm font-medium text-gray-700 mb-1">Montant (DH)</label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={formData.montant || ''}
                  onChange={handleChange}
                  className={`border rounded-lg p-2 ${validationErrors.montant ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                />
                {validationErrors.montant && <p className="text-red-500 text-xs mt-1">{validationErrors.montant}</p>}
              </div>

              <div className="flex flex-col">
                <label htmlFor="datePaiement" className="text-sm font-medium text-gray-700 mb-1">Date de Paiement</label>
                <DatePicker
                  id="datePaiement"
                  selected={formData.datePaiement ? new Date(formData.datePaiement) : null}
                  onChange={(date) => handleDateChange(date, 'datePaiement')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="Sélectionner une date"
                  className="border rounded-lg p-2"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="reference" className="text-sm font-medium text-gray-700 mb-1">Référence</label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={formData.reference || ''}
                  onChange={handleChange}
                  className={`border rounded-lg p-2 ${validationErrors.reference ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Référence de paiement"
                />
                {validationErrors.reference && <p className="text-red-500 text-xs mt-1">{validationErrors.reference}</p>}
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  className={`border rounded-lg p-2 ${validationErrors.notes ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Notes ou observations supplémentaires"
                ></textarea>
                {validationErrors.notes && <p className="text-red-500 text-xs mt-1">{validationErrors.notes}</p>}
              </div>
            </div>
          </section>

          {/* Pièces Jointes */}
          <section className="border-b pb-4 mb-4">
            <h3 className="font-semibold mb-3">Pièces Jointes</h3>
            <FileUploader
              api_url={API_URL}
              existingDocuments={formData.documents || []}
              newFiles={newAttachmentFiles}
              onNewFilesChange={setNewAttachmentFiles}
              onRemoveExistingDocument={async () => {}}
            />
          </section>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              {initialData ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Traites;
