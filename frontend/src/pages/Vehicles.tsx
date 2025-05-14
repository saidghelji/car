import React, { useState, useRef } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, 
  X, Car, Upload
} from 'lucide-react';

type FuelType = 'diesel' | 'essence' | 'electrique' | 'hybride';
type FuelLevel = 'reserve' | '1/4' | '1/2' | '3/4' | 'plein';
type VehicleStatus = 'en_parc' | 'vendue';

interface VehicleEquipment {
  climatisation: boolean;
  cric: boolean;
  documents: boolean;
  extincteur: boolean;
  gilet: boolean;
  posteRadio: boolean;
  roueSecours: boolean;
  siegeBebe: boolean;
}

interface Vehicle {
  id: string;
  chassisNumber: string;
  imageUrl?: string;
  temporaryPlate?: string; // Matricule WW
  licensePlate: string;
  brand: string;
  model: string;
  circulationDate: string;
  fuelType: FuelType;
  fuelLevel: FuelLevel;
  mileage: number;
  color: string;
  averageDailyMileage?: number;
  colorCode?: string;
  rentalPrice: number;
  status: VehicleStatus;
  observation?: string;
  equipment: VehicleEquipment;
}

// Sample vehicle data with new structure
const initialVehicles: Vehicle[] = [
  {
    id: '1',
    chassisNumber: 'VF1RFA00066724253',
    imageUrl: 'https://example.com/car1.jpg',
    licensePlate: 'AB-123-CD',
    brand: 'Renault',
    model: 'Clio',
    circulationDate: '2023-01-15',
    fuelType: 'essence',
    fuelLevel: 'plein',
    mileage: 12500,
    color: 'Blanc',
    averageDailyMileage: 50,
    colorCode: '#FFFFFF',
    rentalPrice: 350,
    status: 'en_parc',
    equipment: {
      climatisation: true,
      cric: true,
      documents: true,
      extincteur: true,
      gilet: true,
      posteRadio: true,
      roueSecours: true,
      siegeBebe: false
    }
  },
  {
    id: '2',
    chassisNumber: 'WBA31234567890123',
    imageUrl: 'https://example.com/car2.jpg',
    temporaryPlate: 'WW-456-21',
    licensePlate: 'EF-456-GH',
    brand: 'Peugeot',
    model: '208',
    circulationDate: '2023-03-20',
    fuelType: 'diesel',
    fuelLevel: '3/4',
    mileage: 8900,
    color: 'Noir',
    averageDailyMileage: 45,
    colorCode: '#000000',
    rentalPrice: 400,
    status: 'en_parc',
    equipment: {
      climatisation: true,
      cric: true,
      documents: true,
      extincteur: true,
      gilet: true,
      posteRadio: true,
      roueSecours: true,
      siegeBebe: true
    }
  }
];

const StatusBadge = ({ status }: { status: VehicleStatus }) => {
  const statusConfig = {
    en_parc: { color: 'bg-green-100 text-green-800', label: 'En parc' },
    vendue: { color: 'bg-gray-100 text-gray-800', label: 'Vendue' }
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

const VehicleForm = ({ 
  onSubmit, 
  onClose, 
  initialData = null 
}: { 
  onSubmit: (data: Partial<Vehicle>) => void;
  onClose: () => void;
  initialData?: Vehicle | null;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);

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
      averageDailyMileage: Number(formData.get('averageDailyMileage')) || undefined,
      colorCode: formData.get('colorCode') as string,
      rentalPrice: Number(formData.get('rentalPrice')),
      status: formData.get('status') as VehicleStatus,
      observation: formData.get('observation') as string,
      equipment: {
        climatisation: formData.get('climatisation') === 'on',
        cric: formData.get('cric') === 'on',
        documents: formData.get('documents') === 'on',
        extincteur: formData.get('extincteur') === 'on',
        gilet: formData.get('gilet') === 'on',
        posteRadio: formData.get('posteRadio') === 'on',
        roueSecours: formData.get('roueSecours') === 'on',
        siegeBebe: formData.get('siegeBebe') === 'on'
      }
    };

    if (imagePreview) {
      vehicleData.imageUrl = imagePreview;
    }

    onSubmit(vehicleData);
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
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.chassisNumber}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image du véhicule
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Upload size={16} className="inline mr-2" />
                    Choisir une image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
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
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.temporaryPlate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matricule*
                </label>
                <input
                  name="licensePlate"
                  type="text"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.licensePlate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marque*
                </label>
                <input
                  name="brand"
                  type="text"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.brand}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle*
                </label>
                <input
                  name="model"
                  type="text"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.model}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date mise en circulation
                </label>
                <input
                  name="circulationDate"
                  type="date"
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.circulationDate}
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
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.mileage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  name="color"
                  type="text"
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.color}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilométrage moyen/jour
                </label>
                <input
                  name="averageDailyMileage"
                  type="number"
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.averageDailyMileage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code couleur
                </label>
                <input
                  name="colorCode"
                  type="text"
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.colorCode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix location*
                </label>
                <input
                  name="rentalPrice"
                  type="number"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.rentalPrice}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  État*
                </label>
                <select 
                  name="status"
                  required
                  className="w-full border rounded-lg p-2"
                  defaultValue={initialData?.status}
                >
                  <option value="en_parc">En parc</option>
                  <option value="vendue">Vendue</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observation
                </label>
                <textarea
                  name="observation"
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  defaultValue={initialData?.observation}
                />
              </div>
            </div>
          </section>

          {/* Equipment Section */}
          <section>
            <h3 className="text-lg font-medium mb-4">Équipements/Accessoires</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'climatisation', label: 'Climatisation' },
                { id: 'cric', label: 'Cric' },
                { id: 'documents', label: 'Documents' },
                { id: 'extincteur', label: 'Extincteur' },
                { id: 'gilet', label: 'Gilet' },
                { id: 'posteRadio', label: 'Poste radio' },
                { id: 'roueSecours', label: 'Roue secours' },
                { id: 'siegeBebe', label: 'Siège bébé' }
              ].map(item => (
                <div key={item.id} className="flex items-center">
                  <input
                    name={item.id}
                    type="checkbox"
                    id={item.id}
                    defaultChecked={initialData?.equipment?.[item.id as keyof VehicleEquipment]}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={item.id} className="ml-2 block text-sm text-gray-900">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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
  onClose 
}: { 
  vehicle: Vehicle; 
  onClose: () => void;
}) => {
  return (
    <div>
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Détails du véhicule</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Vehicle Image */}
        <div className="mb-6">
          {vehicle.imageUrl ? (
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car size={48} className="text-gray-400" />
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
                <p className="mt-1">{vehicle.brand}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Modèle</label>
                <p className="mt-1">{vehicle.model}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Matricule</label>
                <p className="mt-1">{vehicle.licensePlate}</p>
              </div>
              {vehicle.temporaryPlate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Matricule WW</label>
                  <p className="mt-1">{vehicle.temporaryPlate}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Numéro de châssis</label>
                <p className="mt-1">{vehicle.chassisNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date mise en circulation</label>
                <p className="mt-1">{new Date(vehicle.circulationDate).toLocaleDateString()}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">État et kilométrage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">État</label>
                <StatusBadge status={vehicle.status} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Kilométrage</label>
                <p className="mt-1">{vehicle.mileage.toLocaleString()} km</p>
              </div>
              {vehicle.averageDailyMileage && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kilométrage moyen/jour</label>
                  <p className="mt-1">{vehicle.averageDailyMileage} km</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Type carburant</label>
                <p className="mt-1">{vehicle.fuelType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Niveau carburant</label>
                <p className="mt-1">{vehicle.fuelLevel}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Apparence</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Couleur</label>
                <p className="mt-1">{vehicle.color}</p>
              </div>
              {vehicle.colorCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Code couleur</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span>{vehicle.colorCode}</span>
                    <div 
                      className="w-6 h-6 border rounded" 
                      style={{ backgroundColor: vehicle.colorCode }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Prix</h3>
            <div>
              <label className="block text-sm font-medium text-gray-500">Prix de location</label>
              <p className="mt-1 text-lg font-semibold text-blue-600">
                {vehicle.rentalPrice} DH<span className="text-sm font-normal text-gray-500">/jour</span>
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-4">Équipements</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(vehicle.equipment).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </section>

          {vehicle.observation && (
            <section>
              <h3 className="text-lg font-medium mb-4">Observation</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{vehicle.observation}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);

  const handleSubmit = (data: Partial<Vehicle>) => {
    if (selectedVehicle) {
      // Update existing vehicle
      setVehicles(vehicles.map(v => 
        v.id === selectedVehicle.id ? { ...v, ...data } : v
      ));
    } else {
      // Add new vehicle
      const newVehicle = {
        ...data as Vehicle,
        id: Date.now().toString()
      };
      setVehicles([...vehicles, newVehicle]);
    }
    setShowForm(false);
    setSelectedVehicle(null);
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={18} className="text-gray-400" />
                </div>
                <select
                  className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
                >
                  <option value="all">Tous les états</option>
                  <option value="en_parc">En parc</option>
                  <option value="vendue">Vendue</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
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
                    Carburant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix/jour
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <tr 
                    key={vehicle.id} 
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
                      <div className="text-sm text-gray-900">{vehicle.fuelType}</div>
                      <div className="text-sm text-gray-500">{vehicle.fuelLevel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {vehicle.rentalPrice} DH/jour
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(vehicle);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
                            setVehicles(vehicles.filter(v => v.id !== vehicle.id));
                          }
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
        />
      )}
    </div>
  );
};

export default Vehicles;