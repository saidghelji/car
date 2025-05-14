import React, { useState } from 'react';
import { Plus, Search, Car, Trash2, FileText, Upload } from 'lucide-react';
import EditButton from '../components/EditButton';

interface Vehicle {
  id: string;
  matricule: string;
  model: string;
}

interface TechnicalInspection {
  id: string;
  center: string;
  controlId: string;
  authorizationNumber: string;
  inspectionDate: string;
  duration: number;
  endDate: string;
  price: number;
  centerContact: string;
  observation: string;
  inspectionDocument?: string;
  vehicle: Vehicle;
  attachments: string[];
}

// Sample data
const initialInspections: TechnicalInspection[] = [
  {
    id: '1',
    center: 'AutoControl Plus',
    controlId: 'CT-2025-001',
    authorizationNumber: 'AUTH-12345',
    inspectionDate: '2025-05-09',
    duration: 12,
    endDate: '2026-05-09',
    price: 450,
    centerContact: '0522123456',
    observation: 'RAS',
    vehicle: {
      id: '1',
      matricule: 'AB-123-CD',
      model: 'Renault Clio'
    },
    attachments: []
  }
];

const VehicleInspections = () => {
  const [inspections, setInspections] = useState(initialInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<TechnicalInspection | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInspection, setEditedInspection] = useState<TechnicalInspection | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Filter inspections
  const filteredInspections = inspections.filter(inspection => {
    const searchString = searchTerm.toLowerCase();
    return (
      inspection.center.toLowerCase().includes(searchString) ||
      inspection.controlId.toLowerCase().includes(searchString) ||
      inspection.vehicle.matricule.toLowerCase().includes(searchString)
    );
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log(`File selected: ${file.name}`);
    }
  };

  const handleEditClick = () => {
    if (selectedInspection) {
      setEditedInspection({ ...selectedInspection });
      setEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedInspection) {
      setInspections(inspections.map(inspection =>
        inspection.id === editedInspection.id ? editedInspection : inspection
      ));
      setSelectedInspection(editedInspection);
      setEditMode(false);
      setEditedInspection(null);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedInspection(null);
  };

  const calculateEndDate = (startDate: string, durationMonths: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toISOString().split('T')[0];
  };

  const handleInputChange = (field: keyof TechnicalInspection, value: any) => {
    if (editedInspection) {
      const updatedInspection = { ...editedInspection };
      
      if (field === 'inspectionDate' || field === 'duration') {
        // Update end date when start date or duration changes
        const startDate = field === 'inspectionDate' ? value : editedInspection.inspectionDate;
        const duration = field === 'duration' ? value : editedInspection.duration;
        updatedInspection.endDate = calculateEndDate(startDate, duration);
      }
      
      (updatedInspection[field] as any) = value;
      setEditedInspection(updatedInspection);
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette visite technique ?')) {
      setInspections(inspections.filter(inspection => inspection.id !== inspectionId));
      if (selectedInspection?.id === inspectionId) {
        setSelectedInspection(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Visites Techniques</h1>
        <button
          onClick={() => setShowNewInspectionModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle Visite
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
              placeholder="Rechercher une visite technique..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspections List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
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
                {filteredInspections.map((inspection) => (
                  <tr
                    key={inspection.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedInspection?.id === inspection.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedInspection(inspection)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Car size={24} className="mx-auto mt-2 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{inspection.vehicle.model}</div>
                          <div className="text-xs text-gray-500">{inspection.vehicle.matricule}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{inspection.center}</div>
                      <div className="text-xs text-gray-500">ID: {inspection.controlId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(inspection.inspectionDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fin: {new Date(inspection.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inspection.price.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInspection(inspection);
                          setEditedInspection({ ...inspection });
                          setEditMode(true);
                          setIsEditing(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInspection(inspection.id);
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

        {/* Inspection Details Panel */}
        <div className="lg:col-span-1">
          {selectedInspection ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-medium">Détails de la visite technique</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Vehicle Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Véhicule</h3>
                  <div className="mt-1 flex items-center">
                    <Car size={16} className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-900">{selectedInspection.vehicle.model}</p>
                      <p className="text-xs text-gray-500">{selectedInspection.vehicle.matricule}</p>
                    </div>
                  </div>
                </div>

                {/* Center Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Centre de contrôle</h3>
                  <div className="mt-1 space-y-1">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2"
                          value={editedInspection?.center}
                          onChange={(e) => handleInputChange('center', e.target.value)}
                        />
                        <input
                          type="tel"
                          className="w-full border rounded-lg p-2"
                          value={editedInspection?.centerContact}
                          onChange={(e) => handleInputChange('centerContact', e.target.value)}
                          placeholder="Contact du centre"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900">{selectedInspection.center}</p>
                        <p className="text-sm text-gray-500">Contact: {selectedInspection.centerContact}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Control Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Informations contrôle</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">ID Contrôle:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInspection?.controlId}
                          onChange={(e) => handleInputChange('controlId', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInspection.controlId}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">N° Autorisation:</span>
                      {editMode ? (
                        <input
                          type="text"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInspection?.authorizationNumber}
                          onChange={(e) => handleInputChange('authorizationNumber', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInspection.authorizationNumber}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates and Duration */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dates</h3>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date visite:</span>
                      {editMode ? (
                        <input
                          type="date"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInspection?.inspectionDate}
                          onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {new Date(selectedInspection.inspectionDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Durée:</span>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-2/3 border rounded-lg p-2"
                          value={editedInspection?.duration}
                          onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                          min="1"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{selectedInspection.duration} mois</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date fin:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedInspection.endDate).toLocaleDateString('fr-FR')}
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
                      value={editedInspection?.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-blue-600">
                      {selectedInspection.price.toLocaleString('fr-FR')} DH
                    </p>
                  )}
                </div>

                {/* Observation */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Observation</h3>
                  {editMode ? (
                    <textarea
                      className="w-full border rounded-lg p-2 mt-1"
                      value={editedInspection?.observation}
                      onChange={(e) => handleInputChange('observation', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    selectedInspection.observation && (
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedInspection.observation}
                      </p>
                    )
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                  <div className="mt-2 space-y-2">
                    {selectedInspection.inspectionDocument && (
                      <a 
                        href={selectedInspection.inspectionDocument}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={16} className="mr-2" />
                        Rapport de visite technique
                      </a>
                    )}
                    {selectedInspection.attachments.map((attachment, index) => (
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

                {/* Edit and Save Buttons */}
                {editMode ? (
                  <div className="flex justify-end space-x-4">
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
                  <div className="flex justify-end">
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
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune visite sélectionnée</h3>
                <p className="text-gray-500 mb-4">Sélectionnez une visite pour voir ses détails</p>
                <button 
                  onClick={() => setShowNewInspectionModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Nouvelle visite
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Inspection Modal */}
      {showNewInspectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nouvelle Visite Technique</h2>
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

              {/* Inspection Information */}
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">Informations visite</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Centre (*)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identifiant contrôle
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° autorisation
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date visite (*)
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
                      Contact centre
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
              <section className="border-b pb-4">
                <h3 className="font-semibold mb-3">La visite</h3>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="inspection-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Télécharger un fichier</span>
                        <input
                          id="inspection-upload"
                          name="inspection-upload"
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

              {/* Additional Attachments */}
              <section>
                <h3 className="font-semibold mb-3">Autres pièces jointes</h3>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="attachments-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Ajouter des documents</span>
                        <input
                          id="attachments-upload"
                          name="attachments-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">ou glisser et déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG jusqu'à 10MB
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewInspectionModal(false)}
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

export default VehicleInspections;