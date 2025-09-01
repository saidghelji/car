import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Trash2, Car, 
  AlertTriangle
} from 'lucide-react';
import { X } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import EditButton from '../components/EditButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Contract } from './Contrats'; // Import Contract type
import { Customer } from './Customers'; // Import Customer type
import { Vehicle } from './Vehicles'; // Import Vehicle type
import FileUploader from '../components/FileUploader';
import { Document } from '../components/FileUploader';

registerLocale('fr', fr);

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

// Define types
type AccidentState = 'expertise' | 'en_cours' | 'repare';

export interface Accident {
  _id: string; // Changed from 'id' to '_id' for MongoDB
  contrat: Contract | string;
  numeroContrat: string;
  dateSortie: string;
  client: Customer | string;
  clientNom: string;
  dateRetour: string;
  matricule: string;
  vehicule: Vehicle | string;
  dateAccident: string;
  heureAccident: string;
  lieuAccident: string;
  description: string;
  etat: AccidentState;
  dateEntreeGarage?: string;
  dateReparation?: string;
  montantReparation?: number;
  fraisClient?: number;
  indemniteAssurance?: number;
  avance?: number;
  piecesJointes: string[];
  documents?: Document[];
  createdAt: string; // Add timestamps
  updatedAt: string; // Add timestamps
}

// List of Moroccan cities (can remain hardcoded as it's static)
const moroccanCities = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir',
  'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'El Jadida',
  'Mohammedia', 'Béni Mellal', 'Nador', 'Taza', 'Khémisset',
  'Settat', 'Berrechid', 'Khénifra', 'Larache', 'Guelmim',
  'Khouribga', 'Ouarzazate', 'Essaouira', 'Dakhla', 'Laâyoune'
];

// Accident state options (can remain hardcoded as it's static)
const accidentStateOptions = [
  { value: 'expertise', label: 'Expertise' },
  { value: 'en_cours', label: 'En cours de réparation' },
  { value: 'repare', label: 'Réparé' },
];

// Get accident state label
const getAccidentStateLabel = (state: AccidentState): string => {
  return accidentStateOptions.find(s => s.value === state)?.label || state;
};

// Format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};

const API_URL = 'http://localhost:5000';

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
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};

const AccidentForm = ({
  onSubmit,
  onClose,
  initialData = null,
  contracts,
  newAttachmentFiles,
  setNewAttachmentFiles,
  handleRemoveExistingDocument,
}: {
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  initialData?: Accident | null;
  contracts: Contract[];
  newAttachmentFiles: File[];
  setNewAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleRemoveExistingDocument: (docToRemove: Document) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<Partial<Accident>>(() => {
    if (initialData) {
      return {
        ...initialData,
        dateAccident: initialData.dateAccident ? new Date(initialData.dateAccident).toISOString().split('T')[0] : '',
        dateEntreeGarage: initialData.dateEntreeGarage ? new Date(initialData.dateEntreeGarage).toISOString().split('T')[0] : undefined,
        dateReparation: initialData.dateReparation ? new Date(initialData.dateReparation).toISOString().split('T')[0] : undefined,
        documents: initialData.documents || [],
      };
    }
    return {
      contrat: '',
      numeroContrat: '',
      dateSortie: '',
      client: '',
      clientNom: '',
      dateRetour: '',
      matricule: '',
      vehicule: '',
      dateAccident: new Date().toISOString().split('T')[0],
      heureAccident: '',
      lieuAccident: '',
      description: '',
      etat: 'expertise',
      piecesJointes: [],
      documents: [],
    };
  });

  const [selectedContrat, setSelectedContrat] = useState<Contract | null>(initialData ?
    contracts.find(c => c._id === (initialData.contrat as any)) || null : null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    if (selectedContrat) {
      const client = selectedContrat.client as Customer;
      const vehicle = selectedContrat.vehicle as Vehicle;
      setFormData(prev => ({
        ...prev,
        contrat: selectedContrat._id,
        numeroContrat: selectedContrat.contractNumber,
        dateSortie: selectedContrat.departureDate,
        dateRetour: selectedContrat.returnDate,
        client: client?._id || '',
        clientNom: client ? `${client.prenomFr} ${client.nomFr}` : '',
        matricule: vehicle?.licensePlate || '',
        vehicule: vehicle ? vehicle._id : '',
      }));
    }
  }, [selectedContrat]);

  const handleContratChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contratId = e.target.value;
    const selected = contracts.find(c => c._id === contratId);
    setSelectedContrat(selected || null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'description') {
      if (value && isOnlySpaces(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: 'La description ne peut pas contenir uniquement des espaces.' }));
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
    if (formData.description && isOnlySpaces(formData.description)) {
      errors.description = 'La description ne peut pas contenir uniquement des espaces.';
    }
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    const finalFormData = new FormData();
  
    // Only append necessary fields for creation
    finalFormData.append('contrat', (formData.contrat as any)?._id || formData.contrat || '');
    finalFormData.append('dateAccident', formData.dateAccident || '');
    finalFormData.append('heureAccident', formData.heureAccident || '');
    finalFormData.append('lieuAccident', formData.lieuAccident || '');
    finalFormData.append('description', formData.description || '');
    finalFormData.append('etat', formData.etat || 'expertise');
    if (formData.dateEntreeGarage) finalFormData.append('dateEntreeGarage', formData.dateEntreeGarage);
    if (formData.dateReparation) finalFormData.append('dateReparation', formData.dateReparation);
    if (formData.montantReparation) finalFormData.append('montantReparation', formData.montantReparation.toString());
    if (formData.fraisClient) finalFormData.append('fraisClient', formData.fraisClient.toString());
    if (formData.indemniteAssurance) finalFormData.append('indemniteAssurance', formData.indemniteAssurance.toString());
    if (formData.avance) finalFormData.append('avance', formData.avance.toString());
  
    if (newAttachmentFiles.length > 0) {
      newAttachmentFiles.forEach(file => {
        finalFormData.append('attachments', file);
      });
    }
    onSubmit(finalFormData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{initialData ? 'Modifier' : 'Nouvel'} Accident</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h3 className="font-semibold mb-3">Informations sur le Contrat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contratId" className="block text-sm font-medium text-gray-700 mb-1">N° Contrat</label>
                <select
                  id="contratId"
                  name="contrat"
                  value={selectedContrat?._id || ''}
                  onChange={handleContratChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Sélectionner un contrat</option>
                  {contracts.map(c => <option key={c._id} value={c._id}>{c.contractNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  type="text"
                  value={selectedContrat ? `${(selectedContrat.client as Customer)?.prenomFr} ${(selectedContrat.client as Customer)?.nomFr}` : ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                <input
                  type="text"
                  value={selectedContrat ? `${(selectedContrat.vehicle as Vehicle)?.brand} ${(selectedContrat.vehicle as Vehicle)?.model} (${(selectedContrat.vehicle as Vehicle)?.licensePlate})` : ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie</label>
                <input
                  type="text"
                  value={selectedContrat ? formatDate(selectedContrat.departureDate) : ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour</label>
                <input
                  type="text"
                  value={selectedContrat ? formatDate(selectedContrat.returnDate) : ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                  readOnly
                />
              </div>
            </div>
          </section>
          <section>
            <h3 className="font-semibold mb-3">Détails de l'Accident</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dateAccident" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <DatePicker
                  id="dateAccident"
                  selected={formData.dateAccident ? new Date(formData.dateAccident) : null}
                  onChange={(date) => handleDateChange(date, 'dateAccident')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  required
                />
              </div>
              <div>
                <label htmlFor="heureAccident" className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                <input
                  type="time"
                  id="heureAccident"
                  name="heureAccident"
                  value={formData.heureAccident || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  required
                />
              </div>
              <div>
                <label htmlFor="lieuAccident" className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <select
                  id="lieuAccident"
                  name="lieuAccident"
                  value={formData.lieuAccident || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  required
                >
                  <option value="">Sélectionner une ville</option>
                  {moroccanCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 ${validationErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                ></textarea>
                {validationErrors.description && <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>}
              </div>
              <div>
                <label htmlFor="etat" className="block text-sm font-medium text-gray-700 mb-1">État</label>
                <select
                  id="etat"
                  name="etat"
                  value={formData.etat || 'expertise'}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  {accidentStateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
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
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{initialData ? 'Mettre à jour' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Accidents: React.FC = () => {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedAccident, setEditedAccident] = useState<Accident | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);

  const API_URL_ACCIDENTS = `${API_URL}/api/accidents`;
  const API_URL_CONTRACTS = `${API_URL}/api/contracts`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accidentsRes, contractsRes] = await Promise.all([
        axios.get<Accident[]>(API_URL_ACCIDENTS),
        axios.get<Contract[]>(API_URL_CONTRACTS)
      ]);
      setAccidents(accidentsRes.data);
      setContracts(contractsRes.data);
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

  const filteredAccidents = accidents.filter(accident =>
    (accident.numeroContrat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (accident.clientNom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (accident.matricule || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (accident.lieuAccident || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAccident = async (data: FormData) => {
    try {
      const response = await axios.post<Accident>(API_URL_ACCIDENTS, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAccidents([...accidents, response.data]);
      setShowForm(false);
      toast.success('Accident ajouté avec succès.');
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error('Error adding accident:', err);
      toast.error('Échec de l\'ajout de l\'accident.');
    }
  };

  const handleUpdateAccident = async () => {
    if (!editedAccident) return;
  
    const formData = new FormData();
    
    // Append all editable fields
    formData.append('contrat', typeof editedAccident.contrat === 'object' ? (editedAccident.contrat as Contract)._id : editedAccident.contrat || '');
    formData.append('dateAccident', editedAccident.dateAccident || '');
    formData.append('heureAccident', editedAccident.heureAccident || '');
    formData.append('lieuAccident', editedAccident.lieuAccident || '');
    formData.append('description', editedAccident.description || '');
    formData.append('etat', editedAccident.etat || 'expertise');
    if (editedAccident.dateEntreeGarage) formData.append('dateEntreeGarage', editedAccident.dateEntreeGarage);
    if (editedAccident.dateReparation) formData.append('dateReparation', editedAccident.dateReparation);
    if (editedAccident.montantReparation) formData.append('montantReparation', editedAccident.montantReparation.toString());
    if (editedAccident.fraisClient) formData.append('fraisClient', editedAccident.fraisClient.toString());
    if (editedAccident.indemniteAssurance) formData.append('indemniteAssurance', editedAccident.indemniteAssurance.toString());
    if (editedAccident.avance) formData.append('avance', editedAccident.avance.toString());
  
    const existingDocsToKeep = editedAccident.documents?.filter(doc => !doc.isNew) || [];
    formData.append('existingDocuments', JSON.stringify(existingDocsToKeep));
  
    if (newAttachmentFiles.length > 0) {
      newAttachmentFiles.forEach(file => {
        formData.append('attachments', file);
      });
    }
  
    try {
      const response = await axios.put<Accident>(`${API_URL_ACCIDENTS}/${editedAccident._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedAccident = response.data;
      setAccidents(accidents.map(a => (a._id === updatedAccident._id ? updatedAccident : a)));
      setSelectedAccident(updatedAccident);
      setEditMode(false);
      toast.success('Accident mis à jour avec succès.');
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error('Error updating accident:', err);
      toast.error('Échec de la mise à jour de l\'accident.');
    }
  };

  const handleDeleteAccident = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet accident ?')) {
      try {
        await axios.delete(`${API_URL_ACCIDENTS}/${id}`);
        setAccidents(accidents.filter(a => a._id !== id));
        if (selectedAccident?._id === id) {
          setSelectedAccident(null);
        }
        toast.success('Accident supprimé avec succès.');
      } catch (err) {
        console.error('Error deleting accident:', err);
        toast.error('Échec de la suppression de l\'accident.');
      }
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!selectedAccident) return;
    try {
      await axios.delete(`${API_URL_ACCIDENTS}/${selectedAccident._id}/documents`, {
        data: { documentUrl: docToRemove.url }
      });
      const updateDocs = (prev: Accident | null) => {
        if (!prev) return null;
        return {
          ...prev,
          documents: prev.documents?.filter(doc => doc.url !== docToRemove.url),
          piecesJointes: prev.piecesJointes?.filter(att => att !== docToRemove.url),
        };
      };
      setSelectedAccident(updateDocs);
      if (editMode) {
        setEditedAccident(updateDocs);
      }
      toast.success('Document supprimé avec succès.');
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      toast.error('Échec de la suppression du document.');
    }
  };

  const handleEditClick = () => {
    if (selectedAccident) {
      const existingDocs: Document[] = (selectedAccident.documents || []).map(doc => ({ ...doc, isNew: false }));
      setEditedAccident({ ...selectedAccident, documents: existingDocs });
      setNewAttachmentFiles([]);
      setEditMode(true);
    }
  };

  const handleViewDetails = (accident: Accident) => {
    if (editMode && selectedAccident?._id !== accident._id) {
      if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
        setSelectedAccident(accident);
        setEditMode(false);
        setEditedAccident(null);
        setNewAttachmentFiles([]);
      }
    } else if (!editMode) {
      setSelectedAccident(accident);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Accidents</h1>
        <button
          onClick={() => {
            setSelectedAccident(null);
            setEditedAccident(null);
            setShowForm(true);
            setNewAttachmentFiles([]);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvel Accident
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un accident..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrat</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Accident</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccidents.map((accident) => (
                  <tr
                    key={accident._id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedAccident?._id === accident._id
                        ? editMode
                          ? 'bg-blue-100'
                          : 'bg-blue-50'
                        : ''
                    }`}
                    onClick={() => handleViewDetails(accident)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{accident.numeroContrat}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{accident.clientNom}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{accident.matricule}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(accident.dateAccident)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        accident.etat === 'expertise' ? 'bg-yellow-100 text-yellow-800' :
                        accident.etat === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getAccidentStateLabel(accident.etat)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton onClick={(e) => { e.stopPropagation(); setSelectedAccident(accident); handleEditClick(); }} size="md" className="mr-3" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteAccident(accident._id); }}
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

        <div className="lg:col-span-1">
          {selectedAccident ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de l'accident</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir annuler les modifications ?')) {
                          setEditMode(false);
                          setEditedAccident(null);
                          setNewAttachmentFiles([]);
                        }
                      }}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateAccident}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Modifier
                  </button>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Contrat</p>
                  {editMode && editedAccident ? (
                    <select
                      value={typeof editedAccident.contrat === 'object' ? (editedAccident.contrat as Contract)._id : editedAccident.contrat}
                      onChange={(e) => {
                        const selectedContract = contracts.find(c => c._id === e.target.value);
                        if (selectedContract) {
                          const client = selectedContract.client as Customer;
                          const vehicle = selectedContract.vehicle as Vehicle;
                          setEditedAccident(prev => prev ? {
                            ...prev,
                            contrat: selectedContract,
                            numeroContrat: selectedContract.contractNumber,
                            client: client?._id || '',
                            clientNom: client ? `${client.prenomFr} ${client.nomFr}` : '',
                            vehicule: vehicle?._id || '',
                            matricule: vehicle?.licensePlate || '',
                          } : null);
                        }
                      }}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="">Sélectionner un contrat</option>
                      {contracts.map(c => <option key={c._id} value={c._id}>{c.contractNumber}</option>)}
                    </select>
                  ) : (
                    <p className="font-medium">{selectedAccident.numeroContrat}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="font-medium">{selectedAccident.clientNom}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Véhicule</p>
                  <p className="font-medium">{selectedAccident.matricule}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date de l'accident</p>
                  {editMode && editedAccident ? (
                    <DatePicker
                      selected={editedAccident.dateAccident ? new Date(editedAccident.dateAccident) : null}
                      onChange={(date) => setEditedAccident(prev => prev ? { ...prev, dateAccident: date ? date.toISOString() : '' } : null)}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{formatDate(selectedAccident.dateAccident)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Heure de l'accident</p>
                  {editMode && editedAccident ? (
                    <input
                      type="time"
                      value={editedAccident.heureAccident || ''}
                      onChange={(e) => setEditedAccident(prev => prev ? { ...prev, heureAccident: e.target.value } : null)}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedAccident.heureAccident}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Lieu de l'accident</p>
                  {editMode && editedAccident ? (
                    <select
                      value={editedAccident.lieuAccident || ''}
                      onChange={(e) => setEditedAccident(prev => prev ? { ...prev, lieuAccident: e.target.value } : null)}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="">Sélectionner une ville</option>
                      {moroccanCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  ) : (
                    <p className="font-medium">{selectedAccident.lieuAccident}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  {editMode && editedAccident ? (
                    <textarea
                      value={editedAccident.description || ''}
                      onChange={(e) => setEditedAccident(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={3}
                      className="w-full border rounded-lg p-2 mt-1"
                    ></textarea>
                  ) : (
                    <p className="font-medium">{selectedAccident.description || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">État</p>
                  {editMode && editedAccident ? (
                    <select
                      value={editedAccident.etat || 'expertise'}
                      onChange={(e) => setEditedAccident(prev => prev ? { ...prev, etat: e.target.value as AccidentState } : null)}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      {accidentStateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <p className="font-medium">{getAccidentStateLabel(selectedAccident.etat)}</p>
                  )}
                </div>
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-2">Documents Associés:</h4>
                  {editMode && editedAccident ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={editedAccident.documents || []}
                        newFiles={newAttachmentFiles}
                        onNewFilesChange={setNewAttachmentFiles}
                        onRemoveExistingDocument={handleRemoveExistingDocument}
                      />
                  ) : (
                    selectedAccident?.documents && selectedAccident.documents.length > 0 ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={selectedAccident.documents}
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
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <AlertTriangle size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun accident sélectionné
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez un accident pour voir ses détails
                </p>
                <button
                  onClick={() => {
                    setSelectedAccident(null);
                    setEditedAccident(null);
                    setShowForm(true);
                    setNewAttachmentFiles([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter un accident
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <AccidentForm
          onSubmit={handleAddAccident}
          onClose={() => { setShowForm(false); setEditedAccident(null); }}
          initialData={editedAccident}
          contracts={contracts.filter(c => c.client && c.vehicle)}
          newAttachmentFiles={newAttachmentFiles}
          setNewAttachmentFiles={setNewAttachmentFiles}
          handleRemoveExistingDocument={handleRemoveExistingDocument}
        />
      )}
    </div>
  );
};

export default Accidents;
