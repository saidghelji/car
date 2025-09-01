import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, UserCircle,
  Mail, Phone
} from 'lucide-react';
import EditButton from '../components/EditButton';
import CustomerForm from '../components/CustomerForm';
import ArabicKeyboard from '../components/ArabicKeyboard';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import toast from 'react-hot-toast';
import FileUploader, { Document } from '../components/FileUploader'; // Import FileUploader
import countries from '../data/countries.json'; // Import countries data

registerLocale('fr', fr);

interface Country {
  code: string;
  name: string;
}

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

// Utility function to format date from YYYY-MM-DD to jj/mm/aaaa for display
const formatDateToFrench = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Ensure the date is valid before formatting
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Define Customer type (matches backend schema, including _id and timestamps)
export interface Customer {
  _id: string; // MongoDB's unique ID
  civilite: string;
  nationalite: string;
  type: string;
  listeNoire: boolean;
  nomFr: string;
  nomAr: string;
  prenomFr: string;
  prenomAr: string;
  dateNaissance: string;
  age: string;
  lieuNaissance: string;
  cin: string;
  cinDelivreLe: string;
  cinDelivreA: string;
  cinValidite: string;
  numeroPermis: string;
  permisDelivreLe: string;
  permisDelivreA: string;
  permisValidite: string;
  numeroPasseport: string;
  passportDelivreLe: string;
  passportDelivreA: string;
  passportValidite: string;
  adresseFr: string;
  ville: string;
  adresseAr: string;
  codePostal: string;
  telephone: string;
  telephone2: string;
  fix: string;
  fax: string;
  remarque: string;
  email: string;
  documents: Document[]; // Use the imported Document interface
  ice?: string;
  totalRentals: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields as needed based on your frontend's customer data
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModalForm, setShowModalForm] = useState(false); // Only for Add Customer
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state for sidebar
  const [editMode, setEditMode] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [documentsToDelete, setDocumentsToDelete] = useState<Document[]>([]);

  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<keyof Customer | null>(null);

  const BASE_URL = 'http://localhost:5000';
  const API_URL = `${BASE_URL}/api/customers`; // Your backend API URL

  // Fetch customers from backend
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Customer[]>(API_URL);
      setCustomers(response.data);
      toast.success('Customers loaded successfully!');
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers.');
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle search
  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.prenomFr} ${customer.nomFr}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.telephone && customer.telephone.includes(searchTerm))
    );
  });

  const handleAddCustomer = async (data: any, newFiles: File[], documentsToDelete: Document[]) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      newFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await axios.post<Customer>(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCustomers(prev => [...prev, response.data]);
      setShowModalForm(false);
      toast.success('Customer added successfully!');
    } catch (err) {
      console.error('Error adding customer:', err);
      toast.error('Failed to add customer.');
    }
  };

  const handleRemoveExistingDocument = async (doc: Document) => {
    if (!editedCustomer) return; // Ensure we are in edit mode for sidebar
    setDocumentsToDelete(prev => [...prev, doc]);
    setEditedCustomer(prev => ({
      ...prev!,
      documents: prev!.documents.filter(d => d.url !== doc.url)
    }));
    toast.success(`Document ${doc.name} marked for deletion.`);
  };

  const handleNewFilesChange = (files: File[]) => {
    setNewFiles(files);
  };

  const handleSaveEdit = async () => {
    if (!editedCustomer) return;

    try {
      const formData = new FormData();
      Object.keys(editedCustomer).forEach(key => {
        if (key !== 'documents') { // Exclude documents as they are handled separately
          formData.append(key, (editedCustomer as any)[key]);
        }
      });
      newFiles.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('documentsToDelete', JSON.stringify(documentsToDelete.map(doc => doc.url)));

      const response = await axios.put<Customer>(`${API_URL}/${editedCustomer._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCustomers(customers.map(customer =>
        customer._id === editedCustomer._id ? response.data : customer
      ));
      setSelectedCustomer(response.data); // Update selected customer with fresh data
      setEditMode(false);
      setEditedCustomer(null);
      setNewFiles([]);
      setDocumentsToDelete([]);
      toast.success('Customer updated successfully!');
    } catch (err) {
      console.error('Error saving edit:', err);
      toast.error('Failed to save changes.');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedCustomer(null);
    setNewFiles([]);
    setDocumentsToDelete([]);
    setKeyboardOpen(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await axios.delete(`${API_URL}/${customerId}`);
        setCustomers(customers.filter(customer => customer._id !== customerId));
        if (selectedCustomer?._id === customerId) {
          setSelectedCustomer(null);
          setEditMode(false);
          setEditedCustomer(null);
        }
        toast.success('Customer deleted successfully!');
      } catch (err) {
        console.error('Error deleting customer:', err);
        toast.error('Failed to delete customer.');
      }
    }
  };

  const handleEditClick = () => {
    if (selectedCustomer) {
      const existingDocs: Document[] = (selectedCustomer.documents || []).map(doc => ({
        ...doc,
        type: getMimeType(doc.name),
        isNew: false,
      }));
      setEditedCustomer({ ...selectedCustomer, documents: existingDocs });
      setNewFiles([]); // Clear new files when starting edit
      setDocumentsToDelete([]); // Clear documents to delete when starting edit
      setEditMode(true);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    if (editMode) {
      if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
        const existingDocs: Document[] = (customer.documents || []).map(doc => ({
          ...doc,
          type: getMimeType(doc.name),
          isNew: false,
        }));
        setSelectedCustomer({ ...customer, documents: existingDocs });
        setEditMode(false);
        setEditedCustomer(null);
        setNewFiles([]);
        setDocumentsToDelete([]);
      }
    } else {
      const existingDocs: Document[] = (customer.documents || []).map(doc => ({
        ...doc,
        type: getMimeType(doc.name),
        isNew: false,
      }));
      setSelectedCustomer({ ...customer, documents: existingDocs });
    }
  };

  const handleInputChange = (field: keyof Customer, value: any) => {
    if (editedCustomer) {
      setEditedCustomer(prev => {
        if (!prev) return null;
        const updatedCustomer = { ...prev, [field]: value };
        return updatedCustomer;
      });
    }
  };

  const openKeyboard = (inputName: keyof Customer) => {
    setActiveInput(inputName);
    setKeyboardOpen(true);
  };

  const handleKeyboardInput = (value: string) => {
    if (activeInput && editedCustomer) {
      handleInputChange(activeInput, value);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p className="text-lg">{error}</p>
        <button
          onClick={fetchCustomers}
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients <span className="text-blue-600">({customers.length})</span></h1>
        <button
          onClick={() => {
            setSelectedCustomer(null);
            setShowModalForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Ajouter un client
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un client..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => {
                  // If in edit mode, ask for confirmation before changing search
                  if (editMode) {
                    if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
                      setSearchTerm(e.target.value);
                      setEditMode(false);
                      setEditedCustomer(null);
                      setNewFiles([]);
                      setDocumentsToDelete([]);
                    }
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {/* Customers table */}
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut du client
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedCustomer?._id === customer._id
                        ? editMode
                          ? 'bg-blue-100'
                          : 'bg-blue-50'
                        : ''
                    }`}
                    onClick={() => handleViewDetails(customer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="md:block overflow-x-auto md:overflow-visible">
                        <div className="flex items-center min-w-[220px] md:min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCircle size={24} className="text-gray-500" />
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <div className="text-sm font-medium text-gray-900">{`${customer.prenomFr} ${customer.nomFr}`}</div>
                            <div className="text-xs text-gray-500">Client depuis {formatDateToFrench(customer.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail size={14} className="mr-1 text-gray-500" /> {customer.email}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <Phone size={14} className="mr-1 text-gray-500" /> {customer.telephone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                          handleEditClick();
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer._id);
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

        {/* Customer Details */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails du client</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
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

              <div className="p-4">
                {/* Basic Info Section */}
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCircle size={32} className="text-gray-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold">{`${selectedCustomer.prenomFr} ${selectedCustomer.nomFr}`}</h3>
                    <p className="text-sm text-gray-500">Client depuis {formatDateToFrench(selectedCustomer.createdAt)}</p>
                  </div>
                </div>

                {/* Conducteur Section */}
                <div className="mt-6 border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Conducteur</p>
                  {editMode && editedCustomer ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Civilité</p>
                          <select
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.civilite || ''}
                            onChange={(e) => handleInputChange('civilite', e.target.value)}
                          >
                            <option value="">Sélectionner</option>
                            <option value="M.">M.</option>
                            <option value="Mme">Mme</option>
                            <option value="Mlle">Mlle</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <select
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.type || ''}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                          >
                            <option value="Particulier">Particulier</option>
                            <option value="Professionnel">Professionnel</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nom (FR)</p>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.nomFr || ''}
                            onChange={(e) => handleInputChange('nomFr', e.target.value)}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Prénom (FR)</p>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.prenomFr || ''}
                            onChange={(e) => handleInputChange('prenomFr', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nom (AR)</p>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.nomAr || ''}
                            onFocus={() => openKeyboard('nomAr')}
                            onChange={(e) => handleInputChange('nomAr', e.target.value)}
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Prénom (AR)</p>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.prenomAr || ''}
                            onFocus={() => openKeyboard('prenomAr')}
                            onChange={(e) => handleInputChange('prenomAr', e.target.value)}
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Nationalité</p>
                        <select
                          className="w-full border rounded-lg p-2 mt-1"
                          value={editedCustomer.nationalite || ''}
                          onChange={(e) => handleInputChange('nationalite', e.target.value)}
                        >
                          <option value="">Sélectionner</option>
                          {(countries as Country[]).map(country => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Date de naissance</p>
                          <DatePicker
                            selected={editedCustomer.dateNaissance ? new Date(editedCustomer.dateNaissance) : null}
                            onChange={(date: Date | null) => handleInputChange('dateNaissance', date ? date.toISOString().split('T')[0] : '')}
                            dateFormat="dd/MM/yyyy"
                            locale="fr"
                            placeholderText="jj/mm/aaaa"
                            className="w-full border rounded-lg p-2 mt-1"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Lieu de naissance</p>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 mt-1"
                            value={editedCustomer.lieuNaissance || ''}
                            onChange={(e) => handleInputChange('lieuNaissance', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">ICE</p>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 mt-1"
                          value={(editedCustomer as any).ice || ''}
                          onChange={(e) => handleInputChange('ice' as any, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="listeNoire"
                          checked={editedCustomer.listeNoire || false}
                          onChange={(e) => handleInputChange('listeNoire', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="listeNoire" className="text-sm">Liste noire</label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm">{selectedCustomer.type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Civilité</p>
                          <p className="text-sm">{selectedCustomer.civilite}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nom (FR)</p>
                          <p className="text-sm">{selectedCustomer.nomFr}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Prénom (FR)</p>
                          <p className="text-sm">{selectedCustomer.prenomFr}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nom (AR)</p>
                          <p className="text-sm" dir="rtl">{selectedCustomer.nomAr}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Prénom (AR)</p>
                          <p className="text-sm" dir="rtl">{selectedCustomer.prenomAr}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Nationalité</p>
                        <p className="text-sm">{selectedCustomer.nationalite}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Date de naissance</p>
                          <p className="text-sm">{formatDateToFrench(selectedCustomer.dateNaissance)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Lieu de naissance</p>
                          <p className="text-sm">{selectedCustomer.lieuNaissance}</p>
                        </div>
                      </div>
                       <div>
                          <p className="text-xs text-gray-500">ICE</p>
                          <p className="text-sm">{selectedCustomer.ice || '-'}</p>
                        </div>
                       <div>
                          <p className="text-xs text-gray-500">Liste noire</p>
                          <p className="text-sm">{selectedCustomer.listeNoire ? 'Oui' : 'Non'}</p>
                        </div>
                    </div>
                  )}
                </div>

                {/* Pièce d'identité Section */}
                <div className="mt-6 border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Pièce d'identité</p>
                  {editMode && editedCustomer ? (
                    <div className="space-y-4">
                      {/* CIN */}
                      <div>
                        <p className="text-sm font-medium text-gray-700">C.I.N</p>
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Numéro</p>
                              <input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.cin || ''} onChange={(e) => handleInputChange('cin', e.target.value)} />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Délivré à</p>
                              <input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.cinDelivreA || ''} onChange={(e) => handleInputChange('cinDelivreA', e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Délivré le</p>
                              <DatePicker selected={editedCustomer.cinDelivreLe ? new Date(editedCustomer.cinDelivreLe) : null} onChange={(date: Date | null) => handleInputChange('cinDelivreLe', date ? date.toISOString().split('T')[0] : '')} dateFormat="dd/MM/yyyy" locale="fr" className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Validité</p>
                              <DatePicker selected={editedCustomer.cinValidite ? new Date(editedCustomer.cinValidite) : null} onChange={(date: Date | null) => handleInputChange('cinValidite', date ? date.toISOString().split('T')[0] : '')} dateFormat="dd/MM/yyyy" locale="fr" className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Permis */}
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700">Permis de conduire</p>
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Numéro</p>
                              <input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.numeroPermis || ''} onChange={(e) => handleInputChange('numeroPermis', e.target.value)} />
                            </div>
                             <div>
                              <p className="text-xs text-gray-500">Délivré à</p>
                              <input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.permisDelivreA || ''} onChange={(e) => handleInputChange('permisDelivreA', e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Délivré le</p>
                              <DatePicker selected={editedCustomer.permisDelivreLe ? new Date(editedCustomer.permisDelivreLe) : null} onChange={(date: Date | null) => handleInputChange('permisDelivreLe', date ? date.toISOString().split('T')[0] : '')} dateFormat="dd/MM/yyyy" locale="fr" className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Validité</p>
                              <DatePicker selected={editedCustomer.permisValidite ? new Date(editedCustomer.permisValidite) : null} onChange={(date: Date | null) => handleInputChange('permisValidite', date ? date.toISOString().split('T')[0] : '')} dateFormat="dd/MM/yyyy" locale="fr" className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Passeport */}
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700">Passeport</p>
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Numéro</p>
                              <input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.numeroPasseport || ''} onChange={(e) => handleInputChange('numeroPasseport', e.target.value)} />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Délivré à</p>
                              <input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.passportDelivreA || ''} onChange={(e) => handleInputChange('passportDelivreA', e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Délivré le</p>
                              <DatePicker selected={editedCustomer.passportDelivreLe ? new Date(editedCustomer.passportDelivreLe) : null} onChange={(date: Date | null) => handleInputChange('passportDelivreLe', date ? date.toISOString().split('T')[0] : '')} dateFormat="dd/MM/yyyy" locale="fr" className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Validité</p>
                              <DatePicker selected={editedCustomer.passportValidite ? new Date(editedCustomer.passportValidite) : null} onChange={(date: Date | null) => handleInputChange('passportValidite', date ? date.toISOString().split('T')[0] : '')} dateFormat="dd/MM/yyyy" locale="fr" className="w-full border rounded-lg p-2 mt-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">C.I.N</p>
                        <div className="grid grid-cols-2 gap-4 mt-1">
                          <div><p className="text-xs text-gray-500">Numéro</p><p className="text-sm">{selectedCustomer.cin || '-'}</p></div>
                          <div><p className="text-xs text-gray-500">Validité</p><p className="text-sm">{formatDateToFrench(selectedCustomer.cinValidite) || '-'}</p></div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700">Permis de conduire</p>
                        <div className="grid grid-cols-2 gap-4 mt-1">
                          <div><p className="text-xs text-gray-500">Numéro</p><p className="text-sm">{selectedCustomer.numeroPermis || '-'}</p></div>
                          <div><p className="text-xs text-gray-500">Validité</p><p className="text-sm">{formatDateToFrench(selectedCustomer.permisValidite) || '-'}</p></div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700">Passeport</p>
                        <div className="grid grid-cols-2 gap-4 mt-1">
                          <div><p className="text-xs text-gray-500">Numéro</p><p className="text-sm">{selectedCustomer.numeroPasseport || '-'}</p></div>
                          <div><p className="text-xs text-gray-500">Validité</p><p className="text-sm">{formatDateToFrench(selectedCustomer.passportValidite) || '-'}</p></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Section */}
                <div className="mt-6 border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Contact</p>
                  {editMode && editedCustomer ? (
                    <div className="space-y-3">
                      <div><p className="text-xs text-gray-500">Email</p><input type="email" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-500">Téléphone</p><input type="tel" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.telephone || ''} onChange={(e) => handleInputChange('telephone', e.target.value)} /></div>
                        <div><p className="text-xs text-gray-500">Téléphone 2</p><input type="tel" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.telephone2 || ''} onChange={(e) => handleInputChange('telephone2', e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-500">Fix</p><input type="tel" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.fix || ''} onChange={(e) => handleInputChange('fix', e.target.value)} /></div>
                        <div><p className="text-xs text-gray-500">Fax</p><input type="tel" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.fax || ''} onChange={(e) => handleInputChange('fax', e.target.value)} /></div>
                      </div>
                      <div><p className="text-xs text-gray-500">Adresse (FR)</p><input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.adresseFr || ''} onChange={(e) => handleInputChange('adresseFr', e.target.value)} /></div>
                      <div>
                        <p className="text-xs text-gray-500">Adresse (AR)</p>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 mt-1"
                          value={editedCustomer.adresseAr || ''}
                          onFocus={() => openKeyboard('adresseAr')}
                          onChange={(e) => handleInputChange('adresseAr', e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-500">Ville</p><input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.ville || ''} onChange={(e) => handleInputChange('ville', e.target.value)} /></div>
                        <div><p className="text-xs text-gray-500">Code Postal</p><input type="text" className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.codePostal || ''} onChange={(e) => handleInputChange('codePostal', e.target.value)} /></div>
                      </div>
                      <div><p className="text-xs text-gray-500">Remarque</p><textarea className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.remarque || ''} onChange={(e) => handleInputChange('remarque', e.target.value)} /></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div><p className="text-xs text-gray-500">Email</p><p className="text-sm">{selectedCustomer.email}</p></div>
                      <div><p className="text-xs text-gray-500">Téléphone</p><p className="text-sm">{selectedCustomer.telephone}</p></div>
                      <div><p className="text-xs text-gray-500">Adresse</p><p className="text-sm">{selectedCustomer.adresseFr}, {selectedCustomer.ville} {selectedCustomer.codePostal}</p></div>
                      <div><p className="text-xs text-gray-500">Remarque</p><p className="text-sm">{selectedCustomer.remarque || '-'}</p></div>
                    </div>
                  )}
                </div>

                {/* Documents Section */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500 uppercase font-medium">Documents</p>
                  </div>
                  {editMode && editedCustomer ? (
                    <FileUploader
                      api_url={BASE_URL}
                      existingDocuments={editedCustomer.documents}
                      newFiles={newFiles}
                      onNewFilesChange={handleNewFilesChange}
                      onRemoveExistingDocument={handleRemoveExistingDocument}
                      label="Documents"
                    />
                  ) : (
                    selectedCustomer.documents && selectedCustomer.documents.length > 0 ? (
                      <FileUploader
                        api_url={BASE_URL}
                        existingDocuments={selectedCustomer.documents}
                        newFiles={[]}
                        onNewFilesChange={() => {}}
                        onRemoveExistingDocument={handleRemoveExistingDocument}
                        label=""
                        readOnly={true}
                      />
                    ) : (
                      <p className="text-sm text-gray-500 italic">Aucun document</p>
                    )
                  )}
                </div>

                {/* Status Section */}
                <div className="mt-6 border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Statut du client</p>
                  {editMode && editedCustomer ? (
                    <select className="w-full border rounded-lg p-2 mt-1" value={editedCustomer.status || 'Actif'} onChange={(e) => handleInputChange('status', e.target.value)}>
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  ) : (
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedCustomer.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedCustomer.status}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <UserCircle size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun client sélectionné</h3>
                <p className="text-gray-500 mb-4">Sélectionnez un client pour voir ses détails</p>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowModalForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter un client
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal (only for adding new customers) */}
      {showModalForm && (
        <CustomerForm
          onSubmit={handleAddCustomer}
          onClose={() => setShowModalForm(false)}
          api_url={BASE_URL} // Pass BASE_URL for new customer form
        />
      )}

      <ArabicKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onInput={handleKeyboardInput}
        initialValue={activeInput && editedCustomer ? String(editedCustomer[activeInput]) : ''}
      />
    </div>
  );
};

export default Customers;
