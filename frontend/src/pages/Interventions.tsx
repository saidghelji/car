import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Search, Plus, Trash2, Car, 
  Calendar, FileText, Filter, AlertTriangle,
  X, Upload, Wrench, DollarSign
} from 'lucide-react';
import CloseButton from '../components/CloseButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import EditButton from '../components/EditButton';
import { Vehicle } from './Vehicles'; // Import Vehicle type
import FileUploader, { Document, FilePreview } from '../components/FileUploader';

registerLocale('fr', fr);

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

// Define types
type InterventionType = 'vidange' | 'lavage' | 'chaine';

interface InterventionDocument {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Intervention {
  _id: string; // MongoDB's unique ID
  vehicle: string | null; // Vehicle ID, allow null
  description: string;
  date: string; // Changed from dateIntervention to date
  cost: number; // Changed from cout to cost
  status: string; // Added status field
  documents?: InterventionDocument[];
  createdAt: string;
  updatedAt: string;
  type: InterventionType;
  observation?: string;
  currentMileage?: number;
  nextMileage?: number;
}

// Local type for populated intervention data
  type PopulatedIntervention = Omit<Intervention, 'vehicle'> & { vehicle: Vehicle | null };

  // Helper function to get translated status label
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'En attente';
      case 'Completed':
        return 'Terminée';
      case 'Cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

const InterventionDetailsPanel = ({
  intervention,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onInputChange,
  onRemoveExistingDocument,
  editMode,
  editedIntervention,
  vehicles,
  API_URL,
  newAttachmentFiles, // Destructure from props
  setNewAttachmentFiles // Destructure from props
}: {
  intervention: PopulatedIntervention;
  onClose: () => void;
  onEdit: () => void;
  onSave: (newFiles: File[]) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onInputChange: (field: keyof PopulatedIntervention, value: any) => void;
  onRemoveExistingDocument: (doc: Document) => Promise<void>;
  editMode: boolean;
  editedIntervention: PopulatedIntervention | null;
  vehicles: Vehicle[];
  API_URL: string;
  newAttachmentFiles: File[];
  setNewAttachmentFiles: (files: File[]) => void;
}) => {
  // The newAttachmentFiles and setNewAttachmentFiles are now passed as props,
  // so the local state is no longer needed.
  // const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);

  const getInterventionTypeLabel = (type: InterventionType): string => {
    return interventionTypes.find(t => t.value === type)?.label || type;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' }).replace('MAD', 'DH');
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Détails de l'intervention</h2>
        <div className="flex items-center space-x-2">
          {editMode ? (
            <>
              <button onClick={() => onSave(newAttachmentFiles)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Enregistrer
              </button>
              <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm">
                Annuler
              </button>
            </>
          ) : (
            <EditButton onClick={onEdit} withText={true} className="mr-2" />
          )}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Vehicle Info */}
        <section>
          <h3 className="text-lg font-medium mb-4">Véhicule</h3>
          {editMode ? (
            <select
              className="w-full border rounded-lg p-2"
              value={editedIntervention?.vehicle?._id || ''}
              onChange={(e) => onInputChange('vehicle', e.target.value)}
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.licensePlate} - {v.brand} {v.model}
                </option>
              ))}
            </select>
          ) : (
            intervention.vehicle ? (
              <div className="p-4 border-b">
                <div className="flex items-center space-x-4">
                  {intervention.vehicle.imageUrl ? (
                    <img
                      src={intervention.vehicle.imageUrl.startsWith('data:') ? intervention.vehicle.imageUrl : `${API_URL}/${intervention.vehicle.imageUrl.replace(/\\/g, '/').replace(/^\//, '')}`}
                      alt={`${intervention.vehicle.brand || 'N/A'} ${intervention.vehicle.model || 'N/A'}`}
                      className="w-24 h-24 object-cover rounded-lg shadow"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow">
                      <Car size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg">{intervention.vehicle.brand || 'N/A'} {intervention.vehicle.model || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{intervention.vehicle.licensePlate || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b">
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
        </section>

        {/* Intervention Section */}
        <section>
          <h3 className="text-lg font-medium mb-4">Intervention</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Type</label>
              {editMode ? (
                <select
                  className="mt-1 w-full border rounded-lg p-2"
                  value={editedIntervention?.type || ''}
                  onChange={(e) => onInputChange('type', e.target.value as InterventionType)}
                >
                  {interventionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              ) : (
                <p className="mt-1">{getInterventionTypeLabel(intervention.type)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Date</label>
              {editMode ? (
                <DatePicker
                  selected={editedIntervention?.date ? new Date(editedIntervention.date) : null}
                  onChange={(date: Date | null) => onInputChange('date', date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  className="mt-1 w-full border rounded-lg p-2"
                />
              ) : (
                <p className="mt-1">{new Date(intervention.date).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>
          {intervention.type === 'chaine' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Kilométrage actuel</label>
                {editMode ? (
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedIntervention?.currentMileage || ''}
                    onChange={(e) => onInputChange('currentMileage', parseFloat(e.target.value))}
                  />
                ) : (
                  <p className="mt-1">{intervention.currentMileage ? `${intervention.currentMileage} km` : '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Prochaine Kilométrage</label>
                {editMode ? (
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedIntervention?.nextMileage || ''}
                    onChange={(e) => onInputChange('nextMileage', parseFloat(e.target.value))}
                  />
                ) : (
                  <p className="mt-1">{intervention.nextMileage ? `${intervention.nextMileage} km` : '-'}</p>
                )}
              </div>
            </div>
          )}
          {(intervention.type === 'chaine' || intervention.type === 'vidange') && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Kilométrage actuel</label>
                {editMode ? (
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedIntervention?.currentMileage || ''}
                    onChange={(e) => onInputChange('currentMileage', parseFloat(e.target.value))}
                  />
                ) : (
                  <p className="mt-1">{intervention.currentMileage ? `${intervention.currentMileage} km` : '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Prochaine Kilométrage</label>
                {editMode ? (
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedIntervention?.nextMileage || ''}
                    onChange={(e) => onInputChange('nextMileage', parseFloat(e.target.value))}
                  />
                ) : (
                  <p className="mt-1">{intervention.nextMileage ? `${intervention.nextMileage} km` : '-'}</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Financial Details Section */}
        <section>
          <h3 className="text-lg font-medium mb-4">Détails Financiers</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Coût</label>
              {editMode ? (
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={editedIntervention?.cost || 0}
                  onChange={(e) => onInputChange('cost', parseFloat(e.target.value))}
                />
              ) : (
                <p className="mt-1">{formatCurrency(intervention.cost)}</p>
              )}
            </div>
          </div>
        </section>

        {/* Status and Description Section */}
        <section>
          <h3 className="text-lg font-medium mb-4">Statut et Description</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Statut</label>
              {editMode ? (
                <select
                  className="mt-1 w-full border rounded-lg p-2"
                  value={editedIntervention?.status || ''}
                  onChange={(e) => onInputChange('status', e.target.value)}
                >
                  <option value="Pending">{getStatusLabel('Pending')}</option>
                  <option value="Completed">{getStatusLabel('Completed')}</option>
                  <option value="Cancelled">{getStatusLabel('Cancelled')}</option>
                </select>
              ) : (
                <p className="mt-1">{getStatusLabel(intervention.status)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Description</label>
              {editMode ? (
                <textarea
                  className="mt-1 w-full border rounded-lg p-2"
                  value={editedIntervention?.description || ''}
                  onChange={(e) => onInputChange('description', e.target.value)}
                  rows={3}
                />
              ) : (
                <p className="mt-1">{intervention.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Observation</label>
              {editMode ? (
                <textarea
                  className="mt-1 w-full border rounded-lg p-2"
                  value={editedIntervention?.observation || ''}
                  onChange={(e) => onInputChange('observation', e.target.value)}
                  rows={2}
                />
              ) : (
                <p className="mt-1">{intervention.observation || '-'}</p>
              )}
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section>
          <h3 className="text-lg font-medium mb-4">Documents</h3>
            <FileUploader
              api_url={API_URL}
              newFiles={newAttachmentFiles}
              onNewFilesChange={setNewAttachmentFiles} // Pass the setter from props
              existingDocuments={editMode ? editedIntervention?.documents || [] : intervention.documents || []}
              onRemoveExistingDocument={onRemoveExistingDocument}
              readOnly={!editMode}
              label=""
            />
        </section>
      </div>
    </div>
  );
};

// Sample intervention types with labels
const interventionTypes = [
  { value: 'lavage', label: 'Lavage' },
  { value: 'vidange', label: 'Vidange' },
  { value: 'chaine', label: 'Chaîne' }
];


const InterventionForm = ({ 
  onSubmit, 
  onClose, 
  initialData = null,
  vehicles,
  API_URL,
  newAttachmentFiles, // Destructure from props
  setNewAttachmentFiles // Destructure from props
}: { 
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  initialData?: PopulatedIntervention | null;
  vehicles: Vehicle[];
  API_URL: string;
  newAttachmentFiles: File[];
  setNewAttachmentFiles: (files: File[]) => void;
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(initialData?.vehicle || null);
  const [documents, setDocuments] = useState<InterventionDocument[]>(initialData?.documents || []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialData?.date ? new Date(initialData.date) : null
  );
  const [interventionType, setInterventionType] = useState<InterventionType | ''>(initialData?.type || '');
  const [currentMileage, setCurrentMileage] = useState<number | ''>(initialData?.currentMileage || '');
  const [nextMileage, setNextMileage] = useState<number | ''>(initialData?.nextMileage || '');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setCurrentMileage(initialData.currentMileage || '');
      setNextMileage(initialData.nextMileage || '');
    }
  }, [initialData]);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = vehicles.find(v => v._id === e.target.value);
    setSelectedVehicle(selected || null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (['description', 'observation'].includes(name)) {
      if (isOnlySpaces(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Ce champ ne peut pas contenir uniquement des espaces.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (name === 'cost') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) { // Allow 0 for cost, but not negative
        setValidationErrors(prev => ({ ...prev, [name]: 'Le coût ne peut pas être négatif.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // Update form data (assuming a similar state structure as in VehicleInspections)
    // For simplicity, we'll directly update the form fields in handleSubmit for now.
    // If a more complex form state is needed, a separate formData state would be better.
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData();

    const description = form.description.value;
    const observation = form.observation.value;
    const cost = parseFloat(form.cost.value);

    const errors: {[key: string]: string} = {};

    if (isOnlySpaces(description)) {
      errors.description = 'La description ne peut pas contenir uniquement des espaces.';
    }
    if (observation && isOnlySpaces(observation)) {
      errors.observation = 'L\'observation ne peut pas contenir uniquement des espaces.';
    }
    if (isNaN(cost) || cost < 0) {
      errors.cost = 'Le coût ne peut pas être négatif.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    formData.append('type', form.type.value);
    if (selectedDate) {
      formData.append('date', selectedDate.toISOString().split('T')[0]);
    }
    if (selectedVehicle) {
      formData.append('vehicle', selectedVehicle._id);
    }
    formData.append('description', description);
    formData.append('cost', String(cost));
    formData.append('status', form.status.value);
    formData.append('observation', observation);
    if (currentMileage !== '') {
      formData.append('currentMileage', String(currentMileage));
    }
    if (nextMileage !== '') {
      formData.append('nextMileage', String(nextMileage));
    }

    newAttachmentFiles.forEach(file => {
      formData.append('documents', file);
    });

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <CloseButton onClick={onClose} />
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Modifier l\'intervention' : 'Ajouter une intervention'}
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Intervention Type and Date */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Type d'intervention*
                </label>
                <select
                  name="type"
                  required
                  className="border rounded-lg p-2"
                  value={interventionType}
                  onChange={(e) => {
                    setInterventionType(e.target.value as InterventionType);
                    setCurrentMileage('');
                    setNextMileage('');
                  }}
                >
                  <option value="">Sélectionner un type</option>
                  {interventionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Date d'intervention*
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => setSelectedDate(date)}
                  name="date"
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  required
                  className="border rounded-lg p-2"
                />
              </div>
            </div>
          </section>

          {/* Mileage Information (Conditional) */}
          {(interventionType === 'chaine' || interventionType === 'vidange') && (
            <section className="border-b pb-4">
              <h3 className="font-semibold mb-3">Informations Kilométrage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(interventionType === 'chaine' || interventionType === 'vidange') && (
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kilométrage actuel (km)*
                    </label>
                    <input
                      name="currentMileage"
                      type="number"
                      required
                      className="w-full border rounded-lg p-2"
                      value={currentMileage}
                      onChange={(e) => setCurrentMileage(parseFloat(e.target.value))}
                    />
                  </div>
                )}
                {(interventionType === 'chaine' || interventionType === 'vidange') && (
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prochaine Kilométrage (km)*
                    </label>
                    <input
                      name="nextMileage"
                      type="number"
                      required
                      className="w-full border rounded-lg p-2"
                      value={nextMileage}
                      onChange={(e) => setNextMileage(parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Vehicle Information */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Véhicule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Sélectionner un véhicule*
                </label>
                <select
                  name="vehicle"
                  required
                  className="border rounded-lg p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={selectedVehicle?._id || ''}
                  onChange={handleVehicleChange}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.filter(v => v.statut === 'En parc').map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Détails du véhicule
                </label>
                <div className={`w-full border rounded-lg p-3 ${selectedVehicle ? 'bg-blue-50 border-blue-200' : 'bg-gray-100'} flex items-center`}>
                  <Car size={18} className={`${selectedVehicle ? 'text-blue-500' : 'text-gray-500'} mr-2`} />
                  {selectedVehicle ? (
                    <div>
                      <span className="font-medium">{selectedVehicle.brand} {selectedVehicle.model}</span>
                      <span className="text-sm text-gray-500 ml-2">({selectedVehicle.licensePlate})</span>
                      <div className="text-xs text-blue-600 mt-1">
                        Kilométrage actuel: {selectedVehicle.mileage} km
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Veuillez sélectionner un véhicule</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Intervention Details */}
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Détails de l'intervention</h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description de l'intervention*
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className={`w-full border rounded-lg p-2 ${validationErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.description}
                  onChange={handleChange}
                ></textarea>
                {validationErrors.description && <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coût de l'intervention (DH)*
                  </label>
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    required
                    className={`w-full border rounded-lg p-2 ${validationErrors.cost ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    defaultValue={initialData?.cost}
                    onChange={handleChange}
                  />
                  {validationErrors.cost && <p className="text-red-500 text-xs mt-1">{validationErrors.cost}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut*
                  </label>
                  <select
                    name="status"
                    required
                    className="w-full border rounded-lg p-2"
                    defaultValue={initialData?.status || 'Pending'}
                  >
                    <option value="Pending">{getStatusLabel('Pending')}</option>
                    <option value="Completed">{getStatusLabel('Completed')}</option>
                    <option value="Cancelled">{getStatusLabel('Cancelled')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observation
                </label>
                <textarea
                  name="observation"
                  rows={2}
                  className={`w-full border rounded-lg p-2 ${validationErrors.observation ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.observation}
                  onChange={handleChange}
                ></textarea>
                {validationErrors.observation && <p className="text-red-500 text-xs mt-1">{validationErrors.observation}</p>}
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <section className="border-b pb-4 mb-4">
            <h3 className="font-semibold mb-3">
              <div className="flex items-center">
                <FileText size={18} className="mr-2 text-gray-500" />
                Documents
              </div>
            </h3>
            <FileUploader
              api_url={API_URL}
              newFiles={newAttachmentFiles}
              onNewFilesChange={setNewAttachmentFiles} // Pass the setter from props
              existingDocuments={documents}
              onRemoveExistingDocument={async () => {}}
              readOnly={false}
              label=""
            />
          </section>

          {/* Form Actions */}
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
              {initialData ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Interventions = () => {
  const [interventions, setInterventions] = useState<PopulatedIntervention[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModalForm, setShowModalForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all'); // Added status filter
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null); // Added date filters
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null); // Added date filters
  const [selectedIntervention, setSelectedIntervention] = useState<PopulatedIntervention | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedIntervention, setEditedIntervention] = useState<PopulatedIntervention | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]); // Move this state up
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000'; // Base API URL for FileUploader
  const API_URL_INTERVENTIONS = `${API_URL}/api/interventions`;
  const API_URL_VEHICLES = `${API_URL}/api/vehicles`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vehiclesRes = await axios.get<Vehicle[]>(API_URL_VEHICLES);
      setVehicles(vehiclesRes.data);

      const interventionsRes = await axios.get<PopulatedIntervention[]>(API_URL_INTERVENTIONS);
      setInterventions(interventionsRes.data);
      toast.success('Data loaded successfully!');
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

  const getInterventionTypeLabel = (type: InterventionType): string => {
    return interventionTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'En attente';
      case 'Completed':
        return 'Terminée';
      case 'Cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })
      .replace('MAD', 'DH');
  };

  const handleAddIntervention = async (data: FormData) => {
    try {
      const response = await axios.post<Intervention>(API_URL_INTERVENTIONS, data);
      setShowModalForm(false);
      toast.success('Intervention added successfully!');
      fetchData();
      setNewAttachmentFiles([]); // Clear new files after successful upload
    } catch (err) {
      console.error('Error adding intervention:', err);
      toast.error('Failed to add intervention.');
    }
  };

  const handleEditClick = () => {
    if (selectedIntervention) {
      setEditedIntervention({ ...selectedIntervention });
      setEditMode(true);
    }
  };

  const handleSaveEdit = async (newFiles: File[]) => {
    if (!editedIntervention) return;

    const errors: {[key: string]: string} = {};

    if (isOnlySpaces(editedIntervention.description)) {
      errors.description = 'La description ne peut pas contenir uniquement des espaces.';
    }
    if (editedIntervention.observation && isOnlySpaces(editedIntervention.observation)) {
      errors.observation = 'L\'observation ne peut pas contenir uniquement des espaces.';
    }
    if (editedIntervention.cost < 0) {
      errors.cost = 'Le coût ne peut pas être négatif.';
    }

    if (Object.keys(errors).length > 0) {
      // Display errors to the user, perhaps using toast or by updating a state for validation errors
      // For now, we'll just use toast.
      Object.values(errors).forEach(errorMsg => toast.error(errorMsg));
      return;
    }

    try {
      const formData = new FormData();

      const interventionToSave = { ...editedIntervention };
      delete interventionToSave.documents;

      Object.keys(interventionToSave).forEach(key => {
        const value = (interventionToSave as any)[key];
        if (key === 'vehicle' && typeof value === 'object' && value !== null) {
          formData.append('vehicle', value._id);
        } else if (key === 'date' && value) {
          formData.append('date', new Date(value).toISOString().split('T')[0]);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (editedIntervention.documents) {
        editedIntervention.documents.forEach(doc => {
          if (doc.url && !doc.url.startsWith('blob:')) {
            formData.append('existingDocuments', doc.url);
          }
        });
      }

      newFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await axios.put<Intervention>(`${API_URL_INTERVENTIONS}/${editedIntervention._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const updatedIntervention = response.data;
      const populatedIntervention: PopulatedIntervention = { ...updatedIntervention, vehicle: updatedIntervention.vehicle as Vehicle | null };
      setInterventions(interventions.map(i => (i._id === populatedIntervention._id ? populatedIntervention : i)));
      setSelectedIntervention(populatedIntervention);
      
      setEditMode(false);
      setEditedIntervention(null);
      setNewAttachmentFiles([]); // Clear new files after successful update
      toast.success('Intervention updated successfully!');
    } catch (err) {
      console.error('Error saving intervention edit:', err);
      toast.error('Failed to save changes.');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedIntervention(null);
  };

  const handleInputChange = (field: keyof PopulatedIntervention, value: any) => {
    if (editedIntervention) {
      const updatedIntervention = { ...editedIntervention };
      if (field === 'vehicle') {
        const vehicle = vehicles.find(v => v._id === value) || null;
        updatedIntervention.vehicle = vehicle;
      } else {
        (updatedIntervention[field as keyof Intervention] as any) = value;
      }
      setEditedIntervention(updatedIntervention);
    }
  };

  const handleDeleteIntervention = async (interventionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await axios.delete(`${API_URL_INTERVENTIONS}/${interventionId}`);
        setInterventions(interventions.filter(intervention => intervention._id !== interventionId));
        if (selectedIntervention?._id === interventionId) {
          setSelectedIntervention(null);
        }
        toast.success('Intervention deleted successfully!');
      } catch (err) {
        console.error('Error deleting intervention:', err);
        toast.error('Failed to delete intervention.');
      }
    }
  };

  const filteredInterventions = interventions.filter(intervention => {
    const vehicleDisplay = intervention.vehicle ? `${intervention.vehicle.brand} ${intervention.vehicle.model} (${intervention.vehicle.licensePlate})` : '';
    const matchesSearch =
      vehicleDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getInterventionTypeLabel(intervention.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || intervention.status === statusFilter;

    const interventionDate = new Date(intervention.date);
    const matchesStartDate = startDateFilter ? interventionDate >= startDateFilter : true;
    const matchesEndDate = endDateFilter ? interventionDate <= endDateFilter : true;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading interventions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p className="text-lg">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
        <button 
          onClick={() => {
            setSelectedIntervention(null);
            setShowModalForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Intervention
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search-intervention" className="sr-only">Rechercher une intervention</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                id="search-intervention"
                type="text"
                placeholder="Rechercher une intervention..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="status-filter" className="sr-only">Filtrer par statut</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                id="status-filter"
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | string)}
              >
                <option value="all">Tous les statuts</option>
                <option value="Pending">{getStatusLabel('Pending')}</option>
                <option value="Completed">{getStatusLabel('Completed')}</option>
                <option value="Cancelled">{getStatusLabel('Cancelled')}</option>
              </select>
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="start-date-filter" className="text-sm font-medium text-gray-700 mb-1 block">Date de début</label>
            <DatePicker
              id="start-date-filter"
              selected={startDateFilter}
              onChange={(date: Date | null) => setStartDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              showPopperArrow={false}
              placeholderText="jj/mm/aaaa"
              className="border rounded-lg p-2 w-full"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="end-date-filter" className="text-sm font-medium text-gray-700 mb-1 block">Date de fin</label>
            <DatePicker
              id="end-date-filter"
              selected={endDateFilter}
              onChange={(date: Date | null) => setEndDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              showPopperArrow={false}
              placeholderText="jj/mm/aaaa"
              className="border rounded-lg p-2 w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interventions List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût
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
                {filteredInterventions.map((intervention) => {
                  return (
                    <tr 
                      key={intervention._id} 
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedIntervention?._id === intervention._id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedIntervention(intervention)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="md:block overflow-x-auto md:overflow-visible">
                          <div className="flex items-center min-w-[220px] md:min-w-0">
                            <div className="flex-shrink-0 h-10 w-10">
                              {intervention.vehicle?.imageUrl ? (
                                <img
                                  src={intervention.vehicle.imageUrl.startsWith('data:') ? intervention.vehicle.imageUrl : `${API_URL}/${intervention.vehicle.imageUrl.replace(/\\/g, '/')}`}
                                  alt={`${intervention.vehicle.brand || 'N/A'} ${intervention.vehicle.model || 'N/A'}`}
                                  className="w-10 h-10 object-cover rounded-full"
                                />
                              ) : (
                                <Car size={24} className="mx-auto mt-2 text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{intervention.vehicle?.licensePlate || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{intervention.vehicle ? `${intervention.vehicle.brand} ${intervention.vehicle.model}` : 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getInterventionTypeLabel(intervention.type)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <Calendar size={14} className="mr-1 text-gray-500" /> 
                          {new Date(intervention.date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(intervention.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          intervention.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          intervention.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getStatusLabel(intervention.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <EditButton
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedIntervention(intervention);
                            setEditedIntervention({ ...intervention });
                            setEditMode(true);
                          }}
                          size="md"
                          className="mr-3"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIntervention(intervention._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {interventions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Aucune intervention trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Intervention Details */}
        <div className="lg:col-span-1">
          {selectedIntervention ? (
            <InterventionDetailsPanel
              intervention={selectedIntervention}
              onClose={() => setSelectedIntervention(null)}
              onEdit={handleEditClick}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onDelete={handleDeleteIntervention}
              onInputChange={handleInputChange}
              onRemoveExistingDocument={async (docToRemove) => {
                if (editedIntervention) {
                  const updatedDocs = editedIntervention.documents?.filter(doc => doc.url !== docToRemove.url) || [];
                  setEditedIntervention({ ...editedIntervention, documents: updatedDocs });
                }
              }}
              editMode={editMode}
              editedIntervention={editedIntervention}
              vehicles={vehicles}
              API_URL={API_URL}
              newAttachmentFiles={newAttachmentFiles} // Pass newAttachmentFiles
              setNewAttachmentFiles={setNewAttachmentFiles} // Pass setNewAttachmentFiles
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Aucune intervention sélectionnée</p>
            </div>
          )}
        </div>
      </div>
      
      {showModalForm && (
        <InterventionForm 
          onSubmit={handleAddIntervention}
          onClose={() => setShowModalForm(false)}
          initialData={selectedIntervention}
          vehicles={vehicles}
          API_URL={API_URL}
          newAttachmentFiles={newAttachmentFiles} // Pass newAttachmentFiles
          setNewAttachmentFiles={setNewAttachmentFiles} // Pass setNewAttachmentFiles
        />
      )}
    </div>
  );
};

export default Interventions;
