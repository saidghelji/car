import { useState } from 'react';
import { Plus, Search, Receipt, FileText, Trash2 } from 'lucide-react';
import EditButton from '../components/EditButton';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  client: {
    id: string;
    name: string;
    type: 'Professionel' | 'Particulier';
  };
  location: string;
  type: 'Professionel' | 'Particulier';
  tvaAmount: number;
  tvaPercentage: number;
  totalTTC: number;
  paymentType: 'espèce' | 'chèque' | 'carte bancaire' | 'virement';
  amountPaid: number;
  contract?: {
    id: string;
    contractNumber: string;
  };
}

// Sample data
const initialInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'FAC-2025-001',
    invoiceDate: '2025-05-08',
    client: {
      id: '1',
      name: 'Jean Dupont',
      type: 'Particulier'
    },
    location: 'Casablanca',
    type: 'Particulier',
    tvaAmount: 200,
    tvaPercentage: 20,
    totalTTC: 1200,
    paymentType: 'carte bancaire',
    amountPaid: 1200,
    contract: {
      id: '1',
      contractNumber: 'CTR-2025-001'
    }
  }
];

const Factures = () => {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);

  // Calculate TVA amount from total and percentage
  const calculateTvaAmount = (totalTTC: number, tvaPercentage: number): number => {
    return (totalTTC * tvaPercentage) / (100 + tvaPercentage);
  };

  // Calculate total TTC from HT amount and TVA percentage
  const calculateTotalTTC = (amountHT: number, tvaPercentage: number): number => {
    return amountHT * (1 + tvaPercentage / 100);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchString = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchString) ||
      invoice.client.name.toLowerCase().includes(searchString)
    );
  });

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
      setSelectedInvoice(null);
    }
  };

  const handleEditClick = () => {
    if (selectedInvoice) {
      setEditedInvoice({ ...selectedInvoice });
      setEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedInvoice) {
      setInvoices(invoices.map(invoice =>
        invoice.id === editedInvoice.id ? editedInvoice : invoice
      ));
      setSelectedInvoice(editedInvoice);
      setEditMode(false);
      setEditedInvoice(null);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedInvoice(null);
  };
  
  // State for new invoice form
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    client: {
      id: '',
      name: '',
      type: 'Particulier'
    },
    location: '',
    type: 'Particulier',
    tvaAmount: 0,
    tvaPercentage: 20,
    totalTTC: 0,
    paymentType: 'espèce',
    amountPaid: 0
  });
  
  const handleNewInvoiceChange = (field: string, value: any) => {
    const updatedInvoice = { ...newInvoice };
    
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      if (parentField === 'client') {
        updatedInvoice.client = {
          ...updatedInvoice.client!,
          [childField]: childField === 'type' ? value as 'Professionel' | 'Particulier' : value
        };
      } else if (parentField === 'contract') {
        if (!updatedInvoice.contract) {
          updatedInvoice.contract = { id: '', contractNumber: '' };
        }
        updatedInvoice.contract = {
          ...updatedInvoice.contract,
          [childField]: value
        };
      }
    } else {
      // Handle special calculations
      if (field === 'tvaPercentage' || field === 'totalTTC') {
        if (field === 'tvaPercentage') {
          const percentage = parseFloat(value);
          updatedInvoice.tvaPercentage = percentage;
          if (updatedInvoice.totalTTC) {
            updatedInvoice.tvaAmount = calculateTvaAmount(updatedInvoice.totalTTC, percentage);
          }
        } else if (field === 'totalTTC') {
          const total = parseFloat(value);
          updatedInvoice.totalTTC = total;
          if (updatedInvoice.tvaPercentage) {
            updatedInvoice.tvaAmount = calculateTvaAmount(total, updatedInvoice.tvaPercentage);
          }
        }
      } else if (field === 'tvaAmount') {
        updatedInvoice.tvaAmount = parseFloat(value);
      } else if (field === 'amountPaid') {
        updatedInvoice.amountPaid = parseFloat(value);
      } else {
        (updatedInvoice as any)[field] = value;
      }
    }
    
    setNewInvoice(updatedInvoice);
  };
  
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a unique ID
    const newId = (Math.max(0, ...invoices.map(i => parseInt(i.id))) + 1).toString();
    
    const createdInvoice: Invoice = {
      id: newId,
      invoiceNumber: newInvoice.invoiceNumber || `FAC-${new Date().getFullYear()}-${newId.padStart(3, '0')}`,
      invoiceDate: newInvoice.invoiceDate || new Date().toISOString().split('T')[0],
      client: newInvoice.client as Invoice['client'],
      location: newInvoice.location || '',
      type: newInvoice.type || 'Particulier',
      tvaAmount: newInvoice.tvaAmount || 0,
      tvaPercentage: newInvoice.tvaPercentage || 20,
      totalTTC: newInvoice.totalTTC || 0,
      paymentType: newInvoice.paymentType || 'espèce',
      amountPaid: newInvoice.amountPaid || 0,
      contract: newInvoice.contract
    };
    
    setInvoices([...invoices, createdInvoice]);
    setShowNewInvoiceModal(false);
    setNewInvoice({
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      client: {
        id: '',
        name: '',
        type: 'Particulier'
      },
      location: '',
      type: 'Particulier',
      tvaAmount: 0,
      tvaPercentage: 20,
      totalTTC: 0,
      paymentType: 'espèce',
      amountPaid: 0
    });
  };

  const handleInputChange = (field: keyof Invoice | 'client.name' | 'client.type' | 'contract.contractNumber', value: any) => {
    if (editedInvoice) {
      const updatedInvoice = { ...editedInvoice };
      
      // Handle nested objects
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        if (parentField === 'client') {
          updatedInvoice.client = {
            ...updatedInvoice.client,
            [childField]: childField === 'type' ? value as 'Professionel' | 'Particulier' : value
          };
        } else if (parentField === 'contract' && updatedInvoice.contract) {
          updatedInvoice.contract = {
            ...updatedInvoice.contract,
            [childField]: value
          };
        }
      } else {
        // Handle special cases for calculations
        if (field === 'tvaPercentage' || field === 'totalTTC') {
          // Update TVA amount when percentage or total changes
          if (field === 'tvaPercentage') {
            const percentage = parseFloat(value);
            updatedInvoice.tvaPercentage = percentage;
            // Calculate TVA amount based on percentage
            updatedInvoice.tvaAmount = calculateTvaAmount(updatedInvoice.totalTTC, percentage);
          } else if (field === 'totalTTC') {
            const total = parseFloat(value);
            updatedInvoice.totalTTC = total;
            // Calculate TVA amount based on new total
            updatedInvoice.tvaAmount = calculateTvaAmount(total, updatedInvoice.tvaPercentage);
          }
        } else if (field === 'tvaAmount') {
          // If TVA amount is directly changed
          updatedInvoice.tvaAmount = parseFloat(value);
          // Optionally recalculate total or percentage if needed
        } else if (field === 'amountPaid') {
          // Convert to number for amount paid
          updatedInvoice.amountPaid = parseFloat(value);
        } else {
          // For other fields, just update the value
          (updatedInvoice[field as keyof Invoice] as any) = value;
        }
      }
      
      setEditedInvoice(updatedInvoice);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Factures</h1>
        <button
          onClick={() => setShowNewInvoiceModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Facture
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une facture..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Facture
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant TTC
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedInvoice?.id === invoice.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Receipt size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                          {invoice.contract && (
                            <div className="text-xs text-gray-500">Contrat: {invoice.contract.contractNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.client.name}</div>
                      <div className="text-sm text-gray-500">{invoice.client.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.totalTTC.toLocaleString('fr-FR')} DH</div>
                      <div className="text-sm text-gray-500">TVA: {invoice.tvaAmount.toLocaleString('fr-FR')} DH</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.amountPaid >= invoice.totalTTC
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.amountPaid >= invoice.totalTTC ? 'Payée' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                          setEditedInvoice({ ...invoice });
                          setEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInvoice(invoice.id);
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

        {/* Invoice Details Panel */}
        <div className="lg:col-span-1">
          {selectedInvoice ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails de la facture</h2>
                {!editMode && (
                  <EditButton
                    onClick={handleEditClick}
                    size="sm"
                  />
                )}
              </div>
              
              <div className="p-4 space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">N° de Facture</h3>
                  <div className="mt-1 flex items-center">
                    <Receipt size={16} className="text-gray-400 mr-2" />
                    {editMode ? (
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editedInvoice?.invoiceNumber}
                        onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{selectedInvoice.invoiceNumber}</p>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Client</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedInvoice?.client.name}
                          onChange={(e) => handleInputChange('client.name', e.target.value)}
                        />
                        <select
                          className="w-full border rounded-lg p-2"
                          value={editedInvoice?.client.type}
                          onChange={(e) => handleInputChange('client.type', e.target.value as 'Professionel' | 'Particulier')}
                        >
                          <option value="Particulier">Particulier</option>
                          <option value="Professionel">Professionel</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedInvoice.client.name}</p>
                        <p className="text-sm text-gray-500">Type: {selectedInvoice.client.type}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Contract Info */}
                {selectedInvoice.contract && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contrat associé</h3>
                    <div className="mt-1 flex items-center">
                      <FileText size={16} className="text-gray-400 mr-2" />
                      <p className="text-sm text-gray-900">{selectedInvoice.contract.contractNumber}</p>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Paiement</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">TVA (%):</span>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-1/2 border rounded-lg p-2 text-right"
                          value={editedInvoice?.tvaPercentage}
                          onChange={(e) => handleInputChange('tvaPercentage', parseFloat(e.target.value))}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInvoice.tvaPercentage}%</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">TVA (DH):</span>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-1/2 border rounded-lg p-2 text-right"
                          value={editedInvoice?.tvaAmount}
                          onChange={(e) => handleInputChange('tvaAmount', parseFloat(e.target.value))}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInvoice.tvaAmount.toLocaleString('fr-FR')} DH</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total TTC:</span>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-1/2 border rounded-lg p-2 text-right"
                          value={editedInvoice?.totalTTC}
                          onChange={(e) => handleInputChange('totalTTC', parseFloat(e.target.value))}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInvoice.totalTTC.toLocaleString('fr-FR')} DH</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Montant payé:</span>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-1/2 border rounded-lg p-2 text-right"
                          value={editedInvoice?.amountPaid}
                          onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value))}
                        />
                      ) : (
                        <span className="text-sm text-green-600">
                          {selectedInvoice.amountPaid.toLocaleString('fr-FR')} DH
                        </span>
                      )}
                    </div>
                    {(editMode && editedInvoice ? editedInvoice.amountPaid : selectedInvoice.amountPaid) < 
                     (editMode && editedInvoice ? editedInvoice.totalTTC : selectedInvoice.totalTTC) && (
                      <div className="flex justify-between font-medium">
                        <span className="text-sm text-gray-500">Reste à payer:</span>
                        <span className="text-sm text-amber-600">
                          {((editMode && editedInvoice ? editedInvoice.totalTTC : selectedInvoice.totalTTC) - 
                            (editMode && editedInvoice ? editedInvoice.amountPaid : selectedInvoice.amountPaid)).toLocaleString('fr-FR')} DH
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Détails du paiement</h3>
                  <div className="mt-1 space-y-2">
                    {editMode ? (
                      <>
                        <select
                          className="w-full border rounded-lg p-2"
                          value={editedInvoice?.paymentType}
                          onChange={(e) => handleInputChange('paymentType', e.target.value)}
                        >
                          <option value="espèce">Espèce</option>
                          <option value="chèque">Chèque</option>
                          <option value="carte bancaire">Carte bancaire</option>
                          <option value="virement">Virement</option>
                        </select>
                        <input
                          type="date"
                          className="w-full border rounded-lg p-2"
                          value={editedInvoice?.invoiceDate}
                          onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedInvoice?.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Lieu"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">
                          Mode de paiement: {selectedInvoice.paymentType}
                        </p>
                        <p className="text-sm text-gray-500">
                          Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Lieu: {selectedInvoice.location}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit Mode Buttons */}
                {editMode ? (
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      onClick={() => window.print()}
                    >
                      Imprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Receipt size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune facture sélectionnée</h3>
                <p className="text-gray-500 mb-4">Sélectionnez une facture pour voir ses détails</p>
                <button 
                  onClick={() => setShowNewInvoiceModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouvelle facture
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Facture</h2>
            <form className="space-y-6" onSubmit={handleCreateInvoice}>
              {/* Basic Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° facture (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="FAC-2025-XXX"
                      value={newInvoice.invoiceNumber || ''}
                      onChange={(e) => handleNewInvoiceChange('invoiceNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date facture (*)
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                      value={newInvoice.invoiceDate || ''}
                      onChange={(e) => handleNewInvoiceChange('invoiceDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lieu facture
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="Ville"
                      value={newInvoice.location || ''}
                      onChange={(e) => handleNewInvoiceChange('location', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Client Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information Client (*)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="Nom du client"
                      value={newInvoice.client?.name || ''}
                      onChange={(e) => handleNewInvoiceChange('client.name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2" 
                      value={newInvoice.client?.type || 'Particulier'}
                      onChange={(e) => handleNewInvoiceChange('client.type', e.target.value)}
                      required
                    >
                      <option value="Professionel">Professionel</option>
                      <option value="Particulier">Particulier</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Contract Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information Contrat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° contrat
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="CTR-XXXX-XXX"
                      value={newInvoice.contract?.contractNumber || ''}
                      onChange={(e) => handleNewInvoiceChange('contract.contractNumber', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Payment Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information Paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      T.V.A (DH)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      placeholder="0.00"
                      value={newInvoice.tvaAmount || ''}
                      onChange={(e) => handleNewInvoiceChange('tvaAmount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      T.V.A (%)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      placeholder="20"
                      value={newInvoice.tvaPercentage || ''}
                      onChange={(e) => handleNewInvoiceChange('tvaPercentage', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant TTC
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      placeholder="0.00"
                      value={newInvoice.totalTTC || ''}
                      onChange={(e) => handleNewInvoiceChange('totalTTC', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type paiement
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2"
                      value={newInvoice.paymentType || 'espèce'}
                      onChange={(e) => handleNewInvoiceChange('paymentType', e.target.value)}
                    >
                      <option value="espèce">Espèce</option>
                      <option value="chèque">Chèque</option>
                      <option value="carte bancaire">Carte bancaire</option>
                      <option value="virement">Virement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant payé
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      placeholder="0.00"
                      value={newInvoice.amountPaid || ''}
                      onChange={(e) => handleNewInvoiceChange('amountPaid', e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Créer Facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Factures;