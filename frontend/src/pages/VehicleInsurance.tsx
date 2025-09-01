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

interface Insurance {
  _id: string;
  company: string;
  policyNumber: string;
  operationDate: string;
  startDate: string;
  duration: number;
  endDate: string;
  price: number;
  contactInfo: string;
  observation: string;
  vehicle: Vehicle | string | null; // Updated to allow null
  attachments: string[];
  documents?: Document[];
}

const API_URL = 'http://localhost:5000';

const VehicleInsurance = () => {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInsuranceModal, setShowNewInsuranceModal] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInsurance, setEditedInsurance] = useState<Insurance | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);

  const API_URL_INSURANCES = `${API_URL}/api/vehicleinsurances`;
  const API_URL_VEHICLES = `${API_URL}/api/vehicles`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [insurancesRes, vehiclesRes] = await Promise.all([
        axios.get<Insurance[]>(API_URL_INSURANCES),
        axios.get<Vehicle[]>(API_URL_VEHICLES)
      ]);
      
      const populatedInsurances = insurancesRes.data.map(insurance => {
        const vehicle = vehiclesRes.data.find(v => v._id === (insurance.vehicle as any));
        return { ...insurance, vehicle: vehicle || insurance.vehicle };
      });

      setInsurances(populatedInsurances);
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

  useEffect(() => {
    if (selectedInsurance && !editMode) {
      const docs: Document[] = [];
      if (selectedInsurance.attachments && Array.isArray(selectedInsurance.attachments)) {
        selectedInsurance.attachments.forEach(attachment => {
          const name = attachment.split(/-(.+)/)[1];
          docs.push({
            name: name,
            url: attachment,
            type: getMimeType(name),
            size: 0,
          });
        });
      }
      if (JSON.stringify(selectedInsurance.documents) !== JSON.stringify(docs)) {
        setSelectedInsurance(prev => ({ ...prev!, documents: docs }));
      }
    }
  }, [selectedInsurance, editMode]);

  const filteredInsurances = insurances.filter(insurance => {
    const searchString = searchTerm.toLowerCase();
    const vehicleLicensePlate = (typeof insurance.vehicle === 'object' && insurance.vehicle && insurance.vehicle.licensePlate) ? insurance.vehicle.licensePlate : '';
    return (
      insurance.company.toLowerCase().includes(searchString) ||
      insurance.policyNumber.toLowerCase().includes(searchString) ||
      vehicleLicensePlate.toLowerCase().includes(searchString)
    );
  });

  const handleAddInsurance = async (data: Partial<Insurance>) => {
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
        formData.append('attachments', file);
      });
    }

    try {
      const response = await axios.post<Insurance>(API_URL_INSURANCES, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const newInsurance = response.data;
      const vehicle = vehicles.find(v => v._id === (newInsurance.vehicle as any));
      const populatedInsurance = { ...newInsurance, vehicle: vehicle || newInsurance.vehicle };

      setInsurances([...insurances, populatedInsurance]);
      setShowNewInsuranceModal(false);
      toast.success('Insurance added successfully.');
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error('Error adding insurance:', err);
      toast.error('Failed to add insurance.');
    }
  };

  const handleUpdateInsurance = async (data: Partial<Insurance>) => {
    if (!selectedInsurance) return;

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

    const existingDocsToKeep = editedInsurance?.documents?.filter(doc => !doc.isNew) || [];
    formData.append('existingDocuments', JSON.stringify(existingDocsToKeep));

    if (newAttachmentFiles.length > 0) {
      newAttachmentFiles.forEach(file => {
        formData.append('attachments', file);
      });
    }

    try {
      const response = await axios.put<Insurance>(`${API_URL_INSURANCES}/${selectedInsurance._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedInsurance = response.data;
      const vehicle = vehicles.find(v => v._id === (updatedInsurance.vehicle as any));
      const populatedInsurance = { ...updatedInsurance, vehicle: vehicle || updatedInsurance.vehicle };

      setInsurances(insurances.map(ins => (ins._id === populatedInsurance._id ? populatedInsurance : ins)));
      setSelectedInsurance(populatedInsurance);
      setEditMode(false);
      toast.success('Insurance updated successfully.');
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error('Error updating insurance:', err);
      toast.error('Failed to update insurance.');
    }
  };

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteConfirmation = (insuranceId: string) => {
    setSelectedInsurance(insurances.find(a => a._id === insuranceId) || null);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteInsurance = async () => {
    if (selectedInsurance) {
      try {
        await axios.delete(`${API_URL_INSURANCES}/${selectedInsurance._id}`);
        setInsurances(insurances.filter(a => a._id !== selectedInsurance._id));
        setSelectedInsurance(null);
        setShowDeleteConfirmation(false);
        toast.success('Insurance deleted successfully.');
      } catch (err) {
        console.error('Error deleting insurance:', err);
        toast.error('Failed to delete insurance.');
      }
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!selectedInsurance) return;
    try {
      await axios.delete(`${API_URL_INSURANCES}/${selectedInsurance._id}/documents`, {
        data: { documentName: docToRemove.name }
      });
      setSelectedInsurance(prev => {
        if (!prev) return null;
        return {
          ...prev,
          documents: prev.documents?.filter(doc => doc.url !== docToRemove.url),
          attachments: prev.attachments?.filter(att => att !== docToRemove.name),
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Assurances</h1>
        <button
          onClick={() => {
            setSelectedInsurance(null);
            setShowNewInsuranceModal(true);
            setNewAttachmentFiles([]);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Ajouter une Assurance
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insurances List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher une assurance..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Insurances table */}
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assurance
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
                {filteredInsurances.map((insurance) => (
                  <tr
                    key={insurance._id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedInsurance?._id === insurance._id ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      const vehicleId = typeof insurance.vehicle === 'object' && insurance.vehicle ? insurance.vehicle._id : insurance.vehicle;
                      const vehicle = vehicles.find(v => v._id === vehicleId);
                      setSelectedInsurance({ ...insurance, vehicle: vehicle || insurance.vehicle });
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="md:block overflow-x-auto md:overflow-visible">
                        <div className="flex items-center min-w-[220px] md:min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Car size={20} className="text-gray-500" />
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {typeof insurance.vehicle === 'object' && insurance.vehicle ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">{(insurance.vehicle as Vehicle).brand} {(insurance.vehicle as Vehicle).model}</div>
                                <div className="text-xs text-gray-500">{(insurance.vehicle as Vehicle).licensePlate}</div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">N/A</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{insurance.company}</div>
                      <div className="text-sm text-gray-500">{insurance.policyNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateToFrench(insurance.startDate)}</div>
                      <div className="text-sm text-gray-500">{formatDateToFrench(insurance.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {insurance.price.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInsurance(insurance);
                          setEditMode(true);
                          const existingDocs: Document[] = (insurance.attachments || []).map(att => ({
                            name: att.split(/-(.+)/)[1],
                            url: att,
                            type: '',
                            size: 0,
                            isNew: false,
                          }));
                          setEditedInsurance({ ...insurance, documents: existingDocs });
                          setNewAttachmentFiles([]);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConfirmation(insurance._id);
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

        {/* Insurance Details */}
        <div className="lg:col-span-1">
          {selectedInsurance ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de l'assurance</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      form="insurance-edit-form"
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Sauvegarder
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <EditButton
                    onClick={() => {
                      setEditMode(true);
                      const existingDocs: Document[] = (selectedInsurance.attachments || []).map(att => ({
                        name: att.split(/-(.+)/)[1],
                        url: att,
                        type: '',
                        size: 0,
                        isNew: false,
                      }));
                      setEditedInsurance({ ...selectedInsurance, documents: existingDocs });
                      setNewAttachmentFiles([]);
                    }}
                    withText={true}
                    className="mr-2"
                  />
                )}
                <CloseButton onClick={() => setSelectedInsurance(null)} />
              </div>

              <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-150px)]">
                {typeof selectedInsurance.vehicle === 'object' && selectedInsurance.vehicle && (
                  <div className="mb-6 relative">
                    {(selectedInsurance.vehicle as Vehicle).imageUrl ? (
                      <div className="relative">
                        <img
                          src={(selectedInsurance.vehicle as Vehicle).imageUrl?.startsWith('data:') ? (selectedInsurance.vehicle as Vehicle).imageUrl : `${API_URL}/${(selectedInsurance.vehicle as Vehicle).imageUrl?.replace(/\\/g, '/')}`}
                          alt={`${(selectedInsurance.vehicle as Vehicle).brand} ${(selectedInsurance.vehicle as Vehicle).model}`}
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
                  <h3 className="text-lg font-medium mb-4">Informations sur l'Assurance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Véhicule</label>
                      {editMode && editedInsurance ? (
                        <select
                          name="vehicle"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance?.vehicle ? (typeof editedInsurance.vehicle === 'object' ? editedInsurance.vehicle._id : editedInsurance.vehicle) : ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, vehicle: e.target.value })}
                        >
                          <option value="">Sélectionner un véhicule</option>
                          {vehicles.map(v => (
                            <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-1 font-medium">
                          {typeof selectedInsurance.vehicle === 'object' && selectedInsurance.vehicle ? `${selectedInsurance.vehicle.model} (${selectedInsurance.vehicle.licensePlate})` : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Compagnie</label>
                      {editMode && editedInsurance ? (
                        <input
                          type="text"
                          name="company"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance.company || ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, company: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInsurance.company}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Numéro de Police</label>
                      {editMode && editedInsurance ? (
                        <input
                          type="text"
                          name="policyNumber"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance.policyNumber || ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, policyNumber: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInsurance.policyNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date d'Opération</label>
                      {editMode && editedInsurance ? (
                        <DatePicker
                          selected={editedInsurance.operationDate ? new Date(editedInsurance.operationDate) : null}
                          onChange={(date) => setEditedInsurance({ ...editedInsurance, operationDate: date ? date.toISOString().split('T')[0] : '' })}
                          dateFormat="dd/MM/yyyy"
                          locale="fr"
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formatDateToFrench(selectedInsurance.operationDate)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date de Début</label>
                      {editMode && editedInsurance ? (
                        <DatePicker
                          selected={editedInsurance.startDate ? new Date(editedInsurance.startDate) : null}
                          onChange={(date) => setEditedInsurance({ ...editedInsurance, startDate: date ? date.toISOString().split('T')[0] : '' })}
                          dateFormat="dd/MM/yyyy"
                          locale="fr"
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formatDateToFrench(selectedInsurance.startDate)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Durée</label>
                      {editMode && editedInsurance ? (
                        <input
                          type="number"
                          name="duration"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance.duration || ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, duration: Number(e.target.value) })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInsurance.duration} mois</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date de Fin</label>
                      {editMode && editedInsurance ? (
                        <DatePicker
                          selected={editedInsurance.endDate ? new Date(editedInsurance.endDate) : null}
                          onChange={(date) => setEditedInsurance({ ...editedInsurance, endDate: date ? date.toISOString().split('T')[0] : '' })}
                          dateFormat="dd/MM/yyyy"
                          locale="fr"
                          className="mt-1 w-full border rounded-lg p-2"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formatDateToFrench(selectedInsurance.endDate)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Prix</label>
                      {editMode && editedInsurance ? (
                        <input
                          type="number"
                          name="price"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance.price || ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, price: Number(e.target.value) })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInsurance.price.toLocaleString('fr-FR')} DH</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Contact</label>
                      {editMode && editedInsurance ? (
                        <input
                          type="text"
                          name="contactInfo"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance.contactInfo || ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, contactInfo: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{selectedInsurance.contactInfo || 'N/A'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Observation</label>
                      {editMode && editedInsurance ? (
                        <textarea
                          name="observation"
                          className="mt-1 w-full border rounded-lg p-2"
                          value={editedInsurance.observation || ''}
                          onChange={(e) => setEditedInsurance({ ...editedInsurance, observation: e.target.value })}
                          rows={3}
                        ></textarea>
                      ) : (
                        <p className="mt-1 font-medium">{selectedInsurance.observation || 'Aucune observation'}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium mb-4">Documents Associés</h3>
                  {editMode && editedInsurance ? (
                    <FileUploader
                      api_url={API_URL}
                      existingDocuments={editedInsurance.documents || []}
                      newFiles={newAttachmentFiles}
                      onNewFilesChange={setNewAttachmentFiles}
                      onRemoveExistingDocument={handleRemoveExistingDocument}
                    />
                  ) : (
                    selectedInsurance.documents && selectedInsurance.documents.length > 0 ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={selectedInsurance.documents}
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
                  Aucune assurance sélectionnée
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une assurance pour voir ses détails
                </p>
                <button
                  onClick={() => {
                    setSelectedInsurance(null);
                    setShowNewInsuranceModal(true);
                    setNewAttachmentFiles([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter une Assurance
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewInsuranceModal && (
        <InsuranceForm
          onSubmit={handleAddInsurance}
          onClose={() => setShowNewInsuranceModal(false)}
          initialData={null}
          vehicles={vehicles}
          selectedInsurance={selectedInsurance}
          setSelectedInsurance={setSelectedInsurance}
          setEditedInsurance={setEditedInsurance}
          newAttachmentFiles={newAttachmentFiles}
          setNewAttachmentFiles={setNewAttachmentFiles}
          API_URL_INSURANCES={API_URL_INSURANCES}
          API_URL={API_URL}
          handleRemoveExistingDocument={handleRemoveExistingDocument}
        />
      )}

      {showDeleteConfirmation && selectedInsurance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer l'assurance pour le véhicule "{selectedInsurance.vehicle && typeof selectedInsurance.vehicle === 'object' ? selectedInsurance.vehicle.licensePlate : 'N/A'}" ?</p>
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
                onClick={handleDeleteInsurance}
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

const InsuranceForm = ({
  onSubmit,
  onClose,
  initialData,
  vehicles,
  selectedInsurance,
  setSelectedInsurance,
  setEditedInsurance,
  newAttachmentFiles,
  setNewAttachmentFiles,
  API_URL_INSURANCES,
  API_URL,
  handleRemoveExistingDocument
}: {
  onSubmit: (data: Partial<Insurance>) => void;
  onClose: () => void;
  initialData: Insurance | null;
  vehicles: Vehicle[];
  selectedInsurance: Insurance | null;
  setSelectedInsurance: React.Dispatch<React.SetStateAction<Insurance | null>>;
  setEditedInsurance: React.Dispatch<React.SetStateAction<Insurance | null>>;
  newAttachmentFiles: File[];
  setNewAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  API_URL_INSURANCES: string;
  API_URL: string;
  handleRemoveExistingDocument: (docToRemove: Document) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<Partial<Omit<Insurance, 'vehicle'> & { vehicle?: string | null }>>(() => {
    if (initialData) {
      const vehicleId = typeof initialData.vehicle === 'object' && initialData.vehicle !== null
        ? initialData.vehicle._id
        : initialData.vehicle;
      return {
        ...initialData,
        operationDate: initialData.operationDate ? new Date(initialData.operationDate).toISOString().split('T')[0] : '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        vehicle: vehicleId,
        documents: initialData.documents || [],
      };
    }
    return {
      company: '',
      policyNumber: '',
      operationDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      duration: 12,
      endDate: '',
      price: 0,
      contactInfo: '',
      observation: '',
      vehicle: undefined,
      attachments: [],
      documents: [],
    };
  });

      const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

      useEffect(() => {
        if (formData.startDate && formData.duration !== undefined && formData.duration !== null) {
          const start = new Date(formData.startDate);
          if (!isNaN(start.getTime())) {
            const newEndDate = new Date(start);
            newEndDate.setMonth(newEndDate.getMonth() + formData.duration);
            setFormData(prev => ({ ...prev, endDate: newEndDate.toISOString().split('T')[0] }));
          } else {
            setFormData(prev => ({ ...prev, endDate: '' }));
          }
        } else {
          setFormData(prev => ({ ...prev, endDate: '' }));
        }
      }, [formData.startDate, formData.duration]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (['company', 'policyNumber', 'contactInfo', 'observation'].includes(name)) {
          if (value.trim() === '') {
            setValidationErrors(prev => ({ ...prev, [name]: 'Ce champ ne peut pas contenir uniquement des espaces.' }));
          } else {
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
        if (!selectedInsurance) return;

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
        if ((formData.company ?? '').trim() === '') errors.company = 'La compagnie ne peut pas être vide.';
        if ((formData.policyNumber ?? '').trim() === '') errors.policyNumber = 'Le numéro de police ne peut pas être vide.';
        if ((formData.contactInfo ?? '').trim() === '') errors.contactInfo = 'Les informations de contact ne peuvent pas être vides.';
        if ((formData.observation ?? '').trim() === '') errors.observation = 'L\'observation ne peut pas être vide.';
        if (formData.duration !== undefined && formData.duration !== null && formData.duration < 1) errors.duration = 'La durée ne peut pas être inférieure à 1.';
        if (formData.price !== undefined && formData.price !== null && formData.price < 1) errors.price = 'Le prix ne peut pas être inférieur à 1.';

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
          toast.error('Veuillez corriger les erreurs de validation.');
          return;
        }

        onSubmit({
          ...formData,
          vehicle: formData.vehicle,
        } as Partial<Insurance>);
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <CloseButton onClick={onClose} />
            <h2 className="text-xl font-bold mb-4">{initialData ? 'Modifier' : 'Nouvelle'} Assurance</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informations sur l'Assurance</h3>
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
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>{v.licensePlate} - {v.model}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Compagnie</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company || ''}
                      onChange={handleChange}
                      className={`w-full border rounded-lg p-2 ${validationErrors.company ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="Nom de la compagnie"
                      required
                    />
                    {validationErrors.company && <p className="text-red-500 text-xs mt-1">{validationErrors.company}</p>}
                  </div>

                  <div>
                    <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-1">Numéro de Police</label>
                    <input
                      type="text"
                      id="policyNumber"
                      name="policyNumber"
                      value={formData.policyNumber || ''}
                      onChange={handleChange}
                      className={`w-full border rounded-lg p-2 ${validationErrors.policyNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="Numéro de police"
                      required
                    />
                    {validationErrors.policyNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.policyNumber}</p>}
                  </div>

                  <div>
                    <label htmlFor="operationDate" className="block text-sm font-medium text-gray-700 mb-1">Date d'Opération</label>
                    <DatePicker
                      id="operationDate"
                      selected={formData.operationDate ? new Date(formData.operationDate) : null}
                      onChange={(date) => handleDateChange(date, 'operationDate')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Début</label>
                    <DatePicker
                      id="startDate"
                      selected={formData.startDate ? new Date(formData.startDate) : null}
                      onChange={(date) => handleDateChange(date, 'startDate')}
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
                      value={formData.duration || ''}
                      onChange={handleChange}
                      placeholder="Durée en mois"
                      className={`w-full border rounded-lg p-2 ${validationErrors.duration ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      required
                    />
                    {validationErrors.duration && <p className="text-red-500 text-xs mt-1">{validationErrors.duration}</p>}
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Fin</label>
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
                      value={formData.price || ''}
                      onChange={handleChange}
                      placeholder="Prix"
                      className={`w-full border rounded-lg p-2 ${validationErrors.price ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      required
                    />
                    {validationErrors.price && <p className="text-red-500 text-xs mt-1">{validationErrors.price}</p>}
                  </div>

                  <div>
                    <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">Informations de Contact</label>
                    <input
                      type="text"
                      id="contactInfo"
                      name="contactInfo"
                      value={formData.contactInfo || ''}
                      onChange={handleChange}
                      placeholder="Téléphone, Email, etc."
                      className={`w-full border rounded-lg p-2 ${validationErrors.contactInfo ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                    {validationErrors.contactInfo && <p className="text-red-500 text-xs mt-1">{validationErrors.contactInfo}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
                    <textarea
                      id="observation"
                      name="observation"
                      value={formData.observation || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Notes ou observations supplémentaires"
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
                  {initialData ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    export default VehicleInsurance;
