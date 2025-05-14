import React, { useState } from 'react';
import { Plus, Search, Receipt, FileText, Trash2, Upload } from 'lucide-react';
import EditButton from '../components/EditButton';

type PaymentType = 'espèce' | 'chèque' | 'carte bancaire' | 'virement';
type PaymentFor = 'contract' | 'facture' | 'accident';

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentFor: PaymentFor;
  referenceNumber: string;  // Contract/Invoice/Accident number
  client: {
    id: string;
    name: string;
  };
  remainingAmount: number;
  paymentType: PaymentType;
  amountPaid: number;
  attachmentUrl?: string;
  attachmentName?: string;
}

// Sample data
const initialPayments: PaymentRecord[] = [
  {
    id: '1',
    paymentNumber: 'REG-2025-001',
    paymentDate: '2025-05-09',
    paymentFor: 'contract',
    referenceNumber: 'CTR-2025-001',
    client: {
      id: '1',
      name: 'Jean Dupont'
    },
    remainingAmount: 0,
    paymentType: 'carte bancaire',
    amountPaid: 1500,
    attachmentUrl: '/attachments/payment1.pdf',
    attachmentName: 'Reçu_Paiement_CTR-2025-001.pdf'
  }
];

const ClientPayments = () => {
  const [payments, setPayments] = useState(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPayment, setEditedPayment] = useState<PaymentRecord | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // We'll implement file handling when needed
    const file = event.target.files?.[0];
    if (file) {
      // Handle the file upload
    }
  };

  const filteredPayments = payments.filter(payment => {
    const searchString = searchTerm.toLowerCase();
    return (
      payment.paymentNumber.toLowerCase().includes(searchString) ||
      payment.client.name.toLowerCase().includes(searchString) ||
      payment.referenceNumber.toLowerCase().includes(searchString)
    );
  });

  const handleDeletePayment = (paymentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce réglement ?')) {
      setPayments(payments.filter(payment => payment.id !== paymentId));
      setSelectedPayment(null);
    }
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setEditedPayment({ ...payment });
    setIsEditMode(true);
  };

  const handleNewPayment = () => {
    setSelectedPayment(null);
    setIsEditMode(false);
    setShowPaymentModal(true);
  };
  
  const handleSaveEdit = () => {
    if (editedPayment) {
      setPayments(payments.map(payment =>
        payment.id === editedPayment.id ? editedPayment : payment
      ));
      setSelectedPayment(editedPayment);
      setIsEditMode(false);
      setEditedPayment(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedPayment(null);
  };
  
  const handleInputChange = (field: keyof PaymentRecord, value: any) => {
    if (editedPayment) {
      const updatedPayment = { ...editedPayment };
      
      if (field === 'client') {
        updatedPayment.client = { ...updatedPayment.client, ...value };
      } else {
        (updatedPayment[field] as any) = value;
      }
      
      setEditedPayment(updatedPayment);
    }
  };

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

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un réglement..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payments List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
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
                    key={payment.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedPayment?.id === payment.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Receipt size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{payment.paymentNumber}</div>
                          <div className="text-xs text-gray-500">Ref: {payment.referenceNumber}</div>
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
                      <div className="text-sm text-gray-900">{payment.client.name}</div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                          setEditedPayment({ ...payment });
                          setIsEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePayment(payment.id);
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

        {/* Payment Details Panel */}
        <div className="lg:col-span-1">
          {selectedPayment ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails du réglement</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">N° de Réglement</h3>
                  <div className="mt-1 flex items-center">
                    <Receipt size={16} className="text-gray-400 mr-2" />
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editedPayment?.paymentNumber}
                        onChange={(e) => handleInputChange('paymentNumber', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{selectedPayment.paymentNumber}</p>
                    )}
                  </div>
                </div>

                {/* Reference Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Réglé pour</h3>
                  <div className="mt-1 space-y-1">
                    {isEditMode ? (
                      <>
                        <select
                          className="w-full border rounded-lg p-2"
                          value={editedPayment?.paymentFor}
                          onChange={(e) => handleInputChange('paymentFor', e.target.value as PaymentFor)}
                        >
                          <option value="contract">Contrat</option>
                          <option value="facture">Facture</option>
                          <option value="accident">Accident</option>
                        </select>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 mt-2"
                          placeholder="N° Référence"
                          value={editedPayment?.referenceNumber}
                          onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">
                          {selectedPayment.paymentFor === 'contract' ? 'Contrat' :
                           selectedPayment.paymentFor === 'facture' ? 'Facture' : 'Accident'}
                        </p>
                        <p className="text-sm text-gray-500">
                          N° Référence: {selectedPayment.referenceNumber}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Client</h3>
                  <div className="mt-1">
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={editedPayment?.client.name}
                        onChange={(e) => handleInputChange('client', { name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{selectedPayment.client.name}</p>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Détails du paiement</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Mode de paiement:</span>
                      {isEditMode ? (
                        <select
                          className="w-2/3 border rounded-lg p-2"
                          value={editedPayment?.paymentType}
                          onChange={(e) => handleInputChange('paymentType', e.target.value as PaymentType)}
                        >
                          <option value="espèce">Espèce</option>
                          <option value="chèque">Chèque</option>
                          <option value="carte bancaire">Carte bancaire</option>
                          <option value="virement">Virement</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">{selectedPayment.paymentType}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Montant payé:</span>
                      {isEditMode ? (
                        <input
                          type="number"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedPayment?.amountPaid}
                          onChange={(e) => handleInputChange('amountPaid', parseFloat(e.target.value))}
                        />
                      ) : (
                        <span className="text-sm text-green-600">
                          {selectedPayment.amountPaid.toLocaleString('fr-FR')} DH
                        </span>
                      )}
                    </div>
                    {(selectedPayment.remainingAmount > 0 || isEditMode) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Reste à payer:</span>
                        {isEditMode ? (
                          <input
                            type="number"
                            className="w-2/3 border rounded-lg p-2"
                            value={editedPayment?.remainingAmount}
                            onChange={(e) => handleInputChange('remainingAmount', parseFloat(e.target.value))}
                          />
                        ) : (
                          <span className="text-sm text-amber-600">
                            {selectedPayment.remainingAmount.toLocaleString('fr-FR')} DH
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date de paiement</h3>
                  <div className="mt-1">
                    {isEditMode ? (
                      <input
                        type="date"
                        className="w-full border rounded-lg p-2"
                        value={editedPayment?.paymentDate}
                        onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {new Date(selectedPayment.paymentDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attachment */}
                {selectedPayment.attachmentUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Pièce jointe</h3>
                    <div className="mt-1">
                      <a 
                        href={selectedPayment.attachmentUrl}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={16} className="mr-2" />
                        {selectedPayment.attachmentName}
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  {isEditMode ? (
                    <div className="flex space-x-3">
                      <button 
                        onClick={handleCancelEdit}
                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={handleSaveEdit}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleEditPayment(selectedPayment)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDeletePayment(selectedPayment.id)}
                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Receipt size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun réglement sélectionné</h3>
                <p className="text-gray-500 mb-4">Sélectionnez un réglement pour voir ses détails</p>
                <button 
                  onClick={handleNewPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouveau réglement
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Modifier Réglement' : 'Nouveau Réglement'}</h2>
            <form className="space-y-6">
              {/* Basic Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informations réglement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° réglement (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="REG-2025-XXX"
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.paymentNumber : ''}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de réglement (*)
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.paymentDate : ''}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Régler (*)
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2" 
                      required
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.paymentFor : ''}
                    >
                      <option value="">Sélectionner le type</option>
                      <option value="contract">Contrat</option>
                      <option value="facture">Facture</option>
                      <option value="accident">Accident</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Reference Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information référence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° de référence (*)
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2" 
                      required
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.referenceNumber : ''}
                    >
                      <option value="">Sélectionner une référence</option>
                      {/* Will be populated based on selected type */}
                      {isEditMode && selectedPayment && (
                        <option value={selectedPayment.referenceNumber}>{selectedPayment.referenceNumber}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      placeholder="Auto-rempli"
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.client.name : ''}
                      disabled
                    />
                  </div>
                </div>
              </section>

              {/* Payment Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Information paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant restant
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      placeholder="0.00"
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.remainingAmount : 0}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type paiement (*)
                    </label>
                    <select 
                      className="w-full border rounded-lg p-2" 
                      required
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.paymentType : ''}
                    >
                      <option value="">Sélectionner</option>
                      <option value="espèce">Espèce</option>
                      <option value="chèque">Chèque</option>
                      <option value="carte bancaire">Carte bancaire</option>
                      <option value="virement">Virement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant payé (*)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      placeholder="0.00"
                      defaultValue={isEditMode && selectedPayment ? selectedPayment.amountPaid : ''}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Attachment Section */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Pièce jointe</h3>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Télécharger un fichier</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">ou glisser et déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG, GIF jusqu'à 10MB
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {isEditMode ? 'Mettre à jour' : 'Créer Réglement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPayments;
