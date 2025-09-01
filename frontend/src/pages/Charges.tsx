import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Filter, FileText, Calendar, CheckCircle, Trash2, Car, AlertTriangle
} from 'lucide-react';
import EditButton from '../components/EditButton';
import { X } from 'lucide-react';
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

interface Charge {
  _id: string;
  motif: string;
  date: string;
  montant: number;
  observation: string;
  attachments: string[];
  documents?: Document[];
}

const API_URL = 'http://localhost:5000';

const Charges = () => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [showNewChargeModal, setShowNewChargeModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedCharge, setEditedCharge] = useState<Charge | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);

  const API_URL_CHARGES = `${API_URL}/api/charges`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chargesRes = await axios.get<Charge[]>(API_URL_CHARGES);
      setCharges(chargesRes.data);
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
    if (selectedCharge && !editMode) {
      const docs: Document[] = [];
      if (selectedCharge.attachments && Array.isArray(selectedCharge.attachments)) {
        selectedCharge.attachments.forEach(attachment => {
          const name = attachment.split(/-(.+)/)[1];
          docs.push({
            name: name,
            url: attachment,
            type: getMimeType(name),
            size: 0,
          });
        });
      }
      if (JSON.stringify(selectedCharge.documents) !== JSON.stringify(docs)) {
        setSelectedCharge(prev => ({ ...prev!, documents: docs }));
      }
    }
  }, [selectedCharge, editMode]);

  const filteredCharges = charges.filter(charge => {
    const matchesSearch =
      charge.motif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.observation.toLowerCase().includes(searchTerm.toLowerCase());

    const chargeDate = new Date(charge.date);
    const matchesStartDate = startDateFilter ? chargeDate >= startDateFilter : true;
    const matchesEndDate = endDateFilter ? chargeDate >= endDateFilter : true; // Changed to >= for consistency

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const handleAddCharge = async (data: Partial<Charge>) => {
    const formData = new FormData();

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key as keyof typeof data];
        if (key !== '_id' && key !== 'documents' && key !== 'attachments' && value !== null && value !== undefined) {
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
      const response = await axios.post<Charge>(API_URL_CHARGES, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const newCharge = response.data;
      setCharges([...charges, newCharge]);
      setShowNewChargeModal(false);
      toast.success('Charge added successfully.');
      setNewAttachmentFiles([]);
      window.dispatchEvent(new Event('chargeUpdated')); // Dispatch event
    } catch (err) {
      console.error('Error adding charge:', err);
      toast.error('Failed to add charge.');
    }
  };

  const handleUpdateCharge = async (data: Partial<Charge>) => {
    if (!selectedCharge || !editedCharge) return;

    if (isOnlySpaces(editedCharge.motif)) {
      toast.error('Le motif ne peut pas contenir uniquement des espaces.');
      return;
    }
    if (editedCharge.observation && isOnlySpaces(editedCharge.observation)) {
      toast.error('L\'observation ne peut pas contenir uniquement des espaces.');
      return;
    }
    if (editedCharge.montant !== undefined && editedCharge.montant < 0) {
      toast.error('Le montant ne peut pas être inférieur à 0.');
      return;
    }

    const formData = new FormData();

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key as keyof typeof data];
        if (key !== '_id' && key !== 'documents' && key !== 'attachments' && value !== null && value !== undefined) {
          formData.append(key, value as any);
        }
      }
    }

    const existingDocsToKeep = editedCharge?.documents?.filter(doc => !doc.isNew) || [];
    formData.append('existingDocuments', JSON.stringify(existingDocsToKeep));

    if (newAttachmentFiles.length > 0) {
      newAttachmentFiles.forEach(file => {
        formData.append('attachments', file);
      });
    }

    try {
      const response = await axios.put<Charge>(`${API_URL_CHARGES}/${selectedCharge._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedCharge = response.data;
      setCharges(charges.map(c => (c._id === updatedCharge._id ? updatedCharge : c)));
      setSelectedCharge(updatedCharge);
      setEditMode(false);
      toast.success('Charge updated successfully.');
      setNewAttachmentFiles([]);
      window.dispatchEvent(new Event('chargeUpdated')); // Dispatch event
    } catch (err) {
      console.error('Error updating charge:', err);
      toast.error('Failed to update charge.');
    }
  };

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteConfirmation = (chargeId: string) => {
    setSelectedCharge(charges.find(a => a._id === chargeId) || null);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteCharge = async () => {
    if (selectedCharge) {
      try {
        await axios.delete(`${API_URL_CHARGES}/${selectedCharge._id}`);
        setCharges(charges.filter(a => a._id !== selectedCharge._id));
        setSelectedCharge(null);
        setShowDeleteConfirmation(false);
        toast.success('Charge deleted successfully.');
      } catch (err) {
        console.error('Error deleting charge:', err);
        toast.error('Failed to delete charge.');
      }
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!selectedCharge) return;
    try {
      await axios.delete(`${API_URL_CHARGES}/${selectedCharge._id}/documents`, {
        data: { documentName: docToRemove.name }
      });
      setSelectedCharge(prev => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading charges...</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Charges</h1>
        <button
          onClick={() => {
            setSelectedCharge(null);
            setShowNewChargeModal(true);
            setNewAttachmentFiles([]);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Charge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charges List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  id="search-charge"
                  type="text"
                  placeholder="Rechercher une charge..."
                  className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="start-date-filter" className="sr-only">Date de début</label>
                  <DatePicker
                    id="start-date-filter"
                    selected={startDateFilter}
                    onChange={(date: Date | null) => setStartDateFilter(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="fr"
                    showPopperArrow={false}
                    placeholderText="Date de début"
                    className="border rounded-lg p-2 w-full"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="end-date-filter" className="sr-only">Date de fin</label>
                  <DatePicker
                    id="end-date-filter"
                    selected={endDateFilter}
                    onChange={(date: Date | null) => setEndDateFilter(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="fr"
                    showPopperArrow={false}
                    placeholderText="Date de fin"
                    className="border rounded-lg p-2 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charge
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCharges.map((charge) => (
                  <tr
                    key={charge._id}
                    onClick={() => setSelectedCharge(charge)}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedCharge?._id === charge._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Car size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {charge.motif}
                          </div>
                          <div className="text-xs text-gray-500">
                            {charge.observation || 'Aucune observation'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {formatDateToFrench(charge.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {charge.montant.toLocaleString('fr-FR')} DH
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedCharge(charge);
                          setEditMode(true);
                          const existingDocs: Document[] = (charge.attachments || []).map(att => ({
                            name: att.split(/-(.+)/)[1],
                            url: att,
                            type: '',
                            size: 0,
                            isNew: false,
                          }));
                          setEditedCharge({ ...charge, documents: existingDocs });
                          setNewAttachmentFiles([]);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConfirmation(charge._id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {charges.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Aucune charge trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charge Details Panel */}
        <div className="lg:col-span-1">
          {selectedCharge ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de la charge</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editedCharge) handleUpdateCharge(editedCharge);
                      }}
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
                      const existingDocs: Document[] = (selectedCharge.attachments || []).map(att => ({
                        name: att.split(/-(.+)/)[1],
                        url: att,
                        type: '',
                        size: 0,
                        isNew: false,
                      }));
                      setEditedCharge({ ...selectedCharge, documents: existingDocs });
                      setNewAttachmentFiles([]);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Motif</p>
                  {editMode && editedCharge ? (
                    <input
                      type="text"
                      name="motif"
                      value={editedCharge.motif || ''}
                      onChange={(e) => setEditedCharge({ ...editedCharge, motif: e.target.value })}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedCharge.motif || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  {editMode && editedCharge ? (
                    <DatePicker
                      selected={editedCharge.date ? new Date(editedCharge.date) : null}
                      onChange={(date: Date | null) => setEditedCharge({ ...editedCharge, date: date ? date.toISOString().split('T')[0] : '' })}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{formatDateToFrench(selectedCharge.date) || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  {editMode && editedCharge ? (
                    <input
                      type="number"
                      name="montant"
                      value={editedCharge.montant || 0}
                      onChange={(e) => setEditedCharge({ ...editedCharge, montant: Number(e.target.value) })}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedCharge.montant?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Observation</p>
                  {editMode && editedCharge ? (
                    <textarea
                      name="observation"
                      value={editedCharge.observation || ''}
                      onChange={(e) => setEditedCharge({ ...editedCharge, observation: e.target.value })}
                      rows={3}
                      className="w-full border rounded-lg p-2 mt-1"
                    ></textarea>
                  ) : (
                    <p className="font-medium">{selectedCharge.observation || 'Aucune observation'}</p>
                  )}
                </div>

                {/* Pièces Jointes */}
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-2">Pièces Jointes:</h4>
                  {editMode && editedCharge ? (
                    <FileUploader
                      api_url={API_URL}
                      existingDocuments={editedCharge.documents || []}
                      newFiles={newAttachmentFiles}
                      onNewFilesChange={setNewAttachmentFiles}
                      onRemoveExistingDocument={handleRemoveExistingDocument}
                    />
                  ) : (
                    selectedCharge.documents && selectedCharge.documents.length > 0 ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={selectedCharge.documents}
                        newFiles={[]}
                        onNewFilesChange={() => {}}
                        onRemoveExistingDocument={handleRemoveExistingDocument}
                        label=""
                        readOnly={true}
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md flex flex-col items-center justify-center text-center">
                        <AlertTriangle size={24} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Aucun document associé.</p>
                      </div>
                    )
                  )}
                </div>

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
                <AlertTriangle size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucune charge sélectionnée
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une charge pour voir ses détails
                </p>
                <button
                  onClick={() => {
                    setSelectedCharge(null);
                    setShowNewChargeModal(true);
                    setNewAttachmentFiles([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouvelle Charge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewChargeModal && (
        <ChargeForm
          onSubmit={handleAddCharge}
          onClose={() => setShowNewChargeModal(false)}
          initialData={null}
          newAttachmentFiles={newAttachmentFiles}
          setNewAttachmentFiles={setNewAttachmentFiles}
          API_URL={API_URL}
          handleRemoveExistingDocument={handleRemoveExistingDocument}
        />
      )}

      {showDeleteConfirmation && selectedCharge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer la charge "{selectedCharge.motif}" ?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteCharge}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
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

const ChargeForm = ({
  onSubmit,
  onClose,
  initialData,
  newAttachmentFiles,
  setNewAttachmentFiles,
  API_URL,
  handleRemoveExistingDocument
}: {
  onSubmit: (data: Partial<Charge>) => void;
  onClose: () => void;
  initialData: Charge | null;
  newAttachmentFiles: File[];
  setNewAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  API_URL: string;
  handleRemoveExistingDocument: (docToRemove: Document) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<Partial<Charge>>(() => {
    if (initialData) {
      return {
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        documents: initialData.documents || [],
      };
    }
    return {
      motif: '',
      date: new Date().toISOString().split('T')[0],
      montant: 0,
      observation: '',
      attachments: [],
      documents: [],
    };
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (['motif', 'observation'].includes(name)) {
      if (isOnlySpaces(value)) {
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
      if (isNaN(numValue) || numValue < 0) { // Changed from < 1 to < 0 to allow 0
        setValidationErrors(prev => ({ ...prev, [name]: 'La valeur ne peut pas être inférieure à 0.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'montant' ? parseFloat(value) : value
    }));
  };

  const handleDateChange = (date: Date | null, name: string) => {
    setFormData(prev => ({ ...prev, [name]: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: {[key: string]: string} = {};
    if (isOnlySpaces(formData.motif)) {
      errors.motif = 'Le motif ne peut pas contenir uniquement des espaces.';
    }
    if (formData.observation && isOnlySpaces(formData.observation)) {
      errors.observation = 'L\'observation ne peut pas contenir uniquement des espaces.';
    }
    if (formData.montant !== undefined && formData.montant < 0) {
      errors.montant = 'Le montant ne peut pas être inférieur à 0.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{initialData ? 'Modifier' : 'Nouvelle'} Charge</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Informations sur la Charge</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="motif" className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <input
                  type="text"
                  id="motif"
                  name="motif"
                  value={formData.motif || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Motif de la charge"
                  required
                />
                {validationErrors.motif && <p className="text-red-500 text-xs mt-1">{validationErrors.motif}</p>}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <DatePicker
                  id="date"
                  selected={formData.date ? new Date(formData.date) : null}
                  onChange={(date) => handleDateChange(date, 'date')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholderText="Sélectionner une date"
                  required
                />
              </div>

              <div>
                <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">Montant (DH)</label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={formData.montant || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                {validationErrors.montant && <p className="text-red-500 text-xs mt-1">{validationErrors.montant}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
                <textarea
                  id="observation"
                  name="observation"
                  value={formData.observation || ''}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Notes ou observations supplémentaires"
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
            onRemoveExistingDocument={handleRemoveExistingDocument}
          />

          <div className="flex justify-end space-x-4">
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
              {initialData ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Charges;
