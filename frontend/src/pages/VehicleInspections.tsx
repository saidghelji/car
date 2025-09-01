import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Car, Trash2
} from 'lucide-react';
import CloseButton from '../components/CloseButton';
import EditButton from '../components/EditButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Vehicle } from './Vehicles';
import FileUploader from '../components/FileUploader';
import { Document } from '../components/FileUploader';

registerLocale('fr', fr);

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

interface TechnicalInspection {
  _id: string;
  center: string;
  controlId: string;
  authorizationNumber: string;
  inspectionDate: string;
  duration: number;
  endDate: string;
  price: number;
  centerContact: string;
  observation: string;
  inspectionDocument?: string;
  vehicle: Vehicle | string;
  documents?: Document[];
  inspectorName: string;
  results: string;
  nextInspectionDate?: string;
}

const API_URL = 'http://localhost:5000';

const VehicleInspections = () => {
  const [inspections, setInspections] = useState<TechnicalInspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<TechnicalInspection | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInspection, setEditedInspection] = useState<TechnicalInspection | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);

  const API_URL_INSPECTIONS = `${API_URL}/api/vehicleinspections`;
  const API_URL_VEHICLES = `${API_URL}/api/vehicles`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inspectionsRes, vehiclesRes] = await Promise.all([
        axios.get<TechnicalInspection[]>(API_URL_INSPECTIONS),
        axios.get<Vehicle[]>(API_URL_VEHICLES)
      ]);
      
      const populatedInspections = inspectionsRes.data.map(inspection => {
        const vehicle = vehiclesRes.data.find(v => v._id === (inspection.vehicle as any));
        return { ...inspection, vehicle: vehicle || inspection.vehicle };
      });

      setInspections(populatedInspections);
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

  const filteredInspections = inspections.filter(inspection => {
    const searchString = searchTerm.toLowerCase();
    const vehicleLicensePlate = (typeof inspection.vehicle === 'object' && inspection.vehicle && inspection.vehicle.licensePlate) ? inspection.vehicle.licensePlate : '';
    return (
      (inspection.center && inspection.center.toLowerCase().includes(searchString)) ||
      (inspection.controlId && inspection.controlId.toLowerCase().includes(searchString)) ||
      vehicleLicensePlate.toLowerCase().includes(searchString)
    );
  });

  const handleViewDetails = (inspection: TechnicalInspection) => {
    if (editMode && selectedInspection?._id !== inspection._id) {
      if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
        const vehicleId = typeof inspection.vehicle === 'object' && inspection.vehicle ? inspection.vehicle._id : inspection.vehicle;
        const vehicle = vehicles.find(v => v._id === vehicleId);
        const existingDocs: Document[] = (inspection.documents || []).map(doc => ({
          name: doc.name,
          url: doc.url,
          type: doc.type,
          size: doc.size,
          isNew: false,
        }));
        setSelectedInspection({ ...inspection, vehicle: vehicle || inspection.vehicle, documents: existingDocs });
        setEditMode(false);
        setEditedInspection(null);
        setNewAttachmentFiles([]);
      }
    } else if (!editMode) {
      const vehicleId = typeof inspection.vehicle === 'object' && inspection.vehicle ? inspection.vehicle._id : inspection.vehicle;
      const vehicle = vehicles.find(v => v._id === vehicleId);
      const existingDocs: Document[] = (inspection.documents || []).map(doc => ({
        name: doc.name,
        url: doc.url,
        type: doc.type,
        size: doc.size,
        isNew: false,
      }));
      setSelectedInspection({ ...inspection, vehicle: vehicle || inspection.vehicle, documents: existingDocs });
    }
  };

  const handleAddInspection = async (data: Partial<TechnicalInspection>) => {
    const formData = new FormData();

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key as keyof typeof data];
        if (key === 'vehicle' && value) {
          formData.append('vehicle', typeof value === 'string' ? value : (value as Vehicle)._id);
        } else if (key !== '_id' && key !== 'documents' && key !== 'attachments' && key !== 'vehicle' && value !== null && value !== undefined) {
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
      const response = await axios.post<TechnicalInspection>(API_URL_INSPECTIONS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const newInspection = response.data;
      const vehicle = vehicles.find(v => v._id === (newInspection.vehicle as any));
      const populatedInspection = { ...newInspection, vehicle: vehicle || newInspection.vehicle };

      setInspections([...inspections, populatedInspection]);
      setSelectedInspection(populatedInspection);
      setShowNewInspectionModal(false);
      toast.success('Inspection added successfully.');
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error('Error adding inspection:', err);
      toast.error('Failed to add inspection.');
    }
  };

  const handleUpdateInspection = async (data: Partial<TechnicalInspection>) => {
    const inspectionId = data._id || (selectedInspection ? selectedInspection._id : null);
    if (!inspectionId || !editedInspection) {
      toast.error('No inspection ID or edited inspection data found for update.');
      return;
    }

    const textFieldsToValidate = [
      { name: 'Centre', value: editedInspection.center, required: true },
      { name: 'ID de contrôle', value: editedInspection.controlId, required: false },
      { name: 'Numéro d\'autorisation', value: editedInspection.authorizationNumber, required: false },
      { name: 'Contact du centre', value: editedInspection.centerContact, required: false },
      { name: 'Nom de l\'inspecteur', value: editedInspection.inspectorName, required: true },
      { name: 'Résultats', value: editedInspection.results, required: true },
      { name: 'Observation', value: editedInspection.observation, required: false },
    ];

    for (const field of textFieldsToValidate) {
      if (field.required && isOnlySpaces(field.value)) {
        toast.error(`${field.name} ne peut pas être vide ou contenir uniquement des espaces.`);
        return;
      }
      if (!field.required && field.value && isOnlySpaces(field.value)) {
        toast.error(`${field.name} ne peut pas contenir uniquement des espaces.`);
        return;
      }
    }

    if (editedInspection.duration !== undefined && editedInspection.duration < 1) {
      toast.error('Durée (mois) ne peut pas être inférieure à 1.');
      return;
    }

    if (editedInspection.price !== undefined && editedInspection.price < 1) {
      toast.error('Prix (DH) ne peut pas être inférieur à 1.');
      return;
    }

    const formData = new FormData();

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key as keyof typeof data];
        if (key === 'vehicle' && value) {
          formData.append('vehicle', typeof value === 'string' ? value : (value as Vehicle)._id);
        } else if (key !== '_id' && key !== 'documents' && key !== 'attachments' && key !== 'vehicle' && value !== null && value !== undefined) {
          formData.append(key, value as any);
        }
      }
    }

    const existingDocsToKeep = editedInspection.documents?.filter(doc => !doc.isNew) || [];
    formData.append('existingDocuments', JSON.stringify(existingDocsToKeep));

    if (newAttachmentFiles.length > 0) {
      newAttachmentFiles.forEach(file => {
        formData.append('documents', file);
      });
    }

    try {
      const response = await axios.put<TechnicalInspection>(`${API_URL_INSPECTIONS}/${inspectionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const updatedInspection = response.data;
      const vehicle = vehicles.find(v => v._id === (updatedInspection.vehicle as any));
      const populatedInspection = { ...updatedInspection, vehicle: vehicle || updatedInspection.vehicle };

      setInspections(inspections.map(ins => (ins._id === populatedInspection._id ? populatedInspection : ins)));
      setSelectedInspection(populatedInspection);
      setShowNewInspectionModal(false);
      setEditMode(false);
      setEditedInspection(null);
      toast.success('Inspection updated successfully.');
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error('Error updating inspection:', err);
      toast.error('Failed to update inspection.');
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette visite technique ?')) {
      try {
        await axios.delete(`${API_URL_INSPECTIONS}/${inspectionId}`);
        setInspections(inspections.filter(ins => ins._id !== inspectionId));
        setSelectedInspection(null);
        toast.success('Inspection deleted successfully.');
      } catch (err) {
        console.error('Error deleting inspection:', err);
        toast.error('Failed to delete inspection.');
      }
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!selectedInspection) return;
    try {
      await axios.delete(`${API_URL_INSPECTIONS}/${selectedInspection._id}/documents`, {
        data: { documentUrl: docToRemove.url }
      });
      setSelectedInspection(prev => {
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Visites Techniques</h1>
        <button
          onClick={() => {
            setSelectedInspection(null);
            setShowNewInspectionModal(true);
            setNewAttachmentFiles([]);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Ajouter une Visite
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspections List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher une visite technique..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => {
                  if (editMode) {
                    if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
                      setSearchTerm(e.target.value);
                      setEditMode(false);
                      setEditedInspection(null);
                      setNewAttachmentFiles([]);
                    }
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {/* Inspections table */}
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.map((inspection) => (
                  <tr
                    key={inspection._id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedInspection?._id === inspection._id
                        ? editMode
                          ? 'bg-blue-100'
                          : 'bg-blue-50'
                        : ''
                    }`}
                    onClick={() => handleViewDetails(inspection)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="md:block overflow-x-auto md:overflow-visible">
                        <div className="flex items-center min-w-[220px] md:min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Car size={20} className="text-gray-500" />
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <div className="text-sm font-medium text-gray-900">
                              {typeof inspection.vehicle === 'object' && inspection.vehicle ? inspection.vehicle.model : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {typeof inspection.vehicle === 'object' && inspection.vehicle ? inspection.vehicle.licensePlate : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{inspection.center}</div>
                      <div className="text-sm text-gray-500">{inspection.controlId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateToFrench(inspection.inspectionDate)}</div>
                      <div className="text-sm text-gray-500">{formatDateToFrench(inspection.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {inspection.price?.toLocaleString('fr-FR') || 'N/A'} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInspection(inspection);
                          const existingDocs: Document[] = (inspection.documents || []).map(doc => ({
                            name: doc.name,
                            url: doc.url,
                            type: doc.type,
                            size: doc.size,
                            isNew: false,
                          }));
                          setEditedInspection({ ...inspection, documents: existingDocs });
                          setNewAttachmentFiles([]);
                          setEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInspection(inspection._id);
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

        {/* Inspection Details */}
        <div className="lg:col-span-1">
          {selectedInspection ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de la visite</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir annuler les modifications ?')) {
                          setEditMode(false);
                          setEditedInspection(null);
                          setNewAttachmentFiles([]);
                        }
                      }}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editedInspection) {
                          handleUpdateInspection(editedInspection);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <EditButton
                    onClick={() => {
                      const existingDocs: Document[] = (selectedInspection.documents || []).map(doc => ({
                        name: doc.name,
                        url: doc.url,
                        type: doc.type,
                        size: doc.size,
                        isNew: false,
                      }));
                      setEditedInspection({ ...selectedInspection, documents: existingDocs });
                      setNewAttachmentFiles([]);
                      setEditMode(true);
                    }}
                    withText={true}
                    className="mr-2"
                  />
                )}
                <CloseButton onClick={() => setSelectedInspection(null)} />
              </div>

              <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-150px)]">
                {typeof selectedInspection.vehicle === 'object' && selectedInspection.vehicle && (
                  <div className="mb-6 relative">
                    {(selectedInspection.vehicle as Vehicle).imageUrl ? (
                      <div className="relative">
                        <img
                          src={(selectedInspection.vehicle as Vehicle).imageUrl?.startsWith('data:') ? (selectedInspection.vehicle as Vehicle).imageUrl : `${API_URL}/${(selectedInspection.vehicle as Vehicle).imageUrl?.replace(/\\/g, '/')}`}
                          alt={`${(selectedInspection.vehicle as Vehicle).brand} ${(selectedInspection.vehicle as Vehicle).model}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Car size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                <section>
                  <h3 className="text-lg font-medium mb-4">Informations Générales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Véhicule</label>
                      {editMode && editedInspection ? (
                        <select
                          name="vehicle"
                          onChange={(e) => {
                            const selectedVehicleId = e.target.value;
                            setEditedInspection(prev => prev ? { ...prev, vehicle: selectedVehicleId } : null);
                          }}
                          value={editedInspection?.vehicle ? (typeof editedInspection.vehicle === 'object' ? editedInspection.vehicle._id : editedInspection.vehicle) : ''}
                          className="mt-1 w-full border rounded-lg p-2"
                        >
                          <option value="">Sélectionner un véhicule</option>
                          {vehicles.map(v => <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>)}
                        </select>
                      ) : (
                        <p className="mt-1 font-medium">
                          {typeof selectedInspection.vehicle === 'object' && selectedInspection.vehicle ? `${selectedInspection.vehicle.model} (${selectedInspection.vehicle.licensePlate})` : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Centre</label>
                      {editMode && editedInspection ? (
                        <input
                          type="text"
                          name="center"
                          value={editedInspection.center || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, center: e.target.value } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.center || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">ID de contrôle</label>
                      {editMode && editedInspection ? (
                        <input
                          type="text"
                          name="controlId"
                          value={editedInspection.controlId || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, controlId: e.target.value } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.controlId || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Numéro d'autorisation</label>
                      {editMode && editedInspection ? (
                        <input
                          type="text"
                          name="authorizationNumber"
                          value={editedInspection.authorizationNumber || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, authorizationNumber: e.target.value } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.authorizationNumber || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date d'inspection</label>
                      {editMode && editedInspection ? (
                        <DatePicker
                          selected={editedInspection.inspectionDate ? new Date(editedInspection.inspectionDate) : null}
                          onChange={(date) => setEditedInspection(prev => prev ? { ...prev, inspectionDate: date ? date.toISOString() : '' } : null)}
                          dateFormat="dd/MM/yyyy"
                          locale="fr"
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formatDateToFrench(selectedInspection.inspectionDate) || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Durée</label>
                      {editMode && editedInspection ? (
                        <input
                          type="number"
                          name="duration"
                          value={editedInspection.duration || 0}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, duration: Number(e.target.value) } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.duration ? `${selectedInspection.duration} mois` : '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date de fin</label>
                      {editMode && editedInspection ? (
                        <DatePicker
                          selected={editedInspection.endDate ? new Date(editedInspection.endDate) : null}
                          onChange={(date) => setEditedInspection(prev => prev ? { ...prev, endDate: date ? date.toISOString() : '' } : null)}
                          dateFormat="dd/MM/yyyy"
                          locale="fr"
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formatDateToFrench(selectedInspection.endDate) || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Prix</label>
                      {editMode && editedInspection ? (
                        <input
                          type="number"
                          name="price"
                          value={editedInspection.price || 0}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.price?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Contact du centre</label>
                      {editMode && editedInspection ? (
                        <input
                          type="text"
                          name="centerContact"
                          value={editedInspection.centerContact || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, centerContact: e.target.value } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.centerContact || '-'}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium mb-4">Détails de l'inspection</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Nom de l'inspecteur</label>
                      {editMode && editedInspection ? (
                        <input
                          type="text"
                          name="inspectorName"
                          value={editedInspection.inspectorName || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, inspectorName: e.target.value } : null)}
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.inspectorName || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Résultats</label>
                      {editMode && editedInspection ? (
                        <textarea
                          name="results"
                          value={editedInspection.results || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, results: e.target.value } : null)}
                          rows={3}
                          className="mt-1 w-full border rounded-lg p-2"
                        ></textarea>
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.results || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Prochaine date d'inspection</label>
                      {editMode && editedInspection ? (
                        <DatePicker
                          selected={editedInspection.nextInspectionDate ? new Date(editedInspection.nextInspectionDate) : null}
                          onChange={(date) => setEditedInspection(prev => prev ? { ...prev, nextInspectionDate: date ? date.toISOString() : '' } : null)}
                          dateFormat="dd/MM/yyyy"
                          locale="fr"
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formatDateToFrench(selectedInspection.nextInspectionDate) || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Observation</label>
                      {editMode && editedInspection ? (
                        <textarea
                          name="observation"
                          value={editedInspection.observation || ''}
                          onChange={(e) => setEditedInspection(prev => prev ? { ...prev, observation: e.target.value } : null)}
                          rows={3}
                          className="mt-1 w-full border rounded-lg p-2"
                        ></textarea>
                      ) : (
                        <p className="mt-1 font-medium">{selectedInspection.observation || '-'}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium mb-4">Documents Associés</h3>
                  {editMode && editedInspection ? (
                    <FileUploader
                      api_url={API_URL}
                      existingDocuments={editedInspection.documents || []}
                      newFiles={newAttachmentFiles}
                      onNewFilesChange={setNewAttachmentFiles}
                      onRemoveExistingDocument={handleRemoveExistingDocument}
                    />
                  ) : (
                    selectedInspection?.documents && selectedInspection.documents.length > 0 ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={selectedInspection.documents}
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
                </section>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Car size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucune visite technique sélectionnée
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une visite technique pour voir ses détails
                </p>
                <button
                  onClick={() => {
                    setSelectedInspection(null);
                    setShowNewInspectionModal(true);
                    setNewAttachmentFiles([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter une Visite
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewInspectionModal && (
        <InspectionForm
          onSubmit={handleAddInspection}
          onClose={() => setShowNewInspectionModal(false)}
          initialData={null}
          vehicles={vehicles}
          selectedInspection={selectedInspection}
          setSelectedInspection={setSelectedInspection}
          setEditedInspection={setEditedInspection}
          newAttachmentFiles={newAttachmentFiles}
          setNewAttachmentFiles={setNewAttachmentFiles}
          API_URL_INSPECTIONS={API_URL_INSPECTIONS}
          API_URL={API_URL}
          handleRemoveExistingDocument={handleRemoveExistingDocument}
        />
      )}
    </div>
  );
};

const InspectionForm = ({
  onSubmit,
  onClose,
  initialData,
  vehicles,
  selectedInspection,
  setSelectedInspection,
  setEditedInspection,
  newAttachmentFiles,
  setNewAttachmentFiles,
  API_URL_INSPECTIONS,
  API_URL,
  handleRemoveExistingDocument
}: {
  onSubmit: (data: Partial<TechnicalInspection>) => void;
  onClose: () => void;
  initialData: TechnicalInspection | null;
  vehicles: Vehicle[];
  selectedInspection: TechnicalInspection | null;
  setSelectedInspection: React.Dispatch<React.SetStateAction<TechnicalInspection | null>>;
  setEditedInspection: React.Dispatch<React.SetStateAction<TechnicalInspection | null>>;
  newAttachmentFiles: File[];
  setNewAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  API_URL_INSPECTIONS: string;
  API_URL: string;
  handleRemoveExistingDocument: (docToRemove: Document) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<Partial<Omit<TechnicalInspection, 'vehicle'> & { vehicle?: string }>>(() => {
    if (initialData) {
      const vehicleId = typeof initialData.vehicle === 'object' && initialData.vehicle !== null
        ? initialData.vehicle._id
        : initialData.vehicle;
      return {
        ...initialData,
        inspectionDate: initialData.inspectionDate ? new Date(initialData.inspectionDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        nextInspectionDate: initialData.nextInspectionDate ? new Date(initialData.nextInspectionDate).toISOString().split('T')[0] : '',
        vehicle: vehicleId,
        documents: initialData.documents || [],
        duration: initialData.duration && initialData.duration >= 1 ? initialData.duration : 1,
        price: initialData.price && initialData.price >= 1 ? initialData.price : 1,
      };
    }
    return {
      center: '',
      controlId: '',
      authorizationNumber: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      duration: 1,
      endDate: '',
      price: 1,
      centerContact: '',
      observation: '',
      vehicle: undefined,
      inspectorName: '',
      results: '',
      nextInspectionDate: '',
      documents: [],
    };
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (formData.inspectionDate && formData.duration && formData.duration >= 1) {
      const start = new Date(formData.inspectionDate);
      start.setMonth(start.getMonth() + formData.duration);
      setFormData(prev => ({ ...prev, endDate: start.toISOString().split('T')[0] }));
    } else if (formData.duration && formData.duration < 1) {
      setFormData(prev => ({ ...prev, endDate: '' }));
    }
  }, [formData.inspectionDate, formData.duration]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (['center', 'controlId', 'authorizationNumber', 'centerContact', 'inspectorName', 'results', 'observation'].includes(name)) {
      if (value.trim() === '' && (e.target.required || ['center', 'inspectorName', 'results'].includes(name))) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Ce champ ne peut pas contenir uniquement des espaces.' }));
      } else if (value.trim() === '' && !e.target.required && value.length > 0) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Ce champ ne peut pas contenir uniquement des espaces.' }));
      }
      else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (name === 'duration' || name === 'price') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 1) {
        setValidationErrors(prev => ({ ...prev, [name]: 'La valeur ne peut pas être inférieure à 1.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    setFormData(prev => {
      if (name === 'duration' || name === 'price') {
        return { ...prev, [name]: parseFloat(value) || 0 };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleDateChange = (date: Date | null, name: string) => {
    setFormData(prev => ({ ...prev, [name]: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleRemoveDocumentFromForm = async (docToRemove: Document) => {
    if (!selectedInspection) return;

    if (docToRemove.isNew) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents?.filter(doc => doc.url !== docToRemove.url),
      }));
      setNewAttachmentFiles(prev => prev.filter(file => URL.createObjectURL(file) !== docToRemove.url));
      return;
    }

    await handleRemoveExistingDocument(docToRemove);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: {[key: string]: string} = {};
    if (formData.center?.trim() === '') errors.center = 'Le centre ne peut pas être vide.';
    if (formData.controlId && formData.controlId.trim() === '') errors.controlId = 'L\'ID de contrôle ne peut pas être vide.';
    if (formData.authorizationNumber && formData.authorizationNumber.trim() === '') errors.authorizationNumber = 'Le numéro d\'autorisation ne peut pas être vide.';
    if (formData.centerContact && formData.centerContact.trim() === '') errors.centerContact = 'Le contact du centre ne peut pas être vide.';
    if (formData.inspectorName?.trim() === '') errors.inspectorName = 'Le nom de l\'inspecteur ne peut pas être vide.';
    if (formData.results?.trim() === '') errors.results = 'Les résultats ne peuvent pas être vides.';
    if (formData.observation && formData.observation.trim() === '') errors.observation = 'L\'observation ne peut pas être vide.';
    if (formData.duration !== undefined && formData.duration < 1) errors.duration = 'La durée ne peut pas être inférieure à 1.';
    if (formData.price !== undefined && formData.price < 1) errors.price = 'Le prix ne peut pas être inférieur à 1.';

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    onSubmit({
      ...formData,
      vehicle: formData.vehicle,
    } as Partial<TechnicalInspection>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <CloseButton onClick={onClose} />
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Modifier' : 'Nouvelle'} Visite</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                <select
                  id="vehicle"
                  name="vehicle"
                  onChange={handleChange}
                  value={formData.vehicle || ''}
                  className="w-full border rounded-lg p-2"
                  required
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map(v => <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="center" className="block text-sm font-medium text-gray-700 mb-1">Centre</label>
                <input
                  type="text"
                  id="center"
                  name="center"
                  value={formData.center || ''}
                  onChange={handleChange}
                  placeholder="Nom du centre"
                  className={`w-full border rounded-lg p-2 ${validationErrors.center ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                />
                {validationErrors.center && <p className="text-red-500 text-xs mt-1">{validationErrors.center}</p>}
              </div>

              <div>
                <label htmlFor="controlId" className="block text-sm font-medium text-gray-700 mb-1">ID de contrôle</label>
                <input
                  type="text"
                  id="controlId"
                  name="controlId"
                  value={formData.controlId || ''}
                  onChange={handleChange}
                  placeholder="ID de contrôle"
                  className={`w-full border rounded-lg p-2 ${validationErrors.controlId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.controlId && <p className="text-red-500 text-xs mt-1">{validationErrors.controlId}</p>}
              </div>

              <div>
                <label htmlFor="authorizationNumber" className="block text-sm font-medium text-gray-700 mb-1">Numéro d'autorisation</label>
                <input
                  type="text"
                  id="authorizationNumber"
                  name="authorizationNumber"
                  value={formData.authorizationNumber || ''}
                  onChange={handleChange}
                  placeholder="Numéro d'autorisation"
                  className={`w-full border rounded-lg p-2 ${validationErrors.authorizationNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.authorizationNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.authorizationNumber}</p>}
              </div>

              <div>
                <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700 mb-1">Date d'inspection</label>
                <DatePicker
                  id="inspectionDate"
                  selected={formData.inspectionDate ? new Date(formData.inspectionDate) : null}
                  onChange={(date) => handleDateChange(date, 'inspectionDate')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Durée (mois)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration || 0}
                  onChange={handleChange}
                  placeholder="Durée en mois"
                  className={`w-full border rounded-lg p-2 ${validationErrors.duration ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.duration && <p className="text-red-500 text-xs mt-1">{validationErrors.duration}</p>}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                  readOnly
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Prix (DH)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || 0}
                  onChange={handleChange}
                  placeholder="Prix"
                  className={`w-full border rounded-lg p-2 ${validationErrors.price ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.price && <p className="text-red-500 text-xs mt-1">{validationErrors.price}</p>}
              </div>

              <div>
                <label htmlFor="centerContact" className="block text-sm font-medium text-gray-700 mb-1">Contact du centre</label>
                <input
                  type="text"
                  id="centerContact"
                  name="centerContact"
                  value={formData.centerContact || ''}
                  onChange={handleChange}
                  placeholder="Contact du centre"
                  className={`w-full border rounded-lg p-2 ${validationErrors.centerContact ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.centerContact && <p className="text-red-500 text-xs mt-1">{validationErrors.centerContact}</p>}
              </div>
            </div>
          </section>

          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Détails de l'inspection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inspectorName" className="block text-sm font-medium text-gray-700 mb-1">Nom de l'inspecteur</label>
                <input
                  type="text"
                  id="inspectorName"
                  name="inspectorName"
                  value={formData.inspectorName || ''}
                  onChange={handleChange}
                  placeholder="Nom de l'inspecteur"
                  className={`w-full border rounded-lg p-2 ${validationErrors.inspectorName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                />
                {validationErrors.inspectorName && <p className="text-red-500 text-xs mt-1">{validationErrors.inspectorName}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="results" className="block text-sm font-medium text-gray-700 mb-1">Résultats</label>
                <textarea
                  id="results"
                  name="results"
                  value={formData.results || ''}
                  onChange={handleChange}
                  placeholder="Résultats de l'inspection"
                  rows={3}
                  className={`w-full border rounded-lg p-2 ${validationErrors.results ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                ></textarea>
                {validationErrors.results && <p className="text-red-500 text-xs mt-1">{validationErrors.results}</p>}
              </div>

              <div>
                <label htmlFor="nextInspectionDate" className="block text-sm font-medium text-gray-700 mb-1">Prochaine date d'inspection</label>
                <DatePicker
                  id="nextInspectionDate"
                  selected={formData.nextInspectionDate ? new Date(formData.nextInspectionDate) : null}
                  onChange={(date) => handleDateChange(date, 'nextInspectionDate')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
                <textarea
                  id="observation"
                  name="observation"
                  value={formData.observation || ''}
                  onChange={handleChange}
                  placeholder="Observations supplémentaires"
                  rows={3}
                  className={`w-full border rounded-lg p-2 ${validationErrors.observation ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                ></textarea>
                {validationErrors.observation && <p className="text-red-500 text-xs mt-1">{validationErrors.observation}</p>}
              </div>
            </div>
          </section>

          <FileUploader
            api_url={API_URL}
            existingDocuments={formData.documents || []}
            newFiles={newAttachmentFiles}
            onNewFilesChange={setNewAttachmentFiles}
            onRemoveExistingDocument={handleRemoveDocumentFromForm}
          />

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {initialData ? 'Mettre à jour' : 'Ajouter'} Visite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleInspections;
