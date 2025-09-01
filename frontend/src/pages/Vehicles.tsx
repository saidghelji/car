import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Filter, Plus, Trash2,
  X, Car, Upload, FileText
} from 'lucide-react';
import EditButton from '../components/EditButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import toast from 'react-hot-toast';
import FileUploader, { Document, FilePreview } from '../components/FileUploader';

registerLocale('fr', fr);

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

type FuelType = 'diesel' | 'essence' | 'electrique' | 'hybride';
type FuelLevel = 'reserve' | '1/4' | '1/2' | '3/4' | 'plein';

interface VehicleEquipment {
  pneuDeSecours: boolean;
  posteRadio: boolean;
  cricManivelle: boolean;
  allumeCigare: boolean;
  jeuDe4Tapis: boolean;
  vetDeSecurite: boolean;
  [key: string]: boolean; // Allow indexing with string for dynamic access
}

const VEHICLE_EQUIPMENT_OPTIONS = [
  { id: 'pneuDeSecours', label: 'PNEU DE SECOURS' },
  { id: 'posteRadio', label: 'POSTE RADIO' },
  { id: 'cricManivelle', label: 'CRIC MANIVELLE' },
  { id: 'allumeCigare', label: 'ALLUME CIGARE' },
  { id: 'jeuDe4Tapis', label: 'JEU DE 4 TAPIS' },
  { id: 'vetDeSecurite', label: 'VÊT.DE SÉCURITÉ' },
];

export interface Vehicle {
  _id: string;
  id?: string; // Add id for consistency with backend Contract model's embedded vehicle
  chassisNumber: string;
  imageUrl?: string;
  temporaryPlate?: string;
  licensePlate: string;
  brand: string;
  model: string;
  circulationDate: string;
  fuelType: FuelType;
  fuelLevel: FuelLevel;
  mileage: number;
  color: string;
  colorCode?: string;
  rentalPrice: number;
  nombreDePlaces?: number;
  nombreDeVitesses?: number;
  transmission?: string; // Added field
  observation?: string;
  equipment: VehicleEquipment;
  documents?: Document[];
  autorisationDate?: string;
  autorisationValidity?: string;
  carteGriseDate?: string;
  carteGriseValidity?: string;
  statut?: 'En parc' | 'En circulation'; // Added field
  createdAt: string;
  updatedAt: string;
}

const VehicleForm = ({
  onSubmit,
  onClose,
  initialData = null,
  API_URL
}: {
  onSubmit: (data: Partial<Vehicle>, files: File[]) => void;
  onClose: () => void;
  initialData?: Vehicle | null;
  API_URL: string;
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);
  const [circulationDate, setCirculationDate] = useState<Date | null>(
    initialData?.circulationDate ? new Date(initialData.circulationDate) : null
  );
  const [autorisationDate, setAutorisationDate] = useState<Date | null>(
    initialData?.autorisationDate ? new Date(initialData.autorisationDate) : null
  );
  const [autorisationValidity, setAutorisationValidity] = useState<Date | null>(
    initialData?.autorisationValidity ? new Date(initialData.autorisationValidity) : null
  );
  const [carteGriseDate, setCarteGriseDate] = useState<Date | null>(
    initialData?.carteGriseDate ? new Date(initialData.carteGriseDate) : null
  );
  const [carteGriseValidity, setCarteGriseValidity] = useState<Date | null>(
    initialData?.carteGriseValidity ? new Date(initialData.carteGriseValidity) : null
  );

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (name: string, value: string | number | undefined | Date | null, required: boolean, label: string) => {
    let error = '';
    if (required) {
      if (typeof value === 'string' && value.trim() === '') {
        error = `${label} ne peut pas être vide ou contenir uniquement des espaces.`;
      } else if (typeof value === 'number' && value < 1) {
        error = `${label} ne peut pas être inférieur à 1.`;
      } else if (value === null || value === undefined) {
        error = `${label} est obligatoire.`;
      }
    } else if (typeof value === 'string' && value.length > 0 && value.trim() === '') {
      error = `${label} ne peut pas contenir uniquement des espaces.`;
    }
    setValidationErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const vehicleData: Partial<Vehicle> = {
      chassisNumber: formData.get('chassisNumber') as string,
      temporaryPlate: formData.get('temporaryPlate') as string,
      licensePlate: formData.get('licensePlate') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      circulationDate: formData.get('circulationDate') as string,
      fuelType: formData.get('fuelType') as FuelType,
      fuelLevel: formData.get('fuelLevel') as FuelLevel,
      mileage: Number(formData.get('mileage')),
      color: formData.get('color') as string,
      colorCode: formData.get('colorCode') as string,
      rentalPrice: Number(formData.get('rentalPrice')),
      nombreDePlaces: Number(formData.get('nombreDePlaces')),
      nombreDeVitesses: Number(formData.get('nombreDeVitesses')),
      transmission: formData.get('transmission') as string, // Added field
      observation: formData.get('observation') as string,
      statut: formData.get('statut') as 'En parc' | 'En circulation',
      equipment: {
        pneuDeSecours: formData.get('pneuDeSecours') === 'on',
        posteRadio: formData.get('posteRadio') === 'on',
        cricManivelle: formData.get('cricManivelle') === 'on',
        allumeCigare: formData.get('allumeCigare') === 'on',
        jeuDe4Tapis: formData.get('jeuDe4Tapis') === 'on',
        vetDeSecurite: formData.get('vetDeSecurite') === 'on',
      },
      autorisationDate: autorisationDate ? autorisationDate.toISOString().split('T')[0] : undefined,
      autorisationValidity: autorisationValidity ? autorisationValidity.toISOString().split('T')[0] : undefined,
      carteGriseDate: carteGriseDate ? carteGriseDate.toISOString().split('T')[0] : undefined,
      carteGriseValidity: carteGriseValidity ? carteGriseValidity.toISOString().split('T')[0] : undefined,
    };

    let hasErrors = false;
    const newErrors: {[key: string]: string} = {};

    // Validate text fields
    newErrors.chassisNumber = validateField('chassisNumber', vehicleData.chassisNumber, true, 'Numéro de châssis');
    newErrors.temporaryPlate = validateField('temporaryPlate', vehicleData.temporaryPlate, false, 'Matricule WW');
    newErrors.licensePlate = validateField('licensePlate', vehicleData.licensePlate, true, 'Matricule');
    newErrors.brand = validateField('brand', vehicleData.brand, true, 'Marque');
    newErrors.model = validateField('model', vehicleData.model, true, 'Modèle');
    newErrors.color = validateField('color', vehicleData.color, false, 'Couleur');
    newErrors.colorCode = validateField('colorCode', vehicleData.colorCode, false, 'Code couleur');
    newErrors.observation = validateField('observation', vehicleData.observation, false, 'Observation');

    // Validate number fields
    newErrors.nombreDePlaces = validateField('nombreDePlaces', vehicleData.nombreDePlaces, false, 'Nombre de places');
    newErrors.nombreDeVitesses = validateField('nombreDeVitesses', vehicleData.nombreDeVitesses, false, 'Nombre de vitesses');
    newErrors.rentalPrice = validateField('rentalPrice', vehicleData.rentalPrice, true, 'Prix location');
    newErrors.mileage = validateField('mileage', vehicleData.mileage, true, 'Kilométrage');

    // Validate date fields
    newErrors.autorisationDate = validateField('autorisationDate', autorisationDate, true, 'Date autorisation (I/C)');
    newErrors.autorisationValidity = validateField('autorisationValidity', autorisationValidity, true, 'Validité autorisation');
    newErrors.carteGriseDate = validateField('carteGriseDate', carteGriseDate, true, 'Date carte grise');
    newErrors.carteGriseValidity = validateField('carteGriseValidity', carteGriseValidity, true, 'Validité carte grise');

    for (const key in newErrors) {
      if (newErrors[key]) {
        hasErrors = true;
        break;
      }
    }
    setValidationErrors(newErrors);

    if (hasErrors) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    if (imagePreview) {
      vehicleData.imageUrl = imagePreview;
    }

    onSubmit(vehicleData, newAttachmentFiles);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {initialData ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Vehicle Information */}
          <section>
            <h3 className="text-lg font-medium mb-4">Informations véhicule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de châssis*
                </label>
                <input
                  name="chassisNumber"
                  type="text"
                  required
                  className={`w-full border rounded-lg p-2 ${validationErrors.chassisNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.chassisNumber}
                  onChange={(e) => validateField('chassisNumber', e.target.value, true, 'Numéro de châssis')}
                />
                {validationErrors.chassisNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.chassisNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image du véhicule
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Choisir une image
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="h-20 w-auto rounded-md"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matricule WW
                </label>
                <input
                  name="temporaryPlate"
                  type="text"
                  className={`w-full border rounded-lg p-2 ${validationErrors.temporaryPlate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.temporaryPlate}
                  onChange={(e) => validateField('temporaryPlate', e.target.value, false, 'Matricule WW')}
                />
                {validationErrors.temporaryPlate && <p className="text-red-500 text-xs mt-1">{validationErrors.temporaryPlate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matricule*
                </label>
                <input
                  name="licensePlate"
                  type="text"
                  required
                  className={`w-full border rounded-lg p-2 ${validationErrors.licensePlate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.licensePlate}
                  onChange={(e) => validateField('licensePlate', e.target.value, true, 'Matricule')}
                />
                {validationErrors.licensePlate && <p className="text-red-500 text-xs mt-1">{validationErrors.licensePlate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marque*
                </label>
                <input
                  name="brand"
                  type="text"
                  required
                  className={`w-full border rounded-lg p-2 ${validationErrors.brand ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.brand}
                  onChange={(e) => validateField('brand', e.target.value, true, 'Marque')}
                />
                {validationErrors.brand && <p className="text-red-500 text-xs mt-1">{validationErrors.brand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle*
                </label>
                <input
                  name="model"
                  type="text"
                  required
                  className={`w-full border rounded-lg p-2 ${validationErrors.model ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.model}
                  onChange={(e) => validateField('model', e.target.value, true, 'Modèle')}
                />
                {validationErrors.model && <p className="text-red-500 text-xs mt-1">{validationErrors.model}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date mise en circulation
                </label>
                <DatePicker
                  selected={circulationDate}
                  onChange={(date: Date | null) => setCirculationDate(date)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="hidden"
                  name="circulationDate"
                  value={circulationDate ? circulationDate.toISOString().split('T')[0] : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type carburant*
                </label>
                <select
                  name="fuelType"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.fuelType}
                >
                  <option value="diesel">Diesel</option>
                  <option value="essence">Essence</option>
                  <option value="electrique">Électrique</option>
                  <option value="hybride">Hybride</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau carburant*
                </label>
                <select
                  name="fuelLevel"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.fuelLevel}
                >
                  <option value="reserve">Réserve</option>
                  <option value="1/4">1/4</option>
                  <option value="1/2">1/2</option>
                  <option value="3/4">3/4</option>
                  <option value="plein">Plein</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilométrage*
                </label>
                <input
                  name="mileage"
                  type="number"
                  required
                  className={`w-full border rounded-lg p-2 ${validationErrors.mileage ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.mileage}
                  onChange={(e) => validateField('mileage', Number(e.target.value), true, 'Kilométrage')}
                />
                {validationErrors.mileage && <p className="text-red-500 text-xs mt-1">{validationErrors.mileage}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  name="color"
                  type="text"
                  className={`w-full border rounded-lg p-2 ${validationErrors.color ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.color}
                  onChange={(e) => validateField('color', e.target.value, false, 'Couleur')}
                />
                {validationErrors.color && <p className="text-red-500 text-xs mt-1">{validationErrors.color}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code couleur
                </label>
                <input
                  name="colorCode"
                  type="text"
                  className={`w-full border rounded-lg p-2 ${validationErrors.colorCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.colorCode}
                  onChange={(e) => validateField('colorCode', e.target.value, false, 'Code couleur')}
                />
                {validationErrors.colorCode && <p className="text-red-500 text-xs mt-1">{validationErrors.colorCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix location*
                </label>
                <input
                  name="rentalPrice"
                  type="number"
                  required
                  className={`w-full border rounded-lg p-2 ${validationErrors.rentalPrice ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.rentalPrice}
                  onChange={(e) => validateField('rentalPrice', Number(e.target.value), true, 'Prix location')}
                />
                {validationErrors.rentalPrice && <p className="text-red-500 text-xs mt-1">{validationErrors.rentalPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de places
                </label>
                <input
                  name="nombreDePlaces"
                  type="number"
                  className={`w-full border rounded-lg p-2 ${validationErrors.nombreDePlaces ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.nombreDePlaces}
                  onChange={(e) => validateField('nombreDePlaces', Number(e.target.value), false, 'Nombre de places')}
                />
                {validationErrors.nombreDePlaces && <p className="text-red-500 text-xs mt-1">{validationErrors.nombreDePlaces}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de vitesses
                </label>
                <input
                  name="nombreDeVitesses"
                  type="number"
                  className={`w-full border rounded-lg p-2 ${validationErrors.nombreDeVitesses ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  defaultValue={initialData?.nombreDeVitesses}
                  onChange={(e) => validateField('nombreDeVitesses', Number(e.target.value), false, 'Nombre de vitesses')}
                />
                {validationErrors.nombreDeVitesses && <p className="text-red-500 text-xs mt-1">{validationErrors.nombreDeVitesses}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission
                </label>
                <select
                  name="transmission"
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.transmission || ''}
                >
                  <option value="">Sélectionner</option>
                  <option value="Manuelle">Manuelle</option>
                  <option value="Automatique">Automatique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut*
                </label>
                <select
                  name="statut"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.statut || 'En parc'}
                >
                  <option value="En parc">En parc</option>
                  <option value="En circulation">En circulation</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observation
                </label>
                <textarea
                  name="observation"
                  className={`w-full border rounded-lg p-2 ${validationErrors.observation ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  rows={3}
                  defaultValue={initialData?.observation}
                  onChange={(e) => validateField('observation', e.target.value, false, 'Observation')}
                />
                {validationErrors.observation && <p className="text-red-500 text-xs mt-1">{validationErrors.observation}</p>}
              </div>
            </div>
          </section>

          {/* Equipment Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">Équipements/Accessoires</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {VEHICLE_EQUIPMENT_OPTIONS.map(item => (
                <div key={item.id} className="flex items-center">
                  <input
                    name={item.id}
                    type="checkbox"
                    id={item.id}
                    defaultChecked={initialData?.equipment?.[item.id]}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={item.id} className="ml-2 block text-sm text-gray-900">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Papiers véhicule Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">Papiers véhicule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date autorisation (I/C)*
                </label>
                <DatePicker
                  selected={autorisationDate}
                  onChange={(date: Date | null) => {
                    setAutorisationDate(date);
                    validateField('autorisationDate', date, true, 'Date autorisation (I/C)');
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="jj/mm/aaaa"
                  className={`w-full border rounded-lg p-2 ${validationErrors.autorisationDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.autorisationDate && <p className="text-red-500 text-xs mt-1">{validationErrors.autorisationDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validité autorisation*
                </label>
                <DatePicker
                  selected={autorisationValidity}
                  onChange={(date: Date | null) => {
                    setAutorisationValidity(date);
                    validateField('autorisationValidity', date, true, 'Validité autorisation');
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="jj/mm/aaaa"
                  className={`w-full border rounded-lg p-2 ${validationErrors.autorisationValidity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.autorisationValidity && <p className="text-red-500 text-xs mt-1">{validationErrors.autorisationValidity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date carte grise*
                </label>
                <DatePicker
                  selected={carteGriseDate}
                  onChange={(date: Date | null) => {
                    setCarteGriseDate(date);
                    validateField('carteGriseDate', date, true, 'Date carte grise');
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="jj/mm/aaaa"
                  className={`w-full border rounded-lg p-2 ${validationErrors.carteGriseDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.carteGriseDate && <p className="text-red-500 text-xs mt-1">{validationErrors.carteGriseDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validité carte grise*
                </label>
                <DatePicker
                  selected={carteGriseValidity}
                  onChange={(date: Date | null) => {
                    setCarteGriseValidity(date);
                    validateField('carteGriseValidity', date, true, 'Validité carte grise');
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  placeholderText="jj/mm/aaaa"
                  className={`w-full border rounded-lg p-2 ${validationErrors.carteGriseValidity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                />
                {validationErrors.carteGriseValidity && <p className="text-red-500 text-xs mt-1">{validationErrors.carteGriseValidity}</p>}
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">Documents</h3>
            <FileUploader
              api_url={API_URL}
              newFiles={newAttachmentFiles}
              onNewFilesChange={setNewAttachmentFiles}
              existingDocuments={initialData?.documents || []}
              onRemoveExistingDocument={async () => {}} // This will be handled by the parent Vehicles component
            />
          </section>

          <div className="flex justify-end space-x-4 pt-4 border-t">
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
              {initialData ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VehicleDetailsPanel = ({
  vehicle,
  onClose,
  editMode = false,
  editedVehicle = null,
  onEdit = () => {},
  onSave = () => {},
  onCancel = () => {},
  onInputChange = (field: string, value: any) => {},
  onRemoveExistingDocument = async (doc: Document) => Promise.resolve(),
  API_URL
}: {
  vehicle: Vehicle;
  onClose: () => void;
  editMode?: boolean;
  editedVehicle?: Vehicle | null;
  onEdit?: () => void;
  onSave?: (newAttachmentFiles: File[]) => void;
  onCancel?: () => void;
  onInputChange?: (field: keyof Vehicle | `equipment.${keyof VehicleEquipment}`, value: any) => void;
  onRemoveExistingDocument?: (doc: Document) => Promise<void>;
  API_URL: string;
}) => {
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});


  useEffect(() => {
    if (!editMode) {
      setNewAttachmentFiles([]); // Clear new files when exiting edit mode
      setValidationErrors({}); // Clear validation errors when exiting edit mode
    }
  }, [editMode]);

  const validateField = (name: string, value: string | number | undefined | Date | null, required: boolean, label: string) => {
    let error = '';
    if (required) {
      if (typeof value === 'string' && value.trim() === '') {
        error = `${label} ne peut pas être vide ou contenir uniquement des espaces.`;
      } else if (typeof value === 'number' && value < 1) {
        error = `${label} ne peut pas être inférieur à 1.`;
      } else if (value === null || value === undefined) {
        error = `${label} est obligatoire.`;
      }
    } else if (typeof value === 'string' && value.length > 0 && value.trim() === '') {
      error = `${label} ne peut pas contenir uniquement des espaces.`;
    }
    setValidationErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleSaveEdit = () => {
    if (!editedVehicle) return;

    let hasErrors = false;
    const newErrors: {[key: string]: string} = {};

    // Validate text fields
    newErrors.brand = validateField('brand', editedVehicle.brand, true, 'Marque');
    newErrors.model = validateField('model', editedVehicle.model, true, 'Modèle');
    newErrors.licensePlate = validateField('licensePlate', editedVehicle.licensePlate, true, 'Matricule');
    newErrors.temporaryPlate = validateField('temporaryPlate', editedVehicle.temporaryPlate, false, 'Matricule WW');
    newErrors.chassisNumber = validateField('chassisNumber', editedVehicle.chassisNumber, true, 'Numéro de châssis');
    newErrors.color = validateField('color', editedVehicle.color, false, 'Couleur');
    newErrors.colorCode = validateField('colorCode', editedVehicle.colorCode, false, 'Code couleur');
    newErrors.observation = validateField('observation', editedVehicle.observation, false, 'Observation');

    // Validate number fields
    newErrors.nombreDePlaces = validateField('nombreDePlaces', editedVehicle.nombreDePlaces, false, 'Nombre de places');
    newErrors.nombreDeVitesses = validateField('nombreDeVitesses', editedVehicle.nombreDeVitesses, false, 'Nombre de vitesses');
    newErrors.mileage = validateField('mileage', editedVehicle.mileage, true, 'Kilométrage');
    newErrors.rentalPrice = validateField('rentalPrice', editedVehicle.rentalPrice, true, 'Prix location');

    // Validate date fields
    newErrors.autorisationDate = validateField('autorisationDate', editedVehicle.autorisationDate, true, 'Date autorisation (I/C)');
    newErrors.autorisationValidity = validateField('autorisationValidity', editedVehicle.autorisationValidity, true, 'Validité autorisation');
    newErrors.carteGriseDate = validateField('carteGriseDate', editedVehicle.carteGriseDate, true, 'Date carte grise');
    newErrors.carteGriseValidity = validateField('carteGriseValidity', editedVehicle.carteGriseValidity, true, 'Validité carte grise');

    for (const key in newErrors) {
      if (newErrors[key]) {
        hasErrors = true;
        break;
      }
    }
    setValidationErrors(newErrors);

    if (hasErrors) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    if (onSave) {
      onSave(newAttachmentFiles); // Pass newAttachmentFiles to parent's onSave
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Détails du véhicule</h2>
          <div className="flex items-center space-x-2">
          {editMode ? (
            <>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Enregistrer
                </button>
                <button
                  onClick={onCancel}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  Annuler
                </button>
            </>
          ) : (
            <EditButton
              onClick={onEdit}
              withText={true}
              className="mr-2"
            />
          )}
          <button onClick={onClose} className="p-2">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-150px)]">
        {/* Vehicle Image */}
        <div className="mb-6 relative">
          {(editMode ? editedVehicle?.imageUrl : vehicle.imageUrl) ? (
            <div className="relative">
              <img
                src={editMode ? editedVehicle?.imageUrl : vehicle.imageUrl}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              {editMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onInputChange('imageUrl', reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="px-4 py-2 bg-white text-gray-800 rounded-md shadow-sm hover:bg-gray-100 flex items-center"
                  >
                    <Upload size={16} className="mr-2" />
                    Changer l'image
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              {editMode ? (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onInputChange('imageUrl', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  Ajouter une image
                </button>
              ) : (
                <Car size={48} className="text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-medium mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Marque</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.brand ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.brand || ''}
                      onChange={(e) => {
                        onInputChange('brand', e.target.value);
                        validateField('brand', e.target.value, true, 'Marque');
                      }}
                    />
                    {validationErrors.brand && <p className="text-red-500 text-xs mt-1">{validationErrors.brand}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.brand}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Modèle</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.model ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.model || ''}
                      onChange={(e) => {
                        onInputChange('model', e.target.value);
                        validateField('model', e.target.value, true, 'Modèle');
                      }}
                    />
                    {validationErrors.model && <p className="text-red-500 text-xs mt-1">{validationErrors.model}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.model}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Matricule</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.licensePlate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.licensePlate || ''}
                      onChange={(e) => {
                        onInputChange('licensePlate', e.target.value);
                        validateField('licensePlate', e.target.value, true, 'Matricule');
                      }}
                    />
                    {validationErrors.licensePlate && <p className="text-red-500 text-xs mt-1">{validationErrors.licensePlate}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.licensePlate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Matricule WW</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.temporaryPlate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.temporaryPlate || ''}
                      onChange={(e) => {
                        onInputChange('temporaryPlate', e.target.value);
                        validateField('temporaryPlate', e.target.value, false, 'Matricule WW');
                      }}
                    />
                    {validationErrors.temporaryPlate && <p className="text-red-500 text-xs mt-1">{validationErrors.temporaryPlate}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.temporaryPlate || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Numéro de châssis</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.chassisNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.chassisNumber || ''}
                      onChange={(e) => {
                        onInputChange('chassisNumber', e.target.value);
                        validateField('chassisNumber', e.target.value, true, 'Numéro de châssis');
                      }}
                    />
                    {validationErrors.chassisNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.chassisNumber}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.chassisNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date mise en circulation</label>
                {editMode ? (
                  <DatePicker
                    selected={editedVehicle?.circulationDate ? new Date(editedVehicle.circulationDate) : null}
                    onChange={(date: Date | null) => onInputChange('circulationDate', date ? date.toISOString().split('T')[0] : '')}
                    dateFormat="dd/MM/yyyy"
                    locale="fr"
                    placeholderText="jj/mm/aaaa"
                    className="mt-1 w-full border rounded-lg p-2"
                  />
                ) : (
                  <p className="mt-1">{formatDateToFrench(vehicle.circulationDate)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Statut</label>
                {editMode ? (
                  <select
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedVehicle?.statut || 'En parc'}
                    onChange={(e) => onInputChange('statut', e.target.value as 'En parc' | 'En circulation')}
                  >
                    <option value="En parc">En parc</option>
                    <option value="En circulation">En circulation</option>
                  </select>
                ) : (
                  <p className="mt-1">{vehicle.statut || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nombre de places</label>
                {editMode ? (
                  <>
                    <input
                      type="number"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.nombreDePlaces ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.nombreDePlaces || 0}
                      onChange={(e) => {
                        onInputChange('nombreDePlaces', parseInt(e.target.value));
                        validateField('nombreDePlaces', Number(e.target.value), false, 'Nombre de places');
                      }}
                    />
                    {validationErrors.nombreDePlaces && <p className="text-red-500 text-xs mt-1">{validationErrors.nombreDePlaces}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.nombreDePlaces || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nombre de vitesses</label>
                {editMode ? (
                  <>
                    <input
                      type="number"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.nombreDeVitesses ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.nombreDeVitesses || 0}
                      onChange={(e) => {
                        onInputChange('nombreDeVitesses', parseInt(e.target.value));
                        validateField('nombreDeVitesses', Number(e.target.value), false, 'Nombre de vitesses');
                      }}
                    />
                    {validationErrors.nombreDeVitesses && <p className="text-red-500 text-xs mt-1">{validationErrors.nombreDeVitesses}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.nombreDeVitesses || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Transmission</label>
                {editMode ? (
                  <select
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedVehicle?.transmission || ''}
                    onChange={(e) => onInputChange('transmission', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Manuelle">Manuelle</option>
                    <option value="Automatique">Automatique</option>
                  </select>
                ) : (
                  <p className="mt-1">{vehicle.transmission || '-'}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Kilométrage et carburant</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Kilométrage</label>
                {editMode ? (
                  <>
                    <input
                      type="number"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.mileage ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.mileage || 0}
                      onChange={(e) => {
                        onInputChange('mileage', parseInt(e.target.value));
                        validateField('mileage', Number(e.target.value), true, 'Kilométrage');
                      }}
                    />
                    {validationErrors.mileage && <p className="text-red-500 text-xs mt-1">{validationErrors.mileage}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.mileage.toLocaleString()} km</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type carburant</label>
                {editMode ? (
                  <select
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedVehicle?.fuelType || 'diesel'}
                    onChange={(e) => onInputChange('fuelType', e.target.value as FuelType)}
                  >
                    <option value="diesel">Diesel</option>
                    <option value="essence">Essence</option>
                    <option value="electrique">Électrique</option>
                    <option value="hybride">Hybride</option>
                  </select>
                ) : (
                  <p className="mt-1">{vehicle.fuelType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Niveau carburant</label>
                {editMode ? (
                  <select
                    className="mt-1 w-full border rounded-lg p-2"
                    value={editedVehicle?.fuelLevel || 'plein'}
                    onChange={(e) => onInputChange('fuelLevel', e.target.value as FuelLevel)}
                  >
                    <option value="reserve">Réserve</option>
                    <option value="1/4">1/4</option>
                    <option value="1/2">1/2</option>
                    <option value="3/4">3/4</option>
                    <option value="plein">Plein</option>
                  </select>
                ) : (
                  <p className="mt-1">{vehicle.fuelLevel}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Apparence</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Couleur</label>
                {editMode ? (
                  <>
                    <input
                      type="text"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.color ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.color || ''}
                      onChange={(e) => {
                        onInputChange('color', e.target.value);
                        validateField('color', e.target.value, false, 'Couleur');
                      }}
                    />
                    {validationErrors.color && <p className="text-red-500 text-xs mt-1">{validationErrors.color}</p>}
                  </>
                ) : (
                  <p className="mt-1">{vehicle.color}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Code couleur</label>
                {editMode ? (
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      className={`w-full border rounded-lg p-2 ${validationErrors.colorCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      value={editedVehicle?.colorCode || ''}
                      onChange={(e) => {
                        onInputChange('colorCode', e.target.value);
                        validateField('colorCode', e.target.value, false, 'Code couleur');
                      }}
                      placeholder="#RRGGBB"
                    />
                    {editedVehicle?.colorCode && (
                      <div
                        className="w-6 h-6 border rounded flex-shrink-0"
                        style={{ backgroundColor: editedVehicle.colorCode }}
                      />
                    )}
                    {validationErrors.colorCode && <p className="text-red-500 text-xs mt-1">{validationErrors.colorCode}</p>}
                  </div>
                ) : (
                  vehicle.colorCode ? (
                    <div className="mt-1 flex items-center space-x-2">
                      <span>{vehicle.colorCode}</span>
                      <div
                        className="w-6 h-6 border rounded"
                        style={{ backgroundColor: vehicle.colorCode }}
                      />
                    </div>
                  ) : (
                    <p className="mt-1">-</p>
                  )
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Prix</h3>
            <div>
              <label className="block text-sm font-medium text-gray-500">Prix de location</label>
              {editMode ? (
                <div className="mt-1 flex items-center">
                  <input
                    type="number"
                    className={`w-32 border rounded-lg p-2 ${validationErrors.rentalPrice ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    value={editedVehicle?.rentalPrice || 0}
                    onChange={(e) => {
                      onInputChange('rentalPrice', Number(e.target.value));
                      validateField('rentalPrice', Number(e.target.value), true, 'Prix location');
                    }}
                    min="0"
                    step="10"
                  />
                  <span className="ml-2 text-gray-500">DH/jour</span>
                  {validationErrors.rentalPrice && <p className="text-red-500 text-xs mt-1">{validationErrors.rentalPrice}</p>}
                </div>
              ) : (
                <p className="mt-1 text-lg font-semibold text-blue-600">
                  {vehicle.rentalPrice} DH<span className="text-sm font-normal text-gray-500">/jour</span>
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Équipements</h3>
            <div className="grid grid-cols-2 gap-4">
              {VEHICLE_EQUIPMENT_OPTIONS.map(item => (
                <div key={item.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(editMode ? editedVehicle?.equipment?.[item.id] : vehicle.equipment?.[item.id]) || false}
                    onChange={editMode ? (e) => onInputChange(`equipment.${item.id}`, e.target.checked) : undefined}
                    readOnly={!editMode}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                  />
                  <label className={`ml-2 block text-sm text-gray-900 ${editMode ? 'cursor-pointer' : ''}`}>
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Papiers véhicule Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">Papiers véhicule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Date autorisation (I/C)*</label>
                {editMode ? (
                  <>
                    <DatePicker
                      selected={editedVehicle?.autorisationDate ? new Date(editedVehicle.autorisationDate) : null}
                      onChange={(date: Date | null) => {
                        onInputChange('autorisationDate', date ? date.toISOString().split('T')[0] : '');
                        validateField('autorisationDate', date, true, 'Date autorisation (I/C)');
                      }}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      placeholderText="jj/mm/aaaa"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.autorisationDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                    {validationErrors.autorisationDate && <p className="text-red-500 text-xs mt-1">{validationErrors.autorisationDate}</p>}
                  </>
                ) : (
                  <p className="mt-1">{formatDateToFrench(vehicle.autorisationDate)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Validité autorisation*</label>
                {editMode ? (
                  <>
                    <DatePicker
                      selected={editedVehicle?.autorisationValidity ? new Date(editedVehicle.autorisationValidity) : null}
                      onChange={(date: Date | null) => {
                        onInputChange('autorisationValidity', date ? date.toISOString().split('T')[0] : '');
                        validateField('autorisationValidity', date, true, 'Validité autorisation');
                      }}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      placeholderText="jj/mm/aaaa"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.autorisationValidity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                    {validationErrors.autorisationValidity && <p className="text-red-500 text-xs mt-1">{validationErrors.autorisationValidity}</p>}
                  </>
                ) : (
                  <p className="mt-1">{formatDateToFrench(vehicle.autorisationValidity)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date carte grise*</label>
                {editMode ? (
                  <>
                    <DatePicker
                      selected={editedVehicle?.carteGriseDate ? new Date(editedVehicle.carteGriseDate) : null}
                      onChange={(date: Date | null) => {
                        onInputChange('carteGriseDate', date ? date.toISOString().split('T')[0] : '');
                        validateField('carteGriseDate', date, true, 'Date carte grise');
                      }}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      placeholderText="jj/mm/aaaa"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.carteGriseDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                    {validationErrors.carteGriseDate && <p className="text-red-500 text-xs mt-1">{validationErrors.carteGriseDate}</p>}
                  </>
                ) : (
                  <p className="mt-1">{formatDateToFrench(vehicle.carteGriseDate)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Validité carte grise*</label>
                {editMode ? (
                  <>
                    <DatePicker
                      selected={editedVehicle?.carteGriseValidity ? new Date(editedVehicle.carteGriseValidity) : null}
                      onChange={(date: Date | null) => {
                        onInputChange('carteGriseValidity', date ? date.toISOString().split('T')[0] : '');
                        validateField('carteGriseValidity', date, true, 'Validité carte grise');
                      }}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      placeholderText="jj/mm/aaaa"
                      className={`mt-1 w-full border rounded-lg p-2 ${validationErrors.carteGriseValidity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                    {validationErrors.carteGriseValidity && <p className="text-red-500 text-xs mt-1">{validationErrors.carteGriseValidity}</p>}
                  </>
                ) : (
                  <p className="mt-1">{formatDateToFrench(vehicle.carteGriseValidity)}</p>
                )}
              </div>
            </div>
          </section>

          {/* Observation Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">
              <div className="flex items-center">
                <FileText size={18} className="mr-2 text-gray-500" />
                Observation
              </div>
            </h3>
            {editMode ? (
              <>
                <textarea
                  className={`w-full border rounded-lg p-2 min-h-[100px] ${validationErrors.observation ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  value={editedVehicle?.observation || ''}
                  onChange={(e) => {
                    onInputChange('observation', e.target.value);
                    validateField('observation', e.target.value, false, 'Observation');
                  }}
                  placeholder="Ajouter une observation..."
                />
                {validationErrors.observation && <p className="text-red-500 text-xs mt-1">{validationErrors.observation}</p>}
              </>
            ) : (
              vehicle.observation && (
                <p className="text-gray-700 whitespace-pre-wrap">{vehicle.observation}</p>
              )
            )}
          </section>

          {/* Documents Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">
              <div className="flex items-center">
                <FileText size={18} className="mr-2 text-gray-500" />
                Documents
              </div>
            </h3>
            <FileUploader
              api_url={API_URL}
              newFiles={newAttachmentFiles}
              onNewFilesChange={setNewAttachmentFiles}
              existingDocuments={editMode ? editedVehicle?.documents || [] : vehicle.documents || []}
              onRemoveExistingDocument={onRemoveExistingDocument}
              readOnly={!editMode}
              label=""
            />
          </section>
        </div>
      </div>
    </div>
  );
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'En parc' | 'En circulation'>('all'); // New state for statut filter
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([]); // New state for new files
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api/vehicles';

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Vehicle[]>(API_URL);
      console.log('Fetched vehicles:', response.data); // Add console log
      setVehicles(response.data);
      toast.success('Vehicles loaded successfully!');
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles.');
      toast.error('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSubmit = async (data: Partial<Vehicle>, files: File[]) => {
    try {
      const newDocuments: Document[] = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file) // Temporary URL for frontend preview
      }));

      if (selectedVehicle) {
        // Update existing vehicle
        const updatedVehicleData = {
          ...data,
          documents: [...(selectedVehicle.documents || []), ...newDocuments]
        };
        const response = await axios.put<Vehicle>(`${API_URL}/${selectedVehicle._id}`, updatedVehicleData);
        setVehicles(vehicles.map(v =>
          v._id === selectedVehicle._id ? response.data : v
        ));
        setSelectedVehicleDetails(response.data); // Update details panel if open
        toast.success('Vehicle updated successfully!');
      } else {
        // Add new vehicle
        const newVehicleData = {
          ...data,
          documents: newDocuments
        };
        const response = await axios.post<Vehicle>(API_URL, newVehicleData);
        setVehicles([...vehicles, response.data]);
        toast.success('Vehicle added successfully!');
      }
      setShowForm(false);
      setSelectedVehicle(null);
      setNewAttachmentFiles([]); // Clear new files after submission
    } catch (err) {
      console.error('Error submitting vehicle:', err);
      toast.error('Failed to save vehicle.');
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = filterStatut === 'all' || vehicle.statut === filterStatut;

    return matchesSearch && matchesStatut;
  });

  // Edit functionality
  const handleEditClick = () => {
    if (selectedVehicleDetails) {
      setEditedVehicle({ ...selectedVehicleDetails });
      setEditMode(true);
      setNewAttachmentFiles([]); // Clear new files when entering edit mode
    }
  };

  const handleSaveEdit = async (newFiles: File[]) => {
    if (!editedVehicle) return;

    // Validate text fields before saving
    const textFieldsToValidate = [
      { name: 'Marque', value: editedVehicle.brand, required: true },
      { name: 'Modèle', value: editedVehicle.model, required: true },
      { name: 'Matricule', value: editedVehicle.licensePlate, required: true },
      { name: 'Matricule WW', value: editedVehicle.temporaryPlate, required: false },
      { name: 'Numéro de châssis', value: editedVehicle.chassisNumber, required: true },
      { name: 'Couleur', value: editedVehicle.color, required: false },
      { name: 'Code couleur', value: editedVehicle.colorCode, required: false },
      { name: 'Observation', value: editedVehicle.observation, required: false },
    ];

    for (const field of textFieldsToValidate) {
      if (field.required && isOnlySpaces(field.value)) {
        toast.error(`${field.name} ne peut pas être vide ou contenir uniquement des espaces.`);
        return;
      }
      if (!field.required && field.value && isOnlySpaces(field.value)) {
        toast.error(`${field.name} ne peut pas contenir uniquement des espaces.`);
        return;
      }
    }

    if (editedVehicle.nombreDePlaces !== undefined && editedVehicle.nombreDePlaces < 1) {
      toast.error('Nombre de places ne peut pas être inférieur à 1.');
      return;
    }

    if (editedVehicle.nombreDeVitesses !== undefined && editedVehicle.nombreDeVitesses < 1) {
      toast.error('Nombre de vitesses ne peut pas être inférieur à 1.');
      return;
    }

    try {
      const existingDocsToKeep = editedVehicle.documents?.filter(doc => !doc.url.startsWith('blob:')) || [];
      const newDocumentsForBackend: Document[] = newFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file) // Temporary URL for frontend preview
      }));

      const updatedVehicleData = {
        ...editedVehicle,
        documents: [...existingDocsToKeep, ...newDocumentsForBackend]
      };

      const response = await axios.put<Vehicle>(`${API_URL}/${editedVehicle._id}`, updatedVehicleData);
      console.log('Backend response after update:', response.data); // Add console log
      setVehicles(vehicles.map(vehicle =>
        vehicle._id === response.data._id ? response.data : vehicle
      ));
      setSelectedVehicleDetails(response.data);
      setEditMode(false);
      setEditedVehicle(null);
      setNewAttachmentFiles([]); // Clear new files after saving
      toast.success('Vehicle updated successfully!');
    } catch (err) {
      console.error('Error saving vehicle edit:', err);
      toast.error('Failed to save vehicle changes.');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedVehicle(null);
    setNewAttachmentFiles([]); // Clear new files on cancel
  };

  const handleInputChange = (field: keyof Vehicle | `equipment.${keyof VehicleEquipment}`, value: any) => {
    if (editedVehicle) {
      const updatedVehicle = { ...editedVehicle };

      // Handle nested objects (equipment)
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        if (parentField === 'equipment') {
          updatedVehicle.equipment = {
            ...updatedVehicle.equipment,
            [childField as keyof VehicleEquipment]: typeof value === 'boolean' ? value : value === 'true' || value === 'on'
          };
        }
      } else {
        (updatedVehicle[field as keyof Vehicle] as any) = value;
      }

      setEditedVehicle(updatedVehicle);
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!editedVehicle) return;

    try {
      // Optimistically update UI
      const updatedDocuments = editedVehicle.documents?.filter(doc => doc.url !== docToRemove.url) || [];
      setEditedVehicle({ ...editedVehicle, documents: updatedDocuments });

      // In a real application, you would send a request to the backend to delete the document
      // For now, we'll just log it and assume success.
      console.log('Simulating document deletion for:', docToRemove.url);
      toast.success('Document removed successfully (simulated)!');

      // If the document was successfully removed from the backend, then update the main vehicles state
      // For this example, we'll just update the local state.
      setVehicles(prevVehicles => prevVehicles.map(v =>
        v._id === editedVehicle._id ? { ...v, documents: updatedDocuments } : v
      ));
      setSelectedVehicleDetails(prevDetails =>
        prevDetails?._id === editedVehicle._id ? { ...prevDetails, documents: updatedDocuments } : prevDetails
      );

    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document.');
      // Revert optimistic update if backend call fails
      setEditedVehicle({ ...editedVehicle });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await axios.delete(`${API_URL}/${vehicleId}`);
        setVehicles(vehicles.filter(v => v._id !== vehicleId));
        if (selectedVehicleDetails?._id === vehicleId) {
          setSelectedVehicleDetails(null);
          setEditMode(false);
          setEditedVehicle(null);
        }
        toast.success('Vehicle deleted successfully!');
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        toast.error('Failed to delete vehicle.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading vehicles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p className="text-lg">{error}</p>
        <button
          onClick={fetchVehicles}
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Véhicules</h1>
        <button
          onClick={() => {
            setSelectedVehicle(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Ajouter un véhicule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles List */}
        <div className="lg:col-span-2">
          {/* Filters and search */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un véhicule..."
                  className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="statut-filter" className="sr-only">Filtrer par statut</label>
                <select
                  id="statut-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value as 'all' | 'En parc' | 'En circulation')}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="En parc">En parc</option>
                  <option value="En circulation">En circulation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carburant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix/jour
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedVehicleDetails(vehicle)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {vehicle.imageUrl ? (
                          <img
                            src={vehicle.imageUrl}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Car size={20} className="text-gray-500" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.licensePlate}
                            {vehicle.temporaryPlate && ` (WW: ${vehicle.temporaryPlate})`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {vehicle.chassisNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.mileage.toLocaleString()} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.statut === 'En parc' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {vehicle.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vehicle.fuelType}</div>
                      <div className="text-sm text-gray-500">{vehicle.fuelLevel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {vehicle.rentalPrice} DH/jour
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicleDetails(vehicle);
                          setEditedVehicle({ ...vehicle });
                          setEditMode(true);
                        }}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVehicle(vehicle._id);
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

        {/* Vehicle Details */}
        <div className="lg:col-span-1">
          {selectedVehicleDetails ? (
            <div className="bg-white shadow rounded-lg">
              <VehicleDetailsPanel
                vehicle={selectedVehicleDetails}
                onClose={() => setSelectedVehicleDetails(null)}
                editMode={editMode}
                editedVehicle={editedVehicle}
                onEdit={handleEditClick}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                onInputChange={handleInputChange}
                onRemoveExistingDocument={handleRemoveExistingDocument}
                API_URL={API_URL}
              />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center h-full py-10">
                <Car size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun véhicule sélectionné
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez un véhicule pour voir ses détails
                </p>
                <button
                  onClick={() => {
                    setSelectedVehicle(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter un véhicule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <VehicleForm
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setSelectedVehicle(null);
          }}
          initialData={selectedVehicle}
          API_URL={API_URL}
        />
      )}
    </div>
  );
};

export default Vehicles;
