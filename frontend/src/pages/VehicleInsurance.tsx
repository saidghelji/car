import React, { useState } from 'react';
import { Plus, Search, Car, FileText, Trash2, Upload } from 'lucide-react';
import EditButton from '../components/EditButton';

interface Vehicle {
  id: string;
  matricule: string;
  model: string;
}

interface Insurance {
  id: string;
  company: string;
  policyNumber: string;
  operationDate: string;
  startDate: string;
  duration: number;
  endDate: string;
  price: number;
  contactInfo: string;
  observation: string;
  insuranceDocument?: string;
  vehicle: Vehicle;
  attachments: string[];
}

// Sample data
const initialInsurances: Insurance[] = [
  {
    id: '1',
    company: 'AssurAuto Plus',
    policyNumber: 'POL-2025-001',
    operationDate: '2025-05-01',
    startDate: '2025-05-09',
    duration: 12,
    endDate: '2026-05-09',
    price: 3500,
    contactInfo: '0522987654',
    observation: 'Assurance tous risques',
    vehicle: {
      id: '1',
      matricule: 'AB-123-CD',
      model: 'Renault Clio'
    },
    attachments: []
  }
];

const VehicleInsurance = () => {
  const [insurances, setInsurances] = useState(initialInsurances);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInsuranceModal, setShowNewInsuranceModal] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInsurance, setEditedInsurance] = useState<Insurance | null>(null);

  const filteredInsurances = insurances.filter(insurance => {
    const searchString = searchTerm.toLowerCase();
    return (
      insurance.company.toLowerCase().includes(searchString) ||
      insurance.policyNumber.toLowerCase().includes(searchString) ||
      insurance.vehicle.matricule.toLowerCase().includes(searchString)
    );
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real application, we would upload the file here
      // For now we just store it in state
      setSelectedFile(file);
      // You could also add preview functionality here
      console.log(`File selected: ${file.name}`);
    }
  };

  const calculateEndDate = (startDate: string, durationMonths: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toISOString().split('T')[0];
  };

  const handleInputChange = (field: keyof Insurance, value: any) => {
    if (editedInsurance) {
      const updatedInsurance = { ...editedInsurance } as Insurance;
      
      if (field === 'startDate' || field === 'duration') {
        // Update end date when start date or duration changes
        const startDate = field === 'startDate' ? value : editedInsurance.startDate;
        const duration = field === 'duration' ? value : editedInsurance.duration;
        updatedInsurance.endDate = calculateEndDate(startDate, duration);
      }
      
      (updatedInsurance[field] as any) = value;
      setEditedInsurance(updatedInsurance);
    }
  };

  const handleEditClick = () => {
    if (selectedInsurance) {
      setEditedInsurance({ ...selectedInsurance });
      setEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedInsurance) {
      setInsurances(insurances.map(insurance =>
        insurance.id === editedInsurance.id ? editedInsurance : insurance
      ));
      setSelectedInsurance(editedInsurance);
      setEditMode(false);
      setEditedInsurance(null);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedInsurance(null);
  };

  const handleDeleteInsurance = (insuranceId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette assurance ?')) {
      setInsurances(insurances.filter(insurance => insurance.id !== insuranceId));
      if (selectedInsurance?.id === insuranceId) {
        setSelectedInsurance(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Assurances</h1>
        <button
          onClick={() => setShowNewInsuranceModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Assurance
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
              placeholder="Rechercher une assurance..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insurances List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
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
                    key={insurance.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedInsurance?.id === insurance.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedInsurance(insurance)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Car size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{insurance.vehicle.model}</div>
                          <div className="text-xs text-gray-500">{insurance.vehicle.matricule}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{insurance.company}</div>
                      <div className="text-xs text-gray-500">Police: {insurance.policyNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(insurance.startDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fin: {new Date(insurance.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {insurance.price.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditMode(true);
                          setSelectedInsurance(insurance);
                          setEditedInsurance(insurance);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInsurance(insurance.id);
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

        {/* Insurance Details Panel */}
        <div className="lg:col-span-1">
          {selectedInsurance ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-medium">Détails de l'assurance</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Vehicle Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Véhicule</h3>
                  <div className="mt-1 flex items-center">
                    <Car size={16} className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-900">{selectedInsurance.vehicle.model}</p>
                      <p className="text-xs text-gray-500">{selectedInsurance.vehicle.matricule}</p>
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Compagnie d'assurance</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedInsurance?.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                        />
                        <input
                          type="tel"
                          className="w-full border rounded-lg p-2"
                          value={editedInsurance?.contactInfo}
                          onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                          placeholder="Contact de l'assurance"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedInsurance.company}</p>
                        <p className="text-sm text-gray-500">Contact: {selectedInsurance.contactInfo}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Policy Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Informations police</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">N° Police:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInsurance?.policyNumber}
                          onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInsurance.policyNumber}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date opération:</span>
                      {editMode ? (
                        <input
                          type="date"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInsurance?.operationDate}
                          onChange={(e) => handleInputChange('operationDate', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {new Date(selectedInsurance.operationDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates and Duration */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dates</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date début:</span>
                      {editMode ? (
                        <input
                          type="date"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInsurance?.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {new Date(selectedInsurance.startDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Durée:</span>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInsurance?.duration}
                          onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                          min="1"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInsurance.duration} mois</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date fin:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(editMode && editedInsurance ? editedInsurance.endDate : selectedInsurance.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Prix</h3>
                  {editMode ? (
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2 mt-1"
                      value={editedInsurance?.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-blue-600">
                      {selectedInsurance.price.toLocaleString('fr-FR')} DH
                    </p>
                  )}
                </div>

                {/* Observation */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Observation</h3>
                  {editMode ? (
                    <textarea
                      className="w-full border rounded-lg p-2 mt-1"
                      value={editedInsurance?.observation}
                      onChange={(e) => handleInputChange('observation', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    selectedInsurance.observation && (
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedInsurance.observation}
                      </p>
                    )
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                  <div className="mt-2 space-y-2">
                    {selectedInsurance.insuranceDocument && (
                      <a 
                        href={selectedInsurance.insuranceDocument}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={16} className="mr-2" />
                        Police d'assurance
                      </a>
                    )}
                    {selectedInsurance.attachments.map((attachment, index) => (
                      <a 
                        key={index}
                        href={attachment}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={16} className="mr-2" />
                        Pièce jointe {index + 1}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Edit Mode Buttons or Edit Button */}
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
                      type="button"
                      onClick={handleEditClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Car size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune assurance sélectionnée</h3>
                <p className="text-gray-500 mb-4">Sélectionnez une assurance pour voir ses détails</p>
                <button 
                  onClick={() => setShowNewInsuranceModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouvelle assurance
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Insurance Modal */}
      {showNewInsuranceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Assurance</h2>
            <form className="space-y-6">
              {/* Vehicle Selection */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Véhicule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matricule (*)
                    </label>
                    <select className="w-full border rounded-lg p-2" required>
                      <option value="">Sélectionner un véhicule</option>
                      {/* Will be populated from available vehicles */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modèle
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      disabled
                      placeholder="Auto-rempli"
                    />
                  </div>
                </div>
              </section>

              {/* Insurance Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informations assurance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assurance (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro police (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date opération
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date début (*)
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée (mois) (*)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date fin
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-2 bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (*)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact assurance
                    </label>
                    <input
                      type="tel"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observation
                  </label>
                  <textarea
                    className="w-full border rounded-lg p-2"
                    rows={3}
                  />
                </div>
              </section>

              {/* Documents Upload */}
              <section>
                <h3 className="font-semibold mb-3">Police d'assurance</h3>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="insurance-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Télécharger un fichier</span>
                        <input
                          id="insurance-upload"
                          name="insurance-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">ou glisser et déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG jusqu'à 10MB
                    </p>
                    {selectedFile && (
                      <div className="mt-2 text-sm text-gray-900">
                        Fichier sélectionné: {selectedFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewInsuranceModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleInsurance;