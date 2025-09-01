import { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import FileUploader, { Document } from './FileUploader';
import { X } from 'lucide-react';
import { Customer } from '../pages/Customers';
import { Contract } from '../pages/Contrats'; // Import Contract interface
import { Facture } from '../pages/Factures'; // Import Facture interface
import { Accident } from '../pages/Accidents'; // Import Accident interface
import toast from 'react-hot-toast';

registerLocale('fr', fr);

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

type PaymentType = 'espèce' | 'chèque' | 'carte bancaire' | 'virement';
type PaymentFor = 'contract' | 'facture' | 'accident' | '';

interface PaymentRecord {
  _id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentFor: PaymentFor;
  client: Customer;
  clientId?: string;
  clientName?: string;
  contract?: Contract; // Add contract field
  contractId?: string; // Add contractId for form handling
  facture?: Facture; // Add facture field
  factureId?: string; // Add factureId for form handling
  accident?: Accident; // Add accident field
  accidentId?: string; // Add accidentId for form handling
  remainingAmount: number;
  paymentType: PaymentType | '';
  amountPaid: number;
  createdAt?: string;
  updatedAt?: string;
  documents?: Document[];
}

interface ClientPaymentFormProps {
  initialData: PaymentRecord | null;
  customers: Customer[];
  contracts: Contract[]; // Add contracts prop
  factures: Facture[]; // Add factures prop
  accidents: Accident[]; // Add accidents prop
  onSubmit: (data: Partial<PaymentRecord>, newAttachmentFiles: File[]) => Promise<void>;
  onClose: () => void;
  isEditMode: boolean;
  newAttachmentFiles: File[];
  setNewAttachmentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleRemoveAttachment: (docToRemove: Document) => Promise<void>;
}

const ClientPaymentForm = ({ initialData, customers, contracts, factures, accidents, onSubmit, onClose, isEditMode, newAttachmentFiles, setNewAttachmentFiles, handleRemoveAttachment }: ClientPaymentFormProps) => {
  const [formData, setFormData] = useState<Partial<PaymentRecord>>(() => {
    if (initialData) {
      return {
        ...initialData,
        paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate).toISOString().split('T')[0] : '',
        documents: initialData.documents || [],
        contractId: initialData.contract?._id || '', // Initialize contractId
        factureId: initialData.facture?._id || '', // Initialize factureId
        accidentId: initialData.accident?._id || '', // Initialize accidentId
      };
    }
    return {
      paymentNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentFor: '',
      clientId: '',
      clientName: '',
      contractId: '', // Initialize contractId for new payments
      factureId: '', // Initialize factureId for new payments
      accidentId: '', // Initialize accidentId for new payments
      remainingAmount: 0,
      paymentType: '',
      amountPaid: 0,
      documents: [],
    };
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate).toISOString().split('T')[0] : '',
        documents: initialData.documents || [],
        contractId: initialData.contract?._id || '', // Update contractId on initialData change
        factureId: initialData.facture?._id || '', // Update factureId on initialData change
        accidentId: initialData.accident?._id || '', // Update accidentId on initialData change
      });
      setNewAttachmentFiles([]);
    } else {
      setFormData({
        paymentNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentFor: '',
        clientId: '',
        clientName: '',
        contractId: '', // Clear contractId for new payments
        factureId: '', // Clear factureId for new payments
        accidentId: '', // Clear accidentId for new payments
        remainingAmount: 0,
        paymentType: '',
        amountPaid: 0,
        documents: [],
      });
      setNewAttachmentFiles([]);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof PaymentRecord | 'clientId' | 'contractId' | 'factureId' | 'accidentId', value: any) => {
    let newErrors = { ...validationErrors };

    if (field === 'amountPaid') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        newErrors.amountPaid = 'Le montant payé ne peut pas être inférieur à 0.';
      } else {
        delete newErrors.amountPaid;
      }
    }
    // No specific text field for "Réglement" found, so no validation for it yet.

    setValidationErrors(newErrors);

    setFormData(prev => {
      if (field === 'clientId') {
        const selectedCustomer = customers.find(c => c._id === value);
        return {
          ...prev,
          client: selectedCustomer!,
          clientId: selectedCustomer?._id || '',
          clientName: selectedCustomer ? `${selectedCustomer.prenomFr} ${selectedCustomer.nomFr}` : '',
        };
      }
      if (field === 'contractId') { // New handler for contractId
        const selectedContract = contracts.find(c => c._id === value);
        return {
          ...prev,
          contract: selectedContract!,
          contractId: selectedContract?._id || '',
        };
      }
      if (field === 'factureId') { // New handler for factureId
        const selectedFacture = factures.find(f => f._id === value);
        return {
          ...prev,
          facture: selectedFacture!,
          factureId: selectedFacture?._id || '',
        };
      }
      if (field === 'accidentId') { // New handler for accidentId
        const selectedAccident = accidents.find(a => a._id === value);
        return {
          ...prev,
          accident: selectedAccident!,
          accidentId: selectedAccident?._id || '',
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleNewFilesChange = (files: File[]) => {
    setNewAttachmentFiles(files);
    setFormData(prev => ({
      ...prev!,
      documents: [
        ...(prev?.documents?.filter(doc => !doc.isNew) || []),
        ...files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          isNew: true,
        }))
      ]
    }));
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (docToRemove.isNew) {
      setNewAttachmentFiles(prev => prev.filter(file => URL.createObjectURL(file) !== docToRemove.url));
      setFormData(prev => ({
        ...prev!,
        documents: prev?.documents?.filter(doc => doc.url !== docToRemove.url) || [],
      }));
    } else {
      await handleRemoveAttachment(docToRemove);
      setFormData(prev => ({
        ...prev!,
        documents: prev?.documents?.filter(doc => doc.url !== docToRemove.url) || [],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: {[key: string]: string} = {};
    if (formData.amountPaid !== undefined && formData.amountPaid < 0) {
      errors.amountPaid = 'Le montant payé ne peut pas être inférieur à 0.';
    }
    // No specific text field for "Réglement" found, so no validation for it yet.

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    await onSubmit(formData, newAttachmentFiles);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{initialData ? 'Modifier Réglement' : 'Nouveau Réglement'}</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border-b pb-4">
            <h3 className="font-semibold mb-3">Informations du Réglement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isEditMode ? null : ( // Only show paymentNumber field in edit mode
                <div>
                  <label htmlFor="paymentNumber" className="block text-sm font-medium text-gray-700 mb-1">N° Réglement</label>
                  <input
                    type="text"
                    id="paymentNumber"
                    name="paymentNumber"
                    value={formData.paymentNumber || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    readOnly // Make it read-only
                  />
                </div>
              )}

              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">Date de Réglement</label>
                <DatePicker
                  id="paymentDate"
                  selected={formData.paymentDate ? new Date(formData.paymentDate) : null}
                  onChange={(date) => handleInputChange('paymentDate', date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholderText="Sélectionner une date"
                  required
                />
              </div>

              <div>
                <label htmlFor="paymentFor" className="block text-sm font-medium text-gray-700 mb-1">Régler pour</label>
                <select
                  id="paymentFor"
                  name="paymentFor"
                  value={formData.paymentFor || ''}
                  onChange={(e) => handleInputChange('paymentFor', e.target.value as PaymentFor)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Sélectionner le type</option>
                  <option value="contract">Contrat</option>
                  <option value="facture">Facture</option>
                  <option value="accident">Accident</option>
                </select>
              </div>

              {formData.paymentFor === 'contract' && ( // Conditionally render contract dropdown
                <div>
                  <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-1">Contrat</label>
                  <select
                    id="contractId"
                    name="contractId"
                    value={formData.contract?._id || formData.contractId || ''}
                    onChange={(e) => handleInputChange('contractId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

              {formData.paymentFor === 'facture' && ( // Conditionally render facture dropdown
                <div>
                  <label htmlFor="factureId" className="block text-sm font-medium text-gray-700 mb-1">Facture</label>
                  <select
                    id="factureId"
                    name="factureId"
                    value={formData.facture?._id || formData.factureId || ''}
                    onChange={(e) => handleInputChange('factureId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Sélectionner une facture</option>
                    {factures.map(facture => (
                      <option key={facture._id} value={facture._id}>
                        {facture.invoiceNumber} - {facture.totalTTC.toLocaleString('fr-FR')} DH
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.paymentFor === 'accident' && ( // Conditionally render accident dropdown
                <div>
                  <label htmlFor="accidentId" className="block text-sm font-medium text-gray-700 mb-1">Accident</label>
                  <select
                    id="accidentId"
                    name="accidentId"
                    value={formData.accident?._id || formData.accidentId || ''}
                    onChange={(e) => handleInputChange('accidentId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  value={formData.client?._id || formData.clientId || ''}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  value={formData.amountPaid || 0}
                  onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value))}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none ${validationErrors.amountPaid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} sm:text-sm`}
                  required
                />
                {validationErrors.amountPaid && <p className="text-red-500 text-xs mt-1">{validationErrors.amountPaid}</p>}
              </div>

              <div>
                <label htmlFor="remainingAmount" className="block text-sm font-medium text-gray-700 mb-1">Montant Restant</label>
                <input
                  type="number"
                  id="remainingAmount"
                  name="remainingAmount"
                  value={formData.remainingAmount || 0}
                  onChange={(e) => handleInputChange('remainingAmount', parseFloat(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">Type de Paiement</label>
                <select
                  id="paymentType"
                  name="paymentType"
                  value={formData.paymentType || ''}
                  onChange={(e) => handleInputChange('paymentType', e.target.value as PaymentType)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Sélectionner le type</option>
                  <option value="espèce">Espèce</option>
                  <option value="chèque">Chèque</option>
                  <option value="carte bancaire">Carte Bancaire</option>
                  <option value="virement">Virement</option>
                </select>
              </div>
            </div>
          </section>

          <FileUploader
            api_url="http://localhost:5000"
            existingDocuments={formData.documents || []}
            newFiles={newAttachmentFiles}
            onNewFilesChange={handleNewFilesChange}
            onRemoveExistingDocument={handleRemoveExistingDocument}
            label="Documents Associés"
            multiple={true}
          />

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {initialData ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientPaymentForm;
