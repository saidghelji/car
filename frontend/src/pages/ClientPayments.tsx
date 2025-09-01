import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Receipt, FileText, Trash2 } from 'lucide-react';
import EditButton from '../components/EditButton';
import { X } from 'lucide-react';
import ClientPaymentForm from '../components/ClientPaymentForm';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import FileUploader, { Document } from '../components/FileUploader';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Customer } from './Customers';
import { Contract } from './Contrats'; // Import Contract interface
import { Facture } from './Factures'; // Import Facture interface
import { Accident } from './Accidents'; // Import Accident interface

registerLocale('fr', fr);

type PaymentType = 'espèce' | 'chèque' | 'carte bancaire' | 'virement';
type PaymentFor = 'contract' | 'facture' | 'accident' | '';

interface PaymentRecord {
  _id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentFor: PaymentFor;
  client: Customer;
  contract?: Contract; // Add contract field
  facture?: Facture; // Add facture field
  accident?: Accident; // Add accident field
  remainingAmount: number;
  paymentType: PaymentType | ''; // Allow empty string for initial state
  amountPaid: number;
  createdAt?: string;
  updatedAt?: string;
  documents?: Document[];
}

const ClientPayments = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]); // New state for contracts
  const [factures, setFactures] = useState<Facture[]>([]); // New state for factures
  const [accidents, setAccidents] = useState<Accident[]>([]); // New state for accidents
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPayment, setEditedPayment] = useState<PaymentRecord | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);

  const API_URL = 'http://localhost:5000';
  const API_URL_PAYMENTS = `${API_URL}/api/clientpayments`;
  const API_URL_CUSTOMERS = 'http://localhost:5000/api/customers';
  const API_URL_CONTRACTS = 'http://localhost:5000/api/contracts'; // New API URL for contracts
  const API_URL_FACTURES = 'http://localhost:5000/api/factures'; // New API URL for factures
  const API_URL_ACCIDENTS = 'http://localhost:5000/api/accidents'; // New API URL for accidents

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<PaymentRecord[]>(API_URL_PAYMENTS);
      setPayments(response.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments. Please ensure the backend is running and the endpoint is correct.');
      toast.error('Failed to load payments.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get<Customer[]>(API_URL_CUSTOMERS);
      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customers.');
    }
  }, []);

  const fetchContracts = useCallback(async () => { // New fetch function for contracts
    try {
      const response = await axios.get<Contract[]>(API_URL_CONTRACTS);
      setContracts(response.data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      toast.error('Failed to load contracts.');
    }
  }, []);

  const fetchFactures = useCallback(async () => { // New fetch function for factures
    try {
      const response = await axios.get<Facture[]>(API_URL_FACTURES);
      setFactures(response.data);
    } catch (err) {
      console.error('Error fetching factures:', err);
      toast.error('Failed to load factures.');
    }
  }, []);

  const fetchAccidents = useCallback(async () => { // New fetch function for accidents
    try {
      const response = await axios.get<Accident[]>(API_URL_ACCIDENTS);
      setAccidents(response.data);
    } catch (err) {
      console.error('Error fetching accidents:', err);
      toast.error('Failed to load accidents.');
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchContracts(); // Fetch contracts on component mount
    fetchFactures(); // Fetch factures on component mount
    fetchAccidents(); // Fetch accidents on component mount
  }, [fetchPayments, fetchCustomers, fetchContracts, fetchFactures, fetchAccidents]);

  const filteredPayments = payments.filter(payment => {
    const searchString = searchTerm.toLowerCase();
    const clientName = payment.client ? `${payment.client.prenomFr} ${payment.client.nomFr}`.toLowerCase() : '';
    return (
      payment.paymentNumber.toLowerCase().includes(searchString) ||
      clientName.includes(searchString)
    );
  });

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce réglement ?')) {
      try {
        await axios.delete(`${API_URL_PAYMENTS}/${paymentId}`);
        setPayments(payments.filter(payment => payment._id !== paymentId));
        setSelectedPayment(null);
        toast.success('Payment deleted successfully.');
      } catch (err) {
        console.error('Error deleting payment:', err);
        toast.error('Failed to delete payment.');
      }
    }
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    const existingDocs: Document[] = (payment.documents || []).map(doc => ({
      name: doc.name,
      url: doc.url,
      type: doc.type,
      size: doc.size,
      isNew: false,
    }));
    setEditedPayment({ ...payment, documents: existingDocs });
    setIsEditMode(true);
    setShowFormModal(false);
    setNewAttachmentFiles([]);
  };

  const handleNewPayment = () => {
    setSelectedPayment(null);
    setEditedPayment(null);
    setIsEditMode(false);
    setShowFormModal(true);
    setNewAttachmentFiles([]); // Clear new files for new payment
  };

  const handleFormSubmit = async (formData: Partial<PaymentRecord>, newAttachmentFiles: File[]) => {
    const dataToSend = new FormData();

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        const value = formData[key as keyof PaymentRecord];
        if (key === 'client' && typeof value === 'object' && value !== null && '_id' in value && typeof (value as any)._id === 'string') {
          dataToSend.append('client', (value as Customer)._id);
        } else if (key === 'contract' && typeof value === 'object' && value !== null && '_id' in value && typeof (value as any)._id === 'string') {
          dataToSend.append('contract', (value as Contract)._id); // Handle contract ID
        } else if (key === 'facture' && typeof value === 'object' && value !== null && '_id' in value && typeof (value as any)._id === 'string') {
          dataToSend.append('facture', (value as Facture)._id); // Handle facture ID
        } else if (key === 'accident' && typeof value === 'object' && value !== null && '_id' in value && typeof (value as any)._id === 'string') {
          dataToSend.append('accident', (value as Accident)._id); // Handle accident ID
        } else if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'documents' && value !== null && value !== undefined) {
          dataToSend.append(key, value as any);
        }
      }
    }

    const existingDocsToKeep = formData.documents?.filter(doc => !doc.isNew) || [];
    dataToSend.append('existingDocuments', JSON.stringify(existingDocsToKeep));

    if (newAttachmentFiles.length > 0) {
      newAttachmentFiles.forEach(file => {
        dataToSend.append('documents', file);
      });
    }

    try {
      let responseData: PaymentRecord;
      if (selectedPayment && selectedPayment._id) {
        const response = await axios.put<PaymentRecord>(`${API_URL_PAYMENTS}/${selectedPayment._id}`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        responseData = response.data;
        const populatedPayment = {
          ...responseData,
          client: customers.find(c => c._id === (responseData.client as any)) || responseData.client,
          contract: responseData.contract,
          facture: responseData.facture,
          accident: responseData.accident,
        };
        setPayments(payments.map(p => (p._id === populatedPayment._id ? populatedPayment : p)));
        setSelectedPayment(populatedPayment);
        toast.success('Payment updated successfully.');
      } else {
        const response = await axios.post<PaymentRecord>(API_URL_PAYMENTS, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        responseData = response.data;
        const populatedPayment = {
          ...responseData,
          client: customers.find(c => c._id === (responseData.client as any)) || responseData.client,
          contract: responseData.contract,
          facture: responseData.facture,
          accident: responseData.accident,
        };
        setPayments([...payments, populatedPayment]);
        setSelectedPayment(populatedPayment);
        toast.success('Payment created successfully.');
      }
      setShowFormModal(false);
      setIsEditMode(false);
      setEditedPayment(null);
      setNewAttachmentFiles([]);
    } catch (err) {
      console.error(`Error ${selectedPayment ? 'updating' : 'creating'} payment:`, err);
      toast.error(`Failed to ${selectedPayment ? 'update' : 'create'} payment.`);
    }
  };

  const handleInputChange = (field: keyof PaymentRecord | 'clientId' | 'contractId' | 'factureId' | 'accidentId', value: any) => {
    setEditedPayment(prev => {
      if (!prev) return null;
      if (field === 'clientId') {
        const selectedCustomer = customers.find(c => c._id === value);
        return { ...prev, client: selectedCustomer!, clientId: selectedCustomer?._id || '', clientName: selectedCustomer ? `${selectedCustomer.prenomFr} ${selectedCustomer.nomFr}` : '' };
      }
      if (field === 'contractId') { // New handler for contractId
        const selectedContract = contracts.find(c => c._id === value);
        return { ...prev, contract: selectedContract!, contractId: selectedContract?._id || '' };
      }
      if (field === 'factureId') { // New handler for factureId
        const selectedFacture = factures.find(f => f._id === value);
        return { ...prev, facture: selectedFacture!, factureId: selectedFacture?._id || '' };
      }
      if (field === 'accidentId') { // New handler for accidentId
        const selectedAccident = accidents.find(a => a._id === value);
        return { ...prev, accident: selectedAccident!, accidentId: selectedAccident?._id || '' };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleRemoveAttachment = async (docToRemove: Document) => {
    if (!selectedPayment) return;

    if (docToRemove.isNew) {
      setNewAttachmentFiles(prev => prev.filter(file => URL.createObjectURL(file) !== docToRemove.url));
      setEditedPayment(prev => ({
        ...prev!,
        documents: prev?.documents?.filter(doc => doc.url !== docToRemove.url) || [],
      }));
      toast.success('Document supprimé (localement). Enregistrez pour confirmer.');
      return;
    }

    try {
      await axios.delete(`${API_URL_PAYMENTS}/${selectedPayment._id}/documents`, {
        data: { documentUrl: docToRemove.url }
      });
      setSelectedPayment(prev => {
        if (!prev) return null;
        return {
          ...prev,
          documents: prev.documents?.filter(doc => doc.url !== docToRemove.url),
        };
      });
      setEditedPayment(prev => ({
        ...prev!,
        documents: prev?.documents?.filter(doc => doc.url !== docToRemove.url) || [],
      }));
      toast.success('Document supprimé avec succès.');
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      toast.error('Échec de la suppression du document.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500"><p>{error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Réglements</h1>
        <button
          onClick={handleNewPayment}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouveau Réglement
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
                placeholder="Rechercher un réglement..."
                className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => {
                  if (isEditMode) {
                    if (confirm('Vous avez des modifications non enregistrées. Voulez-vous continuer et perdre ces modifications?')) {
                      setSearchTerm(e.target.value);
                      setIsEditMode(false);
                      setEditedPayment(null);
                      setNewAttachmentFiles([]);
                    }
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Réglement
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Réglé pour
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedPayment?._id === payment._id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Receipt size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{payment.paymentNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.paymentFor === 'contract' ? 'bg-blue-100 text-blue-800' :
                        payment.paymentFor === 'facture' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.paymentFor === 'contract' ? 'Contrat' :
                         payment.paymentFor === 'facture' ? 'Facture' : 'Accident'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.client ? `${payment.client.prenomFr} ${payment.client.nomFr}` : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.amountPaid.toLocaleString('fr-FR')} DH</div>
                      {payment.remainingAmount > 0 && (
                        <div className="text-xs text-amber-600">
                          Reste: {payment.remainingAmount.toLocaleString('fr-FR')} DH
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleEditPayment(payment);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeletePayment(payment._id);
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

        <div className="lg:col-span-1">
          {selectedPayment ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails du réglement</h2>
                {isEditMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir annuler les modifications ?')) {
                          setIsEditMode(false);
                          setEditedPayment(null);
                          setSelectedPayment(null);
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
                        if (editedPayment) {
                          handleFormSubmit(editedPayment, newAttachmentFiles);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleEditPayment(selectedPayment)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Modifier
                  </button>
                )}
                <button onClick={() => setSelectedPayment(null)} className="p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                {isEditMode && editedPayment ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="paymentNumber" className="block text-sm font-medium text-gray-700 mb-1">N° Réglement</label>
                      <input
                        type="text"
                        id="paymentNumber"
                        name="paymentNumber"
                        value={editedPayment.paymentNumber || ''}
                        onChange={(e) => handleInputChange('paymentNumber', e.target.value)}
                        className="mt-1 block w-full border rounded-lg p-2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Réglement</label>
                      <DatePicker
                        id="paymentDate"
                        selected={editedPayment.paymentDate ? new Date(editedPayment.paymentDate) : null}
                        onChange={(date) => handleInputChange('paymentDate', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="dd/MM/yyyy"
                        locale="fr"
                        className="mt-1 block w-full border rounded-lg p-2"
                        placeholderText="Sélectionner une date"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="paymentFor" className="block text-sm font-medium text-gray-700 mb-1">Régler pour</label>
                      <select
                        id="paymentFor"
                        name="paymentFor"
                        value={editedPayment.paymentFor || ''}
                        onChange={(e) => handleInputChange('paymentFor', e.target.value as PaymentFor)}
                        className="mt-1 block w-full border rounded-lg p-2"
                        required
                      >
                        <option value="">Sélectionner le type</option>
                        <option value="contract">Contrat</option>
                        <option value="facture">Facture</option>
                        <option value="accident">Accident</option>
                      </select>
                    </div>
                    {editedPayment.paymentFor === 'contract' && ( // Conditionally render contract dropdown
                      <div>
                        <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-1">Contrat</label>
                        <select
                          id="contractId"
                          name="contractId"
                          value={editedPayment.contract?._id || ''}
                          onChange={(e) => handleInputChange('contractId', e.target.value)}
                          className="mt-1 block w-full border rounded-lg p-2"
                          required
                        >
                          <option value="">Sélectionner un contrat</option>
                          {contracts.map(contract => (
                            <option key={contract._id} value={contract._id}>
                              {contract.contractNumber} - {contract.client ? `${contract.client.prenomFr} ${contract.client.nomFr}` : 'N/A'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {editedPayment.paymentFor === 'facture' && ( // Conditionally render facture dropdown
                      <div>
                        <label htmlFor="factureId" className="block text-sm font-medium text-gray-700 mb-1">Facture</label>
                        <select
                          id="factureId"
                          name="factureId"
                          value={editedPayment.facture?._id || ''}
                          onChange={(e) => handleInputChange('factureId', e.target.value)}
                          className="mt-1 block w-full border rounded-lg p-2"
                          required
                        >
                          <option value="">Sélectionner une facture</option>
                          {factures.map(facture => (
                            <option key={facture._id} value={facture._id}>
                              {facture.totalTTC} DH - {facture.client ? `${facture.client.prenomFr} ${facture.client.nomFr}` : 'N/A'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {editedPayment.paymentFor === 'accident' && ( // Conditionally render accident dropdown
                      <div>
                        <label htmlFor="accidentId" className="block text-sm font-medium text-gray-700 mb-1">Accident</label>
                        <select
                          id="accidentId"
                          name="accidentId"
                          value={editedPayment.accident?._id || ''}
                          onChange={(e) => handleInputChange('accidentId', e.target.value)}
                          className="mt-1 block w-full border rounded-lg p-2"
                          required
                        >
                          <option value="">Sélectionner un accident</option>
                          {accidents.map(accident => (
                            <option key={accident._id} value={accident._id}>
                              {accident.numeroContrat} - {accident.clientNom} - {new Date(accident.dateAccident).toLocaleDateString('fr-FR')}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                      <select
                        id="clientId"
                        name="clientId"
                        value={editedPayment.client?._id || ''}
                        onChange={(e) => handleInputChange('clientId', e.target.value)}
                        className="mt-1 block w-full border rounded-lg p-2"
                        required
                      >
                        <option value="">Sélectionner un client</option>
                        {customers
                          .filter(customer => customer.status === 'Actif')
                          .map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {`${customer.prenomFr} ${customer.nomFr}`}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">Montant Payé</label>
                      <input
                        type="number"
                        id="amountPaid"
                        name="amountPaid"
                        value={editedPayment.amountPaid || 0}
                        onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value))}
                        className="mt-1 block w-full border rounded-lg p-2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="remainingAmount" className="block text-sm font-medium text-gray-700 mb-1">Montant Restant</label>
                      <input
                        type="number"
                        id="remainingAmount"
                        name="remainingAmount"
                        value={editedPayment.remainingAmount || 0}
                        onChange={(e) => handleInputChange('remainingAmount', parseFloat(e.target.value))}
                        className="mt-1 block w-full border rounded-lg p-2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">Type de Paiement</label>
                      <select
                        id="paymentType"
                        name="paymentType"
                        value={editedPayment.paymentType || ''}
                        onChange={(e) => handleInputChange('paymentType', e.target.value as PaymentType)}
                        className="mt-1 block w-full border rounded-lg p-2"
                        required
                      >
                        <option value="">Sélectionner le type</option>
                        <option value="espèce">Espèce</option>
                        <option value="chèque">Chèque</option>
                        <option value="carte bancaire">Carte Bancaire</option>
                        <option value="virement">Virement</option>
                      </select>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-lg font-medium mb-2">Documents Associés:</h4>
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={editedPayment.documents || []}
                        newFiles={newAttachmentFiles}
                        onNewFilesChange={setNewAttachmentFiles}
                        onRemoveExistingDocument={handleRemoveAttachment}
                        label=""
                        multiple={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div><h3 className="text-lg font-medium">N° Réglement</h3><p>{selectedPayment.paymentNumber}</p></div>
                    <div><h3 className="text-lg font-medium">Date de Réglement</h3><p>{new Date(selectedPayment.paymentDate).toLocaleDateString('fr-FR')}</p></div>
                    <div><h3 className="text-lg font-medium">Régler pour</h3><p>{selectedPayment.paymentFor}</p></div>
                    {selectedPayment.paymentFor === 'contract' && ( // Display contract details
                      <div><h3 className="text-lg font-medium">Contrat</h3><p>{selectedPayment.contract ? `${selectedPayment.contract.contractNumber} - ${selectedPayment.contract.client ? `${selectedPayment.contract.client.prenomFr} ${selectedPayment.contract.client.nomFr}` : 'N/A'}` : 'N/A'}</p></div>
                    )}
                    {selectedPayment.paymentFor === 'facture' && ( // Display facture details
                      <div><h3 className="text-lg font-medium">Facture</h3><p>{selectedPayment.facture ? `${selectedPayment.facture.totalTTC} DH - ${selectedPayment.facture.client ? `${selectedPayment.facture.client.prenomFr} ${selectedPayment.facture.client.nomFr}` : 'N/A'}` : 'N/A'}</p></div>
                    )}
                    {selectedPayment.paymentFor === 'accident' && ( // Display accident details
                      <div><h3 className="text-lg font-medium">Accident</h3><p>{selectedPayment.accident ? `${selectedPayment.accident.numeroContrat} - ${selectedPayment.accident.clientNom} - ${new Date(selectedPayment.accident.dateAccident).toLocaleDateString('fr-FR')}` : 'N/A'}</p></div>
                    )}
                    <div><h3 className="text-lg font-medium">Client</h3><p>{selectedPayment.client ? `${selectedPayment.client.prenomFr} ${selectedPayment.client.nomFr}` : 'N/A'}</p></div>
                    <div><h3 className="text-lg font-medium">Montant Payé</h3><p>{selectedPayment.amountPaid.toLocaleString('fr-FR')} DH</p></div>
                    <div><h3 className="text-lg font-medium">Montant Restant</h3><p>{selectedPayment.remainingAmount.toLocaleString('fr-FR')} DH</p></div>
                    <div><h3 className="text-lg font-medium">Type de Paiement</h3><p>{selectedPayment.paymentType}</p></div>
                    <div className="mt-4">
                      <h4 className="text-lg font-medium mb-2">Documents Associés:</h4>
                      {selectedPayment?.documents && selectedPayment.documents.length > 0 ? (
                        <FileUploader
                          api_url={API_URL}
                          existingDocuments={selectedPayment.documents}
                          newFiles={[]}
                          onNewFilesChange={() => {}}
                          onRemoveExistingDocument={handleRemoveAttachment}
                          label=""
                          readOnly={true}
                          multiple={true}
                        />
                      ) : (
                        <p className="text-sm text-gray-500">Aucun document</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Receipt size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun réglement sélectionné</h3>
              <p className="text-gray-500 mb-4">Sélectionnez un réglement pour voir ses détails ou créez-en un nouveau.</p>
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <ClientPaymentForm
          initialData={isEditMode ? selectedPayment : null}
          customers={customers}
          contracts={contracts} // Pass contracts to the form
          factures={factures} // Pass factures to the form
          accidents={accidents} // Pass accidents to the form
          onSubmit={handleFormSubmit}
          onClose={() => setShowFormModal(false)}
          isEditMode={isEditMode}
          newAttachmentFiles={newAttachmentFiles} // Pass newAttachmentFiles
          setNewAttachmentFiles={setNewAttachmentFiles} // Pass setNewAttachmentFiles
          handleRemoveAttachment={handleRemoveAttachment} // Pass handleRemoveAttachment
        />
      )}
    </div>
  );
};

export default ClientPayments;
