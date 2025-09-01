import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, FileText, Calendar, CheckCircle, Trash2, Car, AlertTriangle } from 'lucide-react';
import CloseButton from '../components/CloseButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import EditButton from '../components/EditButton';
import { Customer } from './Customers'; // Import Customer type
import { Vehicle } from './Vehicles'; // Import Vehicle type
import axios from 'axios'; // Import axios
import toast from 'react-hot-toast'; // For notifications
import FileUploader, { Document } from '../components/FileUploader'; // Import FileUploader and Document

registerLocale('fr', fr);

// Define a type for the second driver that matches the backend schema
interface SecondDriverData {
  nom?: string;
  nationalite?: string;
  dateNaissance?: string; // YYYY-MM-DD
  adresse?: string;
  telephone?: string;
  adresseEtranger?: string;
  permisNumero?: string;
  permisDelivreLe?: string; // YYYY-MM-DD
  passeportCin?: string;
  passeportDelivreLe?: string; // YYYY-MM-DD
}

interface Client {
  _id: string;
  prenomFr?: string;
  nomFr?: string;
  numeroPermis?: string;
  permisValidite?: string;
}

interface Equipment {
  pneuDeSecours: boolean;
  posteRadio: boolean;
  cricManivelle: boolean;
  allumeCigare: boolean;
  jeuDe4Tapis: boolean;
  vetDeSecurite: boolean;
}

type FuelLevel = 'reserve' | '1/4' | '1/2' | '3/4' | 'plein';
type PaymentType = 'espece' | 'cheque' | 'carte_bancaire' | 'virement';
type ContractStatus = 'en_cours' | 'retournee';

const EQUIPMENT_ITEMS = [
  { id: 'pneuDeSecours', label: 'PNEU DE SECOURS' },
  { id: 'posteRadio', label: 'POSTE RADIO' },
  { id: 'cricManivelle', label: 'CRIC MANIVELLE' },
  { id: 'allumeCigare', label: 'ALLUME CIGARE' },
  { id: 'jeuDe4Tapis', label: 'JEU DE 4 TAPIS' },
  { id: 'vetDeSecurite', label: 'VÊT.DE SÉCURITÉ' }
];

export interface Contract {
  _id: string; // MongoDB's unique ID
  client?: Client; // Make client optional
  contractNumber: string;
  contractDate: string;
  departureDate: string;
  departureTime: string; // Added for "Heure de départ"
  returnDate: string;
  contractLocation: string;
  duration: number;
  pickupLocation: string;
  returnLocation?: string; // Added for "Lieu Récupération"
  matricule: string;
  vehicle: Vehicle; // Use Vehicle type
  pricePerDay: number;
  startingKm: number;
  discount: number;
  fuelLevel: FuelLevel;
  total: number;
  guarantee: number;
  paymentType: PaymentType;
  advance: number;
  remaining: number;
  status: ContractStatus;
  secondDriver?: SecondDriverData; // Use the new SecondDriverData type
  equipment: Equipment;
  extension?: {
    duration: number;
    pricePerDay: number;
  };
  piecesJointes?: Document[]; // Changed to Document[]
  createdAt: string; // Add timestamps
  updatedAt: string; // Add timestamps
}

// Helper function to check if a string is null, undefined, or contains only spaces
const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

const Contrats: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); // Fetch from API
  const [customers, setCustomers] = useState<Customer[]>([]); // Fetch from API
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContract, setEditedContract] = useState<Contract | null>(null);
  const [newContractFiles, setNewContractFiles] = useState<File[]>([]); // For new contract form
  const [editedContractFiles, setEditedContractFiles] = useState<File[]>([]); // For edit contract form
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({}); // State for validation errors

  const API_URL = 'http://localhost:5000'; // Base API URL for FileUploader
  const API_URL_CONTRACTS = `${API_URL}/api/contracts`;
  const API_URL_CUSTOMERS = `${API_URL}/api/customers`;
  const API_URL_VEHICLES = `${API_URL}/api/vehicles`;

  // State for new contract
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    client: {
      _id: '',
    },
    contractNumber: '',
    contractDate: new Date().toISOString().split('T')[0],
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '09:00', // Default departure time
    returnDate: new Date().toISOString().split('T')[0],
    contractLocation: '',
    duration: 1,
    pickupLocation: '',
    returnLocation: '', // Initialize new field
    matricule: '',
      vehicle: {
        _id: '', // Use _id for backend
        chassisNumber: '',
        licensePlate: '',
        brand: '',
        model: '',
        circulationDate: '',
        fuelType: 'essence',
        fuelLevel: 'plein',
        mileage: 0,
        color: '',
        rentalPrice: 0,
        statut: 'En parc',
        equipment: {
          pneuDeSecours: false,
          posteRadio: false,
          cricManivelle: false,
          allumeCigare: false,
          jeuDe4Tapis: false,
          vetDeSecurite: false,
        },
        createdAt: '', // Add timestamps
        updatedAt: '', // Add timestamps
      },
    pricePerDay: 0,
    startingKm: 0,
    discount: 0,
    fuelLevel: 'plein',
    total: 0,
    guarantee: 5000,
    paymentType: 'espece',
    advance: 0,
    remaining: 0,
    status: 'en_cours',
    secondDriver: undefined, // Initialize as undefined, will be SecondDriverData type
    equipment: {
      pneuDeSecours: false,
      posteRadio: false,
      cricManivelle: false,
      allumeCigare: false,
      jeuDe4Tapis: false,
      vetDeSecurite: false,
    },
    piecesJointes: []
  });

  // Selected client and vehicle for new contract
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Fetch data
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Contract[]>(API_URL_CONTRACTS);
      const fetchedContracts = response.data;

      // Fetch customers and vehicles first to ensure they are available for contract processing
      const API_URL_INSURANCES = `${API_URL}/api/vehicleinsurances`;
      const [customersRes, vehiclesRes, insurancesRes] = await Promise.all([
        axios.get<Customer[]>(API_URL_CUSTOMERS),
        axios.get<Vehicle[]>(API_URL_VEHICLES),
        axios.get<any[]>(API_URL_INSURANCES),
      ]);
      const fetchedCustomers = customersRes.data;
      const fetchedVehicles = vehiclesRes.data;
      const fetchedInsurances = insurancesRes.data;

      setCustomers(fetchedCustomers);
      setVehicles(fetchedVehicles);

      // Populate client and vehicle objects in contracts
      const populatedContracts = fetchedContracts.map(contract => {
        const fullClient = fetchedCustomers.find(c => c._id === (contract.client as any)?._id);
        const fullVehicle = fetchedVehicles.find(v => v._id === (contract.vehicle as any)?._id || v._id === (contract.vehicle as any));
        // find vehicle insurance (if any) and attach
        const vehicleId = fullVehicle?._id || (typeof contract.vehicle === 'string' ? contract.vehicle : (contract.vehicle as any)?._id);
        const vehicleInsurance = fetchedInsurances.find(ins => {
          const insVehicle = ins.vehicle;
          const insVehicleId = typeof insVehicle === 'object' && insVehicle ? insVehicle._id : insVehicle;
          return insVehicleId === vehicleId;
        });
        // secondDriver is an embedded document, no need to find it in customers
        // It's already part of the contract object if present

        return {
          ...contract,
          client: fullClient ? {
            // copy the full customer fields we need for printing and display
            _id: fullClient._id,
            prenomFr: fullClient.prenomFr,
            nomFr: fullClient.nomFr,
            nationalite: fullClient.nationalite,
            dateNaissance: fullClient.dateNaissance,
            cin: fullClient.cin,
            cinDelivreLe: fullClient.cinDelivreLe,
            cinDelivreA: fullClient.cinDelivreA,
            cinValidite: fullClient.cinValidite,
            numeroPermis: fullClient.numeroPermis,
            permisValidite: fullClient.permisValidite,
            adresseFr: fullClient.adresseFr,
            adresseAr: fullClient.adresseAr,
            adresseEtranger: fullClient.adresseAr,
            telephone: fullClient.telephone,
            telephone2: fullClient.telephone2,
            ville: fullClient.ville,
            codePostal: fullClient.codePostal,
            // passport field removed or replaced with CIN if needed
          } : undefined, // Set client to undefined if not found
          // attach insurance info to vehicle when available
          vehicle: fullVehicle ? ({ ...fullVehicle, insurance: vehicleInsurance }) : contract.vehicle, // Attach insurance info if available
          returnLocation: contract.returnLocation, // Ensure returnLocation is explicitly included
          // secondDriver is already correctly populated as an embedded object
        };
      });

      setContracts(populatedContracts);
      toast.success('Contracts loaded successfully!');
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts.');
      toast.error('Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, []); // Removed dependencies as they are now handled within the effect

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]); // Only fetchContracts is needed here now

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      `${contract.client?.prenomFr || ''} ${contract.client?.nomFr || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    const contractDate = new Date(contract.contractDate);
    const matchesStartDate = startDateFilter ? contractDate >= startDateFilter : true;
    const matchesEndDate = endDateFilter ? contractDate <= endDateFilter : true;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const getFuelLevelColor = (level: FuelLevel): string => {
    const colors = {
      'reserve': 'text-red-500',
      '1/4': 'text-yellow-500',
      '1/2': 'text-blue-500',
      '3/4': 'text-green-300',
      'plein': 'text-green-500'
    };
    return colors[level];
  };

  const getStatusColor = (status: ContractStatus): string => {
    return status === 'en_cours' ? 'text-blue-500' : 'text-green-500';
  };

  const calculateTotal = (pricePerDay: number, duration: number, discount: number) => {
    return (pricePerDay * duration) - discount;
  };

  const handleEditClick = (contract: Contract, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContract(contract);
    setEditedContract({ ...contract });
    setEditMode(true);
    setEditedContractFiles([]); // Clear new files when entering edit mode
  };

  const handleSaveEdit = async () => {
    if (!editedContract) return;

    // Validation for "Lieu de Contrat" and "Lieu Livraison"
    if (isOnlySpaces(editedContract.contractLocation)) {
      toast.error('Le champ "Lieu de Contrat" ne peut pas contenir uniquement des espaces.');
      return;
    }
    if (isOnlySpaces(editedContract.pickupLocation)) {
      toast.error('Le champ "Lieu Livraison" ne peut pas contenir uniquement des espaces.'); // Corrected toast call
      return;
    }
    // Removed isOnlySpaces validation for editedContract.returnLocation to allow empty strings

    // Validation for "Avance" field
    if (editedContract.advance !== undefined && editedContract.advance < 0) {
      toast.error('L\'avance ne peut pas être une valeur négative.');
      return;
    }
    if (editedContract.pricePerDay !== undefined && editedContract.pricePerDay < 0) {
      toast.error('Le prix par jour ne peut pas être une valeur négative.');
      return;
    }
    if (editedContract.guarantee !== undefined && editedContract.guarantee < 0) {
      toast.error('La garantie ne peut pas être une valeur négative.');
      return;
    }
    if (editedContract.total !== undefined && editedContract.total < 0) {
      toast.error('Le total ne peut pas être une valeur négative. Veuillez ajuster le prix par jour, la durée ou la remise.');
      return;
    }
    if (editedContract.remaining !== undefined && editedContract.remaining < 0) {
      toast.error('Le reste à payer ne peut pas être une valeur négative. Veuillez ajuster l\'avance.');
      return;
    }

    // Validation for Second Driver fields if present
    if (editedContract.secondDriver) {
      // Fields to validate for not being only spaces
      const sd = editedContract.secondDriver;
      const sdTextFields: Array<keyof SecondDriverData> = ['nom', 'nationalite', 'adresse', 'telephone', 'adresseEtranger', 'permisNumero', 'passeportCin'];
      let sdHasError = false;
      sdTextFields.forEach(field => {
        const val = sd[field] as string | undefined;
        if (val !== undefined && val.length > 0 && isOnlySpaces(val)) {
          setValidationErrors(prev => ({ ...prev, [`secondDriver.${field}`]: `Le champ "${field}" ne peut pas contenir uniquement des espaces.` }));
          sdHasError = true;
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`secondDriver.${field}`];
            return newErrors;
          });
        }
      });

      // Validate permisDelivreLe must be at least 2 years old if provided
      if (sd.permisDelivreLe) {
        const issuedDate = new Date(sd.permisDelivreLe);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        if (issuedDate > twoYearsAgo) {
          setValidationErrors(prev => ({ ...prev, 'secondDriver.permisDelivreLe': 'La date de délivrance du permis doit être supérieure à 2 ans.' }));
          sdHasError = true;
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors['secondDriver.permisDelivreLe'];
            return newErrors;
          });
        }
      }

      if (sdHasError) {
        toast.error('Veuillez corriger les erreurs du deuxième conducteur.');
        return;
      }
    }

    try {
      const formData = new FormData();

      // Append all fields from editedContract except piecesJointes, client, and vehicle
      for (const key in editedContract) {
        if (Object.prototype.hasOwnProperty.call(editedContract, key)) {
          const value = editedContract[key as keyof Contract];
          if (key === 'piecesJointes' || key === 'client' || key === 'vehicle' || key === 'equipment') {
            continue; // Handle these separately
          }
          // Always append returnLocation, even if it's an empty string
          if (key === 'returnLocation') {
            formData.append(key, String(value || '')); // Ensure it's a string, default to empty if null/undefined
          } else if (key !== 'piecesJointes' && key !== 'client' && key !== 'vehicle' && key !== 'equipment') {
            if (typeof value === 'object' && value !== null) {
              formData.append(key, JSON.stringify(value));
            } else if (value !== undefined) {
              formData.append(key, String(value));
            }
          }
        }
      }

      // Append client, secondDriver, vehicle, and equipment objects as JSON strings
      if (editedContract.client?._id) {
        formData.append('client', editedContract.client._id);
      }
      // If secondDriver exists, append the entire object as a JSON string
      if (editedContract.secondDriver) {
        formData.append('secondDriver', JSON.stringify(editedContract.secondDriver));
      }
      if (editedContract.vehicle) {
        formData.append('vehicle', JSON.stringify(editedContract.vehicle));
      }
      if (editedContract.equipment) {
        formData.append('equipment', JSON.stringify(editedContract.equipment));
      }

      // Append existing documents (only their URLs/names)
      if (editedContract.piecesJointes) {
        editedContract.piecesJointes.forEach(doc => {
          // Only include documents that are not new (i.e., already saved on backend)
          if (!doc.isNew) {
            formData.append('existingDocuments', JSON.stringify({ name: doc.name, url: doc.url, type: doc.type, size: doc.size }));
          }
        });
      }

      // Append newly uploaded files
      editedContractFiles.forEach(file => {
        formData.append('documents', file);
      });

      // Log formData contents for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      console.log('Sending PUT request for contract ID:', editedContract._id);
      const response = await axios.put<Contract>(`${API_URL_CONTRACTS}/${editedContract._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Find the full vehicle object to ensure it's displayed correctly in the sidebar
      const updatedContractData = response.data;
      const fullVehicle = vehicles.find(v => v._id === (updatedContractData.vehicle as any)?._id || v._id === (updatedContractData.vehicle as any));
      const contractWithFullVehicle = { ...updatedContractData, vehicle: fullVehicle || updatedContractData.vehicle };

      setContracts(contracts.map(contract =>
        contract._id === editedContract._id ? contractWithFullVehicle : contract
      ));
      setSelectedContract(contractWithFullVehicle);
      setEditMode(false);
      setEditedContract(null);
      setEditedContractFiles([]);
      toast.success('Contract updated successfully!');
    } catch (err) {
      console.error('Error saving contract edit:', err);
      toast.error('Failed to save contract changes.');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedContract(null);
    setEditedContractFiles([]);
  };

  // Handle client selection for new contract
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedCustomer = customers.find(c => c._id === clientId); // Use _id

    if (selectedCustomer) {
      setNewContract(prev => ({
        ...prev,
        client: {
            _id: selectedCustomer._id,
            prenomFr: selectedCustomer.prenomFr,
            nomFr: selectedCustomer.nomFr,
            numeroPermis: selectedCustomer.numeroPermis,
            permisValidite: selectedCustomer.permisValidite
        }
      }));
    }
  };

  // Handle client selection for edit form
  const handleEditClientChange = (clientId: string) => {
    const selectedCustomer = customers.find(c => c._id === clientId); // Use _id

    if (selectedCustomer && editedContract) {
      setEditedContract(prev => {
        const updatedPrev = { ...prev! };
        if (!updatedPrev.client) {
          updatedPrev.client = { _id: '' }; // Initialize client if it's null or undefined
        }
        return {
          ...updatedPrev,
          client: {
            ...updatedPrev.client,
            _id: selectedCustomer._id,
            prenomFr: selectedCustomer.prenomFr,
            nomFr: selectedCustomer.nomFr,
            numeroPermis: selectedCustomer.numeroPermis,
            permisValidite: selectedCustomer.permisValidite
          }
        };
      });
    }
  };

  // Handle vehicle selection for new contract
  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const selectedVehicle = vehicles.find(v => v._id === vehicleId); // Use _id

    if (selectedVehicle) {
      setNewContract(prev => ({
        ...prev,
        matricule: selectedVehicle.licensePlate,
        vehicle: selectedVehicle, // Store full vehicle object
        pricePerDay: selectedVehicle.rentalPrice,
        startingKm: selectedVehicle.mileage,
        total: calculateTotal(selectedVehicle.rentalPrice, prev.duration || 1, prev.discount || 0)
      }));
    }
  };

  // Handle vehicle selection for edit form
  const handleEditVehicleChange = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v._id === vehicleId); // Use _id

    if (selectedVehicle && editedContract) {
      const newPricePerDay = selectedVehicle.rentalPrice;
      const newTotal = calculateTotal(newPricePerDay, editedContract.duration, editedContract.discount);

      setEditedContract({
        ...editedContract,
        matricule: selectedVehicle.licensePlate,
        vehicle: selectedVehicle, // Store full vehicle object
        pricePerDay: newPricePerDay,
        startingKm: selectedVehicle.mileage,
        total: newTotal,
        remaining: newTotal - editedContract.advance
      });
    }
  };

  // Handle new contract input changes
  const handleNewContractChange = (field: keyof Partial<Contract> | `client.${keyof Client}` | `vehicle.${keyof Vehicle}` | `secondDriver.${keyof SecondDriverData}` | `equipment.${keyof Equipment}` | `extension.duration` | `extension.pricePerDay`, value: any) => {
    setNewContract(prev => {
      const updated = { ...prev } as any;

      // Handle validation for "Lieu de Contrat" and "Lieu Livraison"
      if (field === 'contractLocation') {
        if (isOnlySpaces(value as string)) {
          setValidationErrors(prev => ({ ...prev, contractLocation: 'Le champ "Lieu de Contrat" ne peut pas contenir uniquement des espaces.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.contractLocation;
            return newErrors;
          });
        }
      }
      if (field === 'pickupLocation') {
        if (isOnlySpaces(value as string)) {
          setValidationErrors(prev => ({ ...prev, pickupLocation: 'Le champ "Lieu Livraison" ne peut pas contenir uniquement des espaces.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.pickupLocation;
            return newErrors;
          });
        }
      }
      // Handle validation for "Lieu Récupération"
      if (field === 'returnLocation') {
        // Allow empty string for returnLocation
        if (typeof value === 'string' && value.trim().length === 0 && value.length > 0) { // Only validate if it's just spaces, not truly empty
          setValidationErrors(prev => ({ ...prev, returnLocation: 'Le champ "Lieu Récupération" ne peut pas contenir uniquement des espaces.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.returnLocation;
            return newErrors;
          });
        }
      }

      // Handle nested fields
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'secondDriver') {
          if (isOnlySpaces(value as string)) {
            setValidationErrors(prev => ({ ...prev, [field]: `Le champ "${child}" ne peut pas contenir uniquement des espaces.` }));
          } else {
            setValidationErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[field];
              return newErrors;
            });
          }
          updated[parent] = { ...updated[parent], [child]: value };
        } else {
          updated[parent] = { ...updated[parent], [child]: value };
        }
      } else {
        updated[field] = value;
      }

      // Calculate duration if departureDate or returnDate changes
      if (field === 'departureDate' || field === 'returnDate') {
        const departure = field === 'departureDate' ? new Date(value) : new Date(updated.departureDate);
        const returnDate = field === 'returnDate' ? new Date(value) : new Date(updated.returnDate);

        if (departure && returnDate && departure <= returnDate) {
          const diffTime = Math.abs(returnDate.getTime() - departure.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updated.duration = diffDays;
        } else if (departure && returnDate && departure > returnDate) {
          // If return date is before departure date, set duration to 0 or handle error
          updated.duration = 0;
          setValidationErrors(prev => ({ ...prev, returnDate: 'La date de retour ne peut pas être antérieure à la date de départ.' }));
        } else {
          updated.duration = 1; // Default to 1 day if dates are not valid
        }
      }

      // Recalculate total when price, duration or discount changes
    if (field === 'pricePerDay' || field === 'duration' || field === 'discount' || field === 'departureDate' || field === 'returnDate' || field === 'departureTime') {
        updated.total = calculateTotal(
          updated.pricePerDay || 0,
          updated.duration || 1,
          updated.discount || 0
        );
        updated.remaining = (updated.total || 0) - (updated.advance || 0);
      }

      // Update remaining amount when advance changes
      if (field === 'advance') {
        const advanceValue = Number(value);
        if (isNaN(advanceValue) || advanceValue < 0) {
          setValidationErrors(prev => ({ ...prev, advance: 'L\'avance ne peut pas être une valeur négative.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.advance;
            return newErrors;
          });
        }
        updated.remaining = (updated.total || 0) - (advanceValue || 0);
      }

      if (field === 'pricePerDay' || field === 'guarantee') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          setValidationErrors(prev => ({ ...prev, [field]: 'La valeur ne peut pas être négative.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }

      // Handle extension duration and price per day
      if (field === 'extension.duration' || field === 'extension.pricePerDay') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1) {
          setValidationErrors(prev => ({ ...prev, [field]: 'La valeur ne peut pas être inférieure à 1.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }

      return updated;
    });
  };

  // Handle new contract submission
  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform validation before submission
    if (isOnlySpaces(newContract.contractLocation)) {
      toast.error('Le champ "Lieu de Contrat" ne peut pas contenir uniquement des espaces.');
      return;
    }
    if (isOnlySpaces(newContract.pickupLocation)) {
      toast.error('Le champ "Lieu Livraison" ne peut pas contenir uniquement des espaces.');
      return;
    }
    // Removed isOnlySpaces validation for newContract.returnLocation to allow empty strings
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Veuillez corriger les erreurs de validation.');
      return;
    }

    if (!selectedClientId || !selectedVehicleId) {
      toast.error('Please select a client and a vehicle.');
      return;
    }

    // Validate required vehicle fields
    const requiredVehicleFields = ['_id', 'chassisNumber', 'model', 'licensePlate', 'brand'];
    for (const field of requiredVehicleFields) {
      if (!newContract.vehicle || !newContract.vehicle[field as keyof Vehicle]) {
        toast.error(`Missing required vehicle field: ${field}. Please ensure the selected vehicle has all necessary data.`);
        console.error(`Missing required vehicle field: ${field}`, newContract.vehicle);
        return;
      }
    }

    // Validation for "Avance" field
    if (newContract.advance !== undefined && newContract.advance < 0) {
      toast.error('L\'avance ne peut pas être une valeur négative.');
      return;
    }
    if (newContract.pricePerDay !== undefined && newContract.pricePerDay < 0) {
      toast.error('Le prix par jour ne peut pas être une valeur négative.');
      return;
    }
    if (newContract.guarantee !== undefined && newContract.guarantee < 0) {
      toast.error('La garantie ne peut pas être une valeur négative.');
      return;
    }
    if (newContract.total !== undefined && newContract.total < 0) {
      toast.error('Le total ne peut pas être une valeur négative. Veuillez ajuster le prix par jour, la durée ou la remise.');
      return;
    }
    if (newContract.remaining !== undefined && newContract.remaining < 0) {
      toast.error('Le reste à payer ne peut pas être une valeur négative. Veuillez ajuster l\'avance.');
      return;
    }
    if (newContract.extension?.duration !== undefined && newContract.extension.duration < 1) {
      toast.error('La durée de prolongation ne peut pas être inférieure à 1.');
      return;
    }
    if (newContract.extension?.pricePerDay !== undefined && newContract.extension.pricePerDay < 1) {
      toast.error('Le prix par jour de prolongation ne peut pas être inférieur à 1.');
      return;
    }

    try {
      // Ensure client.name is correctly set before sending
      const formData = new FormData();

      // Append all fields from newContract except piecesJointes, client, vehicle, and secondDriver
      for (const key in newContract) {
        if (Object.prototype.hasOwnProperty.call(newContract, key)) {
          const value = newContract[key as keyof Contract];
          if (key === 'piecesJointes' || key === 'client' || key === 'vehicle' || key === 'secondDriver') {
            continue; // Handle these separately
          }
          // Always append returnLocation, even if it's an empty string
          if (key === 'returnLocation') {
            formData.append(key, String(value || '')); // Ensure it's a string, default to empty if null/undefined
          } else if (key !== 'piecesJointes' && key !== 'client' && key !== 'vehicle' && key !== 'secondDriver') {
            if (typeof value === 'object' && value !== null) {
              formData.append(key, JSON.stringify(value));
            } else if (value !== undefined) {
              formData.append(key, String(value));
            }
          }
        }
      }

      // Append client ID, vehicle object, and secondDriver object as JSON strings
      if (newContract.client?._id) {
        formData.append('client', newContract.client._id);
      }
      if (newContract.vehicle) {
        // Ensure vehicle ID is sent as 'id' for the backend
        const vehicleToSend = { ...newContract.vehicle, id: newContract.vehicle._id };
        formData.append('vehicle', JSON.stringify(vehicleToSend));
      }
      // If secondDriver exists, append the entire object as a JSON string
      if (newContract.secondDriver) {
        formData.append('secondDriver', JSON.stringify(newContract.secondDriver));
      }

      // Append newly uploaded files
      newContractFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await axios.post<Contract>(API_URL_CONTRACTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const newContractData = response.data;

      // Populate the client and vehicle for the newly created contract
      const fullClient = customers.find(c => c._id === (newContractData.client as any)?._id);
      const fullVehicle = vehicles.find(v => v._id === (newContractData.vehicle as any)?._id || v._id === (newContractData.vehicle as any));

      const populatedNewContract = {
        ...newContractData,
        client: fullClient ? {
          _id: fullClient._id,
          prenomFr: fullClient.prenomFr,
          nomFr: fullClient.nomFr,
          numeroPermis: fullClient.numeroPermis,
          permisValidite: fullClient.permisValidite,
        } : undefined, // Set client to undefined if not found
        vehicle: fullVehicle || newContractData.vehicle,
        returnLocation: newContractData.returnLocation, // Ensure returnLocation is explicitly included
      };

      setContracts([...contracts, populatedNewContract]);
      setSelectedContract(populatedNewContract); // Update selectedContract with populated data
      toast.success('Contract created successfully!');
      setShowNewContractModal(false);
      setNewContractFiles([]); // Clear new files after successful add
      setNewContract({ // Reset form state
        client: { _id: '', prenomFr: '', nomFr: '', numeroPermis: '', permisValidite: '' },
        contractNumber: '', contractDate: new Date().toISOString().split('T')[0],
        departureDate: new Date().toISOString().split('T')[0], departureTime: '09:00', returnDate: new Date().toISOString().split('T')[0],
        contractLocation: '', duration: 1, pickupLocation: '', matricule: '',
        vehicle: { _id: '', chassisNumber: '', licensePlate: '', brand: '', model: '', circulationDate: '', fuelType: 'essence', fuelLevel: 'plein', mileage: 0, color: '', rentalPrice: 0, statut: 'En parc', equipment: { pneuDeSecours: false, posteRadio: false, cricManivelle: false, allumeCigare: false, jeuDe4Tapis: false, vetDeSecurite: false }, createdAt: '', updatedAt: '' },
        pricePerDay: 0, startingKm: 0, discount: 0, fuelLevel: 'plein', total: 0, guarantee: 5000,
        paymentType: 'espece', advance: 0, remaining: 0, status: 'en_cours',
        secondDriver: undefined, // Reset secondDriver to undefined
        equipment: { pneuDeSecours: false, posteRadio: false, cricManivelle: false, allumeCigare: false, jeuDe4Tapis: false, vetDeSecurite: false },
        piecesJointes: []
      });
      setSelectedClientId('');
      setSelectedVehicleId('');
    } catch (err: any) { // Catch error as 'any' to access response data
      console.error('Error adding contract:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('Backend error response:', err.response.data);
        toast.error(`Failed to create contract: ${err.response.data.message || err.message}`);
      } else {
        toast.error('Failed to create contract. Please check console for details.');
      }
    }
  };

  const handleInputChange = (field: keyof Contract | `client.${keyof Client}` | `vehicle.${keyof Vehicle}` | `secondDriver.${keyof SecondDriverData}` | `equipment.${keyof Equipment}` | `extension.duration` | `extension.pricePerDay`, value: any) => {
    if (editedContract) {
      const updatedContract = { ...editedContract } as any; // Use any for easier nested updates

      // Handle validation for "Lieu de Contrat" and "Lieu Livraison"
      if (field === 'contractLocation') {
        if (isOnlySpaces(value as string)) {
          setValidationErrors(prev => ({ ...prev, contractLocation: 'Le champ "Lieu de Contrat" ne peut pas contenir uniquement des espaces.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.contractLocation;
            return newErrors;
          });
        }
      }
      if (field === 'pickupLocation') {
        if (isOnlySpaces(value as string)) {
          setValidationErrors(prev => ({ ...prev, pickupLocation: 'Le champ "Lieu Livraison" ne peut pas contenir uniquement des espaces.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.pickupLocation;
            return newErrors;
          });
        }
      }
      // Handle validation for "Lieu Récupération"
      if (field === 'returnLocation') {
        // Allow empty string for returnLocation
        if (typeof value === 'string' && value.trim().length === 0 && value.length > 0) { // Only validate if it's just spaces, not truly empty
          setValidationErrors(prev => ({ ...prev, returnLocation: 'Le champ "Lieu Récupération" ne peut pas contenir uniquement des espaces.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.returnLocation;
            return newErrors;
          });
        }
      }

      // Calculate duration if departureDate or returnDate changes in edit mode
      if (field === 'departureDate' || field === 'returnDate') {
        const departure = field === 'departureDate' ? new Date(value) : new Date(updatedContract.departureDate);
        const returnDate = field === 'returnDate' ? new Date(value) : new Date(updatedContract.returnDate);

        if (departure && returnDate && departure <= returnDate) {
          const diffTime = Math.abs(returnDate.getTime() - departure.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updatedContract.duration = diffDays;
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.returnDate;
            return newErrors;
          });
        } else if (departure && returnDate && departure > returnDate) {
          updatedContract.duration = 0;
          setValidationErrors(prev => ({ ...prev, returnDate: 'La date de retour ne peut pas être antérieure à la date de départ.' }));
        } else {
          updatedContract.duration = 1;
        }
      }

      if (field === 'pricePerDay' || field === 'duration' || field === 'discount' || field === 'departureDate' || field === 'returnDate' || field === 'departureTime') {
        const pricePerDay = updatedContract.pricePerDay;
        const duration = updatedContract.duration;
        const discount = updatedContract.discount;
        updatedContract.total = calculateTotal(pricePerDay, duration, discount);
        updatedContract.remaining = (updatedContract.total || 0) - (updatedContract.advance || 0);
      }

      if (field === 'advance') {
        const advance = Number(value);
        if (isNaN(advance) || advance < 0) {
          setValidationErrors(prev => ({ ...prev, advance: 'L\'avance ne peut pas être une valeur négative.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.advance;
            return newErrors;
          });
        }
        updatedContract.advance = advance;
        updatedContract.remaining = (updatedContract.total || 0) - advance;
      }

      if (field === 'pricePerDay' || field === 'guarantee') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          setValidationErrors(prev => ({ ...prev, [field]: 'La valeur ne peut pas être négative.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }

      // Handle extension duration and price per day
      if (field === 'extension.duration' || field === 'extension.pricePerDay') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1) {
          setValidationErrors(prev => ({ ...prev, [field]: 'La valeur ne peut pas être inférieure à 1.' }));
        } else {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }

      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        if (parentField === 'client') {
          if (!updatedContract.client) {
            updatedContract.client = { _id: '' }; // Initialize client if it's null or undefined
          }
          updatedContract.client = { ...updatedContract.client, [childField]: value };
        } else if (parentField === 'secondDriver' && updatedContract.secondDriver) {
          if (isOnlySpaces(value as string)) {
            setValidationErrors(prev => ({ ...prev, [field]: `Le champ "${childField}" ne peut pas contenir uniquement des espaces.` }));
          } else {
            setValidationErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[field];
              return newErrors;
            });
          }
          updatedContract.secondDriver = { ...updatedContract.secondDriver, [childField]: value };
        } else if (parentField === 'vehicle') {
          updatedContract.vehicle = { ...updatedContract.vehicle, [childField]: value };
        } else if (parentField === 'equipment') {
          updatedContract.equipment = { ...updatedContract.equipment, [childField]: value };
        } else if (parentField === 'extension') {
          if (!updatedContract.extension) {
            updatedContract.extension = { duration: 0, pricePerDay: 0 };
          }
          updatedContract.extension = { ...updatedContract.extension, [childField]: Number(value) };
        }
      } else {
        updatedContract[field] = value;
      }

      setEditedContract(updatedContract);
    }
  };

  const handleDeleteContract = async (contractId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      try {
        await axios.delete(`${API_URL_CONTRACTS}/${contractId}`);
        setContracts(contracts.filter(contract => contract._id !== contractId));
        if (selectedContract?._id === contractId) {
          setSelectedContract(null);
        }
        toast.success('Contract deleted successfully!');
      } catch (err) {
        console.error('Error deleting contract:', err);
        toast.error('Failed to delete contract.');
      }
    }
  };

  const handleRemoveExistingDocument = async (docToRemove: Document) => {
    if (!selectedContract) return;
    try {
      await axios.delete(`${API_URL_CONTRACTS}/${selectedContract._id}/documents`, {
        data: { documentUrl: docToRemove.url }
      });
      setSelectedContract(prev => {
        if (!prev) return null;
        return {
          ...prev,
          piecesJointes: prev.piecesJointes?.filter(doc => doc.url !== docToRemove.url),
        };
      });
      toast.success('Document supprimé avec succès.');
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      toast.error('Échec de la suppression du document.');
    }
  };

  // Generate printable HTML for a contract using the provided template and populate fields
  const generateContractHtml = (contract: Contract) => {
    const safe = (v: any) => (v === null || v === undefined) ? '' : String(v);
  const vehicle: any = contract.vehicle || {};
  const client: any = contract.client || {};
  // only use secondDriver if present. Do NOT fallback to client for Conducteur (2)
  const second: any = contract.secondDriver || {};
    const equipment: any = contract.equipment || {};
    const extension = contract.extension;

    const paymentMap: any = { espece: 'Espèce', cheque: 'Chèque', carte_bancaire: 'Carte Bancaire', virement: 'Virement' };

    // Prepare an escaped JSON of the contract for use in the print window script if needed
    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
    };

    const contractJson = JSON.stringify(contract)
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/'/g, '\\\'')  // Escape single quotes
      .replace(/"/g, '\\"')   // Escape double quotes
      .replace(/`/g, '\\`')   // Escape backticks
      .replace(/\$/g, '\\$');  // Escape dollar signs for template literals

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Contrat de location - NetCar</title>
  <style>
    :root{--accent:#f2c200;--black:#111;--muted:#666}
    body{font-family: 'Segoe UI', Arial, sans-serif;color:var(--black);margin:18px;background:#fff}
    /* make the contract span the available page width */
    .container{max-width:100%;width:100%;margin:0;padding:0}
    body{font-size:10px;margin:5mm;line-height:1.2}
    header{display:flex;gap:10px;align-items:flex-start;margin-bottom:5px}
    .logo-wrap{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
    .logo{width:150px;height:100px;object-fit:contain;display:block}
    .title h1{margin:0;font-size:18px}
    .title{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%}
    .subtitle{color:var(--muted);font-size:12px;margin-top:3px}
    .contact{border:1px solid var(--accent);border-radius:6px;padding:8px;font-size:10px;width:250px;margin-left:auto;text-align:left;direction:ltr}
    .contact small{display:block;line-height:1.2}
    .contact strong{color:var(--accent)}
    .logo img{max-width:150px;height:auto}

    .yellow-box{border:1px solid var(--accent);border-radius:6px;padding:8px;margin-top:5px}
    .row{display:flex;gap:8px}
    .col{flex:1}
    .fields{display:grid;grid-template-columns:1fr 1fr;gap:4px}
    .field{font-size:10px}
      input.box-field,
      input.line,
      textarea.box-field,
      textarea.line {
        display:block;
        box-sizing:border-box;
        width:100%;
        min-height:40px; /* Increased min-height */
        height:auto;
        border:1px solid #444;
        border-radius:3px;
        background:#fff;
        padding:3px 5px;
        font-size:10px;
        margin:3px 0;
        resize:vertical; /* Allow vertical resize for user, but auto-resize should handle it */
        overflow: hidden; /* Hide scrollbar initially, let JS handle height */
      }

    .access-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px;align-items:start;margin-top:5px}
    .access-item{display:flex;justify-content:space-between;align-items:center;padding:3px 2px;font-size:10px}
    .access-label{color:var(--black);}
    input.checkbox{width:12px;height:12px;-webkit-appearance:none;appearance:none;border:1px solid var(--black);border-radius:2px;background:#fff}
    input.checkbox:checked{background:var(--black)}

    .conducteurs{display:grid;grid-template-columns:1fr 1fr 180px;gap:10px;align-items:stretch;margin-top:8px}
    .conducteur{border:1px solid #eee;padding:6px;border-radius:4px;display:flex;flex-direction:column;flex:1}
    .conducteur h3{margin:0 0 4px;font-size:11px}
    .small{font-size:9px;color:var(--muted);margin-bottom:2px;}

    .diagram{width:180px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
    .car-img{width:120px;height:auto;display:block;margin:4px 0}
    .conducteur input.box-field,
    .conducteur input.line,
    .conducteur textarea.box-field,
    .conducteur textarea.line{
      width:100%;
      margin:3px 0;
      min-height:40px; /* Increased min-height */
      padding:3px 5px;
      height:auto;
      overflow: hidden; /* Hide scrollbar initially, let JS handle height */
    }
    .diagram-label{font-size:10px;color:var(--muted);text-align:center;margin-top:2px}

    .footer-note{
      font-size:12px;
      color:var(--black);
      margin-top:10px;
      font-weight:600;
      text-align:center;
      padding:6px 8px;
      border:1px solid rgba(0,0,0,0.06);
      border-radius:4px;
      background:rgba(242,194,0,0.08);
    }

    .yellow-box .row{gap:10px}
    .yellow-box .col{padding-right:3px}
    .yellow-box input.line{margin:6px 0;background:#fff}

    .signatures{display:flex;gap:100px;padding:10px;margin:15px auto 0;justify-content:center;align-items:stretch;max-width:600px}
    .sig{flex:0 0 auto;border:1px solid #000;height:100px;max-width:200px;min-width:180px;display:flex;align-items:center;justify-content:center;padding:4px}
    .sig small{display:block;text-align:center;color:var(--muted);opacity:0.45}

    @media print{
      body{margin:5mm;font-size:9px;line-height:1.1}
      .container{max-width:100%;padding:0}
      header{gap:8px;margin-bottom:4px}
      .logo{width:120px;height:80px}
      .title h1{font-size:16px}
      .subtitle{font-size:10px}
      .contact{padding:6px;font-size:9px;width:200px}
      .yellow-box{padding:6px;margin-top:4px}
      .row{gap:6px}
      .fields{gap:3px}
      .field{font-size:9px}
      input.box-field, input.line, textarea.box-field, textarea.line{min-height:18px;padding:2px 4px;font-size:9px;margin:2px 0}
      .access-grid{gap:2px;margin-top:3px}
      .access-item{padding:2px;font-size:9px}
      input.checkbox{width:10px;height:10px}
      .conducteurs{gap:8px;margin-top:6px;grid-template-columns:1fr 1fr 150px;}
      .conducteur{padding:4px}
      .conducteur h3{font-size:10px}
      .small{font-size:8px;margin-bottom:1px}
      .car-img{width:100px;margin:3px 0}
      .diagram-label{font-size:9px}
      .footer-note{font-size:10px;margin-top:8px;padding:4px 6px}
      .signatures{gap:80px;padding:8px;margin:12px auto 0;max-width:500px}
      .sig{height:80px;max-width:180px;min-width:150px;padding:3px}
    }
  </style>
</head>
<body>
  <!-- SECTION: Container -->
  <div class="container">
    <header>
    <!-- SECTION: Header (Logo & Contact) -->
    <div class="logo-wrap">
        <img src="media/netcar.png" alt="NetCar" class="logo">
        <div class="title">
          <h1>LOCATION DE VOITURE</h1>
          <div class="subtitle">Courte et Longue Durée</div>
        </div>
      </div>
      <div class="contact">
        <strong>Adresse:</strong> N° 24, 1er étage Angle Rue Oussama Ibnou Zaid (ex. Jura) & Rue Ahmed Joumari (ex Rue D’auvergne) Casablanca.<br>
        <small><strong>FIX:</strong> 05 22 23 58 66</small>
        <small><strong>GSM:</strong> 06 61 09 57 41 - 06 63 72 10 40</small>
        <small><strong>E-mail:</strong> support@mednetcar.ma</small>
      </div>
    </header>

    <div class="yellow-box">
    <!-- SECTION: Car Details & Accessories -->
    <div class="row">
        <div class="col">
          <div class="fields">
            <div class="field"><strong>Marque:</strong> <textarea class="box-field" name="marque"></textarea></div>
            <div class="field"><strong>Date et lieu de livraison:</strong> <textarea class="box-field" name="date_lieu_livraison"></textarea></div>
            <div class="field"><strong>Immat:</strong> <textarea class="box-field" name="immatriculation"></textarea></div>
            <div class="field"><strong>Date et lieu de reprise:</strong> <textarea class="box-field" name="date_lieu_reprise"></textarea></div>
            <div class="field"><strong>Kilométrage Dép:</strong> <textarea class="box-field" name="kilometrage_dep"></textarea></div>
            <div class="field"><strong>Prolonger jusqu'au:</strong> <textarea class="box-field" name="prolonger_jusqua"></textarea></div>
            <div class="field"><strong>Nombre de jours:</strong> <textarea class="box-field" name="nombre_de_jours"></textarea></div>
            <div class="field"><strong>Heure de départ:</strong> <textarea class="box-field" name="heure_de_depart"></textarea></div>
            <div class="field"><strong>Carburant:</strong> <textarea class="box-field" name="carburant"></textarea></div>
            <div class="field"><strong>Transmission:</strong> <textarea class="box-field" name="transmission"></textarea></div>
            <div class="field"><strong>Franchise d’assurance:</strong> <textarea class="box-field" name="franchise_assurance"></textarea></div>
          </div>
        </div>

        <div class="col">
          <div class="access-grid">
            <div class="access-item"><span class="access-label">PNEU DE SECOURS:</span><input type="checkbox" class="checkbox" name="pneu_de_secours"/></div>
            <div class="access-item"><span class="access-label">ALLUME CIGARE:</span><input type="checkbox" class="checkbox" name="allume_cigare"/></div>

            <div class="access-item"><span class="access-label">POSTE RADIO:</span><input type="checkbox" class="checkbox" name="poste_radio"/></div>
            <div class="access-item"><span class="access-label">JEU DE 4 TAPIS:</span><input type="checkbox" class="checkbox" name="jeu_de_4_tapis"/></div>

            <div class="access-item"><span class="access-label">CRIC MANIVELLE:</span><input type="checkbox" class="checkbox" name="cric_manivelle"/></div>
            <div class="access-item"><span class="access-label">VÊT.DE SÉCURITÉ:</span><input type="checkbox" class="checkbox" name="vet_de_securite"/></div>
          </div>
        </div>
      </div>
    </div>

    <div class="conducteurs">
    <!-- SECTION: Conducteurs (Drivers) & Car Condition -->
    <div class="conducteur">
        <h3>CONDUCTEUR (1)</h3>
  <div class="small">Nom:</div><textarea class="line" name="conducteur1_nom"></textarea>
  <div class="small">Nationalité:</div><textarea class="line" name="conducteur1_nationalite"></textarea>
  <div class="small">Né (e) le:</div><textarea class="line" name="conducteur1_ne_le"></textarea>
  <div class="small">Adresse:</div><textarea class="line" name="conducteur1_adresse"></textarea>
  <div class="small">Téléphone:</div><textarea class="line" name="conducteur1_telephone"></textarea>
  <div class="small">Adresse à l'étranger:</div><textarea class="line" name="conducteur1_adresse_etranger"></textarea>
  <div class="small">Permis de conduite N°:</div><textarea class="line" name="conducteur1_permis_num"></textarea>
  <div class="small">Délivré le:</div><textarea class="line" name="conducteur1_delivre_le"></textarea>
  <div class="small">Passeport N° ou CIN:</div><textarea class="line" name="conducteur1_passeport_num"></textarea>
  <div class="small">Délivré le:</div><textarea class="line" name="conducteur1_passeport_delivre_le"></textarea>
      </div>

      <div class="conducteur">
        <h3>CONDUCTEUR (2)</h3>
  <div class="small">Nom:</div><textarea class="line" name="conducteur2_nom"></textarea>
  <div class="small">Nationalité:</div><textarea class="line" name="conducteur2_nationalite"></textarea>
  <div class="small">Né (e) le:</div><textarea class="line" name="conducteur2_ne_le"></textarea>
  <div class="small">Adresse:</div><textarea class="line" name="conducteur2_adresse"></textarea>
  <div class="small">Téléphone:</div><textarea class="line" name="conducteur2_telephone"></textarea>
  <div class="small">Adresse à l'étranger:</div><textarea class="line" name="conducteur2_adresse_etranger"></textarea>
  <div class="small">Permis de conduite N°:</div><textarea class="line" name="conducteur2_permis_num"></textarea>
  <div class="small">Délivré le:</div><textarea class="line" name="conducteur2_delivre_le"></textarea>
  <div class="small">Passeport N° ou CIN:</div><textarea class="line" name="conducteur2_passeport_num"></textarea>
  <div class="small">Délivré le:</div><textarea class="line" name="conducteur2_passeport_delivre_le"></textarea>
      </div>

      <div class="diagram">
        <!-- replaced SVG with two car images for Départ et Retour -->
        <img src="media/caretat.jpg" alt="Départ" class="car-img">
        <div class="diagram-label">Départ</div>
        <img src="media/caretat.jpg" alt="Retour" class="car-img">
        <div class="diagram-label">Retour</div>
      </div>
    </div>

    <div class="yellow-box" style="margin-top:5px">
    <!-- SECTION: Pricing & Payment -->
    <div class="row">
        <div class="col">
          <div class="small">Prix unitaire:</div><textarea class="line" name="prix_unitaire"></textarea>
          <div class="small">Total T.T.C:</div><textarea class="line" name="total_ttc"></textarea>
        </div>
        <div class="col">
          <div class="small">Avance:</div><textarea class="line" name="avance"></textarea>
          <div class="small">Reste:</div><textarea class="line" name="reste"></textarea>
          <div class="small">Mode de paiement:</div><textarea class="line" name="mode_de_paiement"></textarea>
        </div>
      </div>
    </div>

    <div class="footer-note">Je reconnais avoir pris connaissance des conditions générales de location.</div>
    <!-- SECTION: Footer Note -->

    <div class="signatures">
    <!-- SECTION: Signatures -->
    <div class="signatures">
      <div class="sig"><small>Signature conducteur</small></div>
      <div class="sig"><small>Signature conducteur</small></div>
    </div>
  </div>

  <script>
    // auto-resize textareas to fit their content
    (function(){
      function resize(el){
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight) + 'px';
      }
      var areas = document.querySelectorAll('textarea.box-field, textarea.line');
      areas.forEach(function(a){
        // initialize height based on current content
        resize(a);
        a.addEventListener('input', function(){ resize(a); });
      });
      window.addEventListener('load', function(){ areas.forEach(function(a){ resize(a); }); });
    })();
  </script>
  <script>
    (function(){
      const c = JSON.parse('${contractJson}');
      const v = c.vehicle || {};
      const client = c.client || {};
      const second = c.secondDriver || null;
      const eq = c.equipment || {};
      const extension = c.extension || null;

      const setVal = (name, value) => {
        const el = document.querySelector('[name="'+name+'"]');
        if(!el) return;
        if(el.type === 'checkbox') {
          el.checked = !!value;
          return;
        }
        el.value = value === null || value === undefined ? '' : value;
        try {
          if (el.tagName === 'TEXTAREA') {
            el.style.height = 'auto';
            const h = el.scrollHeight || 40; // Use 40 as a new base height
            el.style.height = Math.max(h, 40) + 'px';
          }
        } catch (e) {}
      };

      const expandAllTextareas = () => {
        document.querySelectorAll('textarea').forEach(t => {
          try {
            t.style.height = 'auto';
            const h = t.scrollHeight || 40; // Use 40 as a new base height
            t.style.height = Math.max(h, 40) + 'px';
          } catch (e) {}
        });
      };

      setVal('marque', v.brand || v.model || '');
      setVal('date_lieu_livraison', (c.pickupLocation ? c.pickupLocation + ' - ' : '') + (c.departureDate ? new Date(c.departureDate).toLocaleDateString('fr-FR') : ''));
      setVal('immatriculation', v.licensePlate || c.matricule || '');
      setVal('date_lieu_reprise', (c.returnLocation ? c.returnLocation + ' - ' : '') + (c.returnDate ? new Date(c.returnDate).toLocaleDateString('fr-FR') : ''));
      setVal('kilometrage_dep', c.startingKm || '');
      setVal('prolonger_jusqua', extension ? (extension.duration + ' jours') : '');
      setVal('nombre_de_jours', c.duration || '');
      setVal('heure_de_depart', c.departureTime || '');
      setVal('carburant', v.fuelType || '');
      setVal('transmission', v.transmission || v.gearbox || '');
      setVal('franchise_assurance', (v.insurance && v.insurance.company) || v.insuranceCompany || v.compagnie || c.insuranceCompany || '');

      setVal('pneu_de_secours', eq.pneuDeSecours);
      setVal('allume_cigare', eq.allumeCigare);
      setVal('poste_radio', eq.posteRadio);
      setVal('jeu_de_4_tapis', eq.jeuDe4Tapis);
      setVal('cric_manivelle', eq.cricManivelle);
      setVal('vet_de_securite', eq.vetDeSecurite);

      setVal('conducteur1_nom', ((client.prenomFr || '') + ' ' + (client.nomFr || '')).trim());
      setVal('conducteur1_nationalite', client.nationalite || client.nationality || '');
      setVal('conducteur1_ne_le', client.dateNaissance || client.birthDate || '');
      const adresse1 = client.adresseFr ? (client.adresseFr + (client.ville ? (', ' + client.ville) : '') + (client.codePostal ? (' ' + client.codePostal) : '')) : (client.adresseAr || client.adresse || client.address || '');
      setVal('conducteur1_adresse', adresse1);
      setVal('conducteur1_telephone', client.telephone || client.telephone2 || client.phone || client.gsm || '');
      setVal('conducteur1_adresse_etranger', client.adresseAr || client.adresseEtranger || client.addressAbroad || '');
      setVal('conducteur1_permis_num', client.numeroPermis || client.numero_permis || '');
      setVal('conducteur1_delivre_le', client.permisValidite || client.permis_delivre_le || client.permisValidite || '');
      setVal('conducteur1_passeport_num', client.cin || client.cinNumber || client.passport || '');
      setVal('conducteur1_passeport_delivre_le', client.cinDelivreLe || client.passportIssuedDate || client.cinDelivreLe || '');

      if (c.secondDriver) {
        const fullName2 = (((second.prenomFr || second.prenom || '') + ' ' + (second.nomFr || second.nom || '')).trim());
        setVal('conducteur2_nom', fullName2);
        setVal('conducteur2_nationalite', second.nationalite || second.nationality || '');
        setVal('conducteur2_ne_le', second.dateNaissance || second.dateOfBirth || second.birthDate || '');
        const adresse2 = second.adresseFr ? (second.adresseFr + (second.ville ? (', ' + second.ville) : '') + (second.codePostal ? (' ' + second.codePostal) : '')) : (second.adresse || second.adresseAr || second.address || '');
        setVal('conducteur2_adresse', adresse2);
        setVal('conducteur2_telephone', second.telephone || second.telephone2 || second.phone || second.gsm || '');
        setVal('conducteur2_adresse_etranger', second.adresseEtranger || second.adresseAr || second.addressAbroad || '');
        setVal('conducteur2_permis_num', second.permisNumero || second.numeroPermis || second.numero_permis || second.permisNum || '');
        setVal('conducteur2_delivre_le', second.permisDelivreLe || second.permisValidite || second.permis_delivre_le || '');
        setVal('conducteur2_passeport_num', second.passeportCin || second.cin || second.cinNumber || second.passport || '');
        setVal('conducteur2_passeport_delivre_le', second.passeportDelivreLe || second.cinDelivreLe || second.passportIssuedDate || '');
      } else {
        setVal('conducteur2_nom', '');
        setVal('conducteur2_nationalite', '');
        setVal('conducteur2_ne_le', '');
        setVal('conducteur2_adresse', '');
        setVal('conducteur2_telephone', '');
        setVal('conducteur2_adresse_etranger', '');
        setVal('conducteur2_permis_num', '');
        setVal('conducteur2_delivre_le', '');
        setVal('conducteur2_passeport_num', '');
        setVal('conducteur2_passeport_delivre_le', '');
      }

      setVal('prix_unitaire', c.pricePerDay != null ? c.pricePerDay + ' DH' : '');
      setVal('total_ttc', c.total != null ? c.total + ' DH' : '');
      setVal('avance', c.advance != null ? c.advance + ' DH' : '');
      setVal('reste', c.remaining != null ? c.remaining + ' DH' : '');
      setVal('mode_de_paiement', ${JSON.stringify(paymentMap)}[c.paymentType] || c.paymentType || '');

      expandAllTextareas();

    })();
  </script>
</body>
</html>`;
  };

  const handlePrint = (contract: Contract) => {
    try {
      const html = generateContractHtml(contract);
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez le bloqueur de fenêtres popup.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // give the window a moment to render
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      console.error('Erreur lors de la génération du contrat pour impression:', err);
      toast.error('Erreur lors de la génération du contrat pour impression.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading contracts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p className="text-lg">{error}</p>
        <button
          onClick={fetchContracts}
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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Contrats</h1>
        <button
          onClick={() => {
            setShowNewContractModal(true);
            setValidationErrors({}); // Clear validation errors when opening modal
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          Nouveau Contrat
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              id="search-contract"
              type="text"
              placeholder="Rechercher un contrat..."
              className="pl-10 px-4 py-2 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">Filtrer par statut</label>
            <select
              id="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ContractStatus)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="retournee">Retournée</option>
            </select>
          </div>
          <div>
            <label htmlFor="start-date-filter" className="sr-only">Date de début</label>
            <DatePicker
              id="start-date-filter"
              selected={startDateFilter}
              onChange={(date: Date | null) => setStartDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              placeholderText="Date de début"
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label htmlFor="end-date-filter" className="sr-only">Date de fin</label>
            <DatePicker
              id="end-date-filter"
              selected={endDateFilter}
              onChange={(date: Date | null) => setEndDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              locale="fr"
              placeholderText="Date de fin"
              className="w-full border rounded-lg p-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrat
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => {
                  const vehicle = typeof contract.vehicle === 'object'
                    ? contract.vehicle
                    : vehicles.find(v => v._id === (contract.vehicle as any));

                  return (
                  <tr
                    key={contract._id}
                    onClick={() => {
                      // Find the fully populated contract from the state
                      const fullContract = contracts.find(c => c._id === contract._id);
                      if (fullContract) {
                        setSelectedContract(fullContract);
                      } else {
                        // Fallback if not found in state (shouldn't happen if fetchContracts is correct)
                        const vehicle = vehicles.find(v => v._id === (contract.vehicle as any)?._id || v._id === (contract.vehicle as any));
                        setSelectedContract({ ...contract, vehicle: vehicle || contract.vehicle });
                      }
                    }}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedContract?._id === contract._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="md:block overflow-x-auto md:overflow-visible">
                        <div className="flex items-center min-w-[220px] md:min-w-0">
                          <div className="flex-shrink-0 h-10 w-10">
                            {vehicle?.imageUrl ? (
                              <img
                                src={vehicle.imageUrl.startsWith('data:') ? vehicle.imageUrl : `${API_URL}/${vehicle.imageUrl.replace(/\\/g, '/').replace(/^\//, '')}`}
                                alt={`${vehicle.brand || 'N/A'} ${vehicle.model || 'N/A'}`}
                                className="w-10 h-10 object-cover rounded-full"
                              />
                            ) : (
                              <Car size={24} className="mx-auto mt-2 text-gray-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contract.contractNumber || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {`${contract.client?.prenomFr || ''} ${contract.client?.nomFr || ''}`.trim() || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {vehicle?.model || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle?.licensePlate || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(contract.departureDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.contractLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.total.toLocaleString('fr-FR')} DH
                      </div>
                      <div className={`text-xs ${
                        contract.remaining > 0 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {contract.remaining > 0
                          ? `Reste: ${contract.remaining.toLocaleString('fr-FR')} DH`
                          : 'Payé'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contract.status === 'en_cours'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      } ${getStatusColor(contract.status)}`}>
                        {contract.status === 'en_cours' ? 'En cours' : 'Retournée'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditButton
                        onClick={(e: React.MouseEvent) => handleEditClick(contract, e)}
                        size="md"
                        className="mr-3"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContract(contract._id, e);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucun contrat trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contract Details Panel */}
        <div className="lg:col-span-1">
          {selectedContract ? (
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">Détails du contrat</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => handleEditClick(selectedContract, e)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Modifier
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                {selectedContract.vehicle && typeof selectedContract.vehicle === 'object' ? (
                  <div className="p-4 border-b">
                    <h3 className="font-medium mb-2">Véhicule</h3>
                    <div className="flex items-center space-x-4">
                      {selectedContract.vehicle.imageUrl ? (
                        <img
                          src={selectedContract.vehicle.imageUrl.startsWith('data:') ? selectedContract.vehicle.imageUrl : `${API_URL}/${selectedContract.vehicle.imageUrl.replace(/\\/g, '/').replace(/^\//, '')}`}
                          alt={`${selectedContract.vehicle.brand || 'N/A'} ${selectedContract.vehicle.model || 'N/A'}`}
                          className="w-24 h-24 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow">
                          <Car size={48} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg">{selectedContract.vehicle.brand || 'N/A'} {selectedContract.vehicle.model || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{selectedContract.vehicle.licensePlate || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-b">
                    <h3 className="font-medium mb-2">Véhicule</h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow">
                        <Car size={48} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">N/A</p>
                        <p className="text-sm text-gray-600">N/A</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* N° de Contrat field is now hidden and generated automatically by the backend */}
                {/* <div>
                  <p className="text-sm text-gray-500">N° de Contrat</p>
                  {editMode && editedContract ? (
                    <input
                      type="text"
                      name="contractNumber"
                      value={editedContract.contractNumber || ''}
                      readOnly // Make contract number read-only in edit mode
                      className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
                    />
                  ) : (
                  <p className="font-medium">{selectedContract.contractNumber === '' ? '' : (selectedContract.contractNumber === null || selectedContract.contractNumber === undefined ? 'N/A' : selectedContract.contractNumber)}</p>
                  )}
                </div> */}
                {selectedContract.client && (
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    {editMode && editedContract ? (
                      <>
                        <select
                          name="client"
                          onChange={(e) => handleEditClientChange(e.target.value)}
                          value={editedContract.client?._id || ''}
                          className="w-full border rounded-lg p-2 mt-1"
                        >
                          <option value="">Sélectionner un client</option>
                          {customers.map(c => <option key={c._id} value={c._id}>{c.prenomFr} {c.nomFr}</option>)}
                        </select>
                        {editedContract.client && (
                          <>
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                              <input
                                type="text"
                                name="client.prenomFr"
                                value={editedContract.client.prenomFr || ''}
                                onChange={(e) => handleInputChange('client.prenomFr', e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1"
                              />
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                              <input
                                type="text"
                                name="client.nomFr"
                                value={editedContract.client.nomFr || ''}
                                onChange={(e) => handleInputChange('client.nomFr', e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1"
                              />
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">N° Permis</label>
                              <input
                                type="text"
                                name="client.numeroPermis"
                                value={editedContract.client.numeroPermis || ''}
                                onChange={(e) => handleInputChange('client.numeroPermis', e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1"
                              />
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Validité Permis</label>
                              <DatePicker
                                selected={editedContract.client.permisValidite ? new Date(editedContract.client.permisValidite) : null}
                                onChange={(date: Date | null) => handleInputChange('client.permisValidite', date ? date.toISOString() : '')}
                                dateFormat="dd/MM/yyyy"
                                locale="fr"
                                className="w-full border rounded-lg p-2 mt-1"
                              />
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="font-medium">
                        {`${selectedContract.client.prenomFr || ''} ${selectedContract.client.nomFr || ''}`.trim() || 'N/A'} <br />
                        <span className="text-sm text-gray-500">N° Permis: {selectedContract.client.numeroPermis || 'N/A'}</span> <br />
                        <span className="text-sm text-gray-500">Validité Permis: {selectedContract.client.permisValidite ? new Date(selectedContract.client.permisValidite).toLocaleDateString('fr-FR') : 'N/A'}</span>
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Véhicule</p>
                  {editMode && editedContract ? (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 mt-1"
                        onChange={(e) => handleEditVehicleChange(e.target.value)}
                        value={editedContract?.vehicle?._id || ''}
                      >
                        <option value="">Sélectionner un véhicule</option>
                        {vehicles
                          .filter(vehicle => vehicle.statut === 'En parc')
                          .map(vehicle => (
                            <option
                              key={vehicle._id}
                              value={vehicle._id}
                            >
                              {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                            </option>
                          ))
                        }
                      </select>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 mt-1"
                          value={editedContract?.vehicle?.model || ''}
                          readOnly
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 mt-1"
                          value={editedContract?.vehicle?.licensePlate || ''}
                          readOnly
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Km départ</label>
                        <input
                          type="number"
                          className="w-full border rounded-lg p-2 mt-1"
                          value={editedContract?.startingKm || ''}
                          onChange={(e) => handleInputChange('startingKm', Number(e.target.value))}
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Niveau carburant</label>
                        <select
                          className="w-full border rounded-lg p-2 mt-1"
                          value={editedContract?.fuelLevel}
                          onChange={(e) => handleInputChange('fuelLevel', e.target.value as FuelLevel)}
                        >
                          <option value="reserve" className="text-red-500">Réserve</option>
                          <option value="1/4" className="text-yellow-500">1/4</option>
                          <option value="1/2" className="text-blue-500">1/2</option>
                          <option value="3/4" className="text-green-300">3/4</option>
                          <option value="plein" className="text-green-500">Plein</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <p className="font-medium">
                      {selectedContract.vehicle?.model || 'N/A'} {selectedContract.vehicle?.licensePlate ? `(${selectedContract.vehicle.licensePlate})` : ''} <br />
                      <span className="text-sm text-gray-500">Km départ: {selectedContract.startingKm || 'N/A'}</span> <br />
                      <span className="text-sm text-gray-500">Niveau carburant: <span className={getFuelLevelColor(selectedContract.fuelLevel)}>
                        {selectedContract.fuelLevel === 'reserve' ? 'Réserve' :
                         selectedContract.fuelLevel === 'plein' ? 'Plein' :
                         selectedContract.fuelLevel || 'N/A'}
                      </span></span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Date de contrat</p>
                  {editMode && editedContract ? (
                    <DatePicker
                      selected={editedContract.contractDate ? new Date(editedContract.contractDate) : null}
                      onChange={(date: Date | null) => handleInputChange('contractDate', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{new Date(selectedContract.contractDate).toLocaleDateString('fr-FR') || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de départ</p>
                  {editMode && editedContract ? (
                    <DatePicker
                      selected={editedContract.departureDate ? new Date(editedContract.departureDate) : null}
                      onChange={(date: Date | null) => handleInputChange('departureDate', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{new Date(selectedContract.departureDate).toLocaleDateString('fr-FR') || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Heure de départ</p>
                  {editMode && editedContract ? (
                    <input
                      type="time"
                      name="departureTime"
                      value={editedContract.departureTime || ''}
                      onChange={(e) => handleInputChange('departureTime', e.target.value)}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.departureTime || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de retour</p>
                  {editMode && editedContract ? (
                    <DatePicker
                      selected={editedContract.returnDate ? new Date(editedContract.returnDate) : null}
                      onChange={(date: Date | null) => handleInputChange('returnDate', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{new Date(selectedContract.returnDate).toLocaleDateString('fr-FR') || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Durée</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="duration"
                      value={editedContract.duration || ''}
                      readOnly
                      className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.duration ? `${selectedContract.duration} jours` : '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lieu de contrat</p>
                  {editMode && editedContract ? (
                    <input
                      type="text"
                      name="contractLocation"
                      value={editedContract.contractLocation || ''}
                      onChange={(e) => handleInputChange('contractLocation', e.target.value)}
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.contractLocation ? 'border-red-500' : ''}`}
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.contractLocation || '-'}</p>
                  )}
                  {editMode && validationErrors.contractLocation && <p className="text-red-500 text-xs mt-1">{validationErrors.contractLocation}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lieu de livraison</p>
                  {editMode && editedContract ? (
                    <input
                      type="text"
                      name="pickupLocation"
                      value={editedContract.pickupLocation || ''}
                      onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.pickupLocation ? 'border-red-500' : ''}`}
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.pickupLocation || '-'}</p>
                  )}
                  {editMode && validationErrors.pickupLocation && <p className="text-red-500 text-xs mt-1">{validationErrors.pickupLocation}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lieu Récupération</p>
                  {editMode && editedContract ? (
                    <input
                      type="text"
                      name="returnLocation"
                      value={editedContract.returnLocation || ''}
                      onChange={(e) => handleInputChange('returnLocation', e.target.value)}
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.returnLocation ? 'border-red-500' : ''}`}
                    />
                  ) : (
                  <p className="font-medium">{selectedContract.returnLocation || 'N/A'}</p>
                  )}
                  {editMode && validationErrors.returnLocation && <p className="text-red-500 text-xs mt-1">{validationErrors.returnLocation}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prolongation</p>
                  {editMode && editedContract ? (
                    <>
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={!!editedContract.extension}
                          onChange={(e) => setEditedContract(prev => ({
                            ...prev!,
                            extension: e.target.checked ? { duration: 0, pricePerDay: 0 } : undefined
                          }))}
                        />
                        <label className="text-sm font-medium text-gray-700">Ajouter une prolongation</label>
                      </div>
                      {editedContract.extension && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Durée (jours)</label>
                            <input
                              type="number"
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['extension.duration'] ? 'border-red-500' : ''}`}
                              value={editedContract.extension.duration || ''}
                              onChange={(e) => handleInputChange('extension.duration', Number(e.target.value))}
                              min="1"
                            />
                            {validationErrors['extension.duration'] && <p className="text-red-500 text-xs mt-1">{validationErrors['extension.duration']}</p>}
                          </div>
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prix prolongation/jour</label>
                            <input
                              type="number"
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['extension.pricePerDay'] ? 'border-red-500' : ''}`}
                              value={editedContract.extension.pricePerDay || ''}
                              onChange={(e) => handleInputChange('extension.pricePerDay', Number(e.target.value))}
                              min="1"
                            />
                            {validationErrors['extension.pricePerDay'] && <p className="text-red-500 text-xs mt-1">{validationErrors['extension.pricePerDay']}</p>}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    selectedContract.extension ? (
                      <>
                        <p className="font-medium">{selectedContract.extension.duration || '-'} jours</p>
                        <p className="font-medium">{selectedContract.extension.pricePerDay || '-'} DH/jour</p>
                      </>
                    ) : (
                      <p className="font-medium text-gray-500">Aucune prolongation</p>
                    )
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Prix par jour</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="pricePerDay"
                      value={editedContract.pricePerDay || 0}
                      onChange={(e) => handleInputChange('pricePerDay', Number(e.target.value))}
                      className={`w-full border rounded-lg p-2 mt-1 ${validationErrors.pricePerDay ? 'border-red-500' : ''}`}
                      min="0"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.pricePerDay?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                  {editMode && validationErrors.pricePerDay && <p className="text-red-500 text-xs mt-1">{validationErrors.pricePerDay}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remise</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="discount"
                      value={editedContract.discount || 0}
                      onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                      className="w-full border rounded-lg p-2 mt-1"
                      min="0"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.discount?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="total"
                      value={editedContract.total || 0}
                      readOnly
                      className={`w-full border rounded-lg p-2 mt-1 bg-gray-100 ${editedContract.total < 0 ? 'border-red-500' : ''}`}
                      min="0"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.total?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                  {editMode && editedContract && editedContract.total < 0 && <p className="text-red-500 text-xs mt-1">Le total ne peut pas être négatif.</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Garantie</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="guarantee"
                      value={editedContract.guarantee || 0}
                      onChange={(e) => handleInputChange('guarantee', Number(e.target.value))}
                      className="w-full border rounded-lg p-2 mt-1"
                      min="0"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.guarantee?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type de paiement</p>
                  {editMode && editedContract ? (
                    <select
                      name="paymentType"
                      value={editedContract.paymentType || ''}
                      onChange={(e) => handleInputChange('paymentType', e.target.value as PaymentType)}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="espece">Espèce</option>
                      <option value="cheque">Chèque</option>
                      <option value="carte_bancaire">Carte Bancaire</option>
                      <option value="virement">Virement</option>
                    </select>
                  ) : (
                    <p className="font-medium">{selectedContract.paymentType || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avance</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="advance"
                      value={editedContract.advance || 0}
                      onChange={(e) => handleInputChange('advance', Number(e.target.value))}
                      className="w-full border rounded-lg p-2 mt-1"
                      min="0"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.advance?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reste à payer</p>
                  {editMode && editedContract ? (
                    <input
                      type="number"
                      name="remaining"
                      value={editedContract.remaining || 0}
                      readOnly
                      className={`w-full border rounded-lg p-2 mt-1 bg-gray-100 ${editedContract.remaining < 0 ? 'border-red-500' : ''}`}
                      min="0"
                    />
                  ) : (
                    <p className="font-medium">{selectedContract.remaining?.toLocaleString('fr-FR') || 'N/A'} DH</p>
                  )}
                  {editMode && editedContract && editedContract.remaining < 0 && <p className="text-red-500 text-xs mt-1">Le reste à payer ne peut pas être négatif.</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  {editMode && editedContract ? (
                    <select
                      name="status"
                      value={editedContract.status || ''}
                      onChange={(e) => handleInputChange('status', e.target.value as ContractStatus)}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="en_cours">En cours</option>
                      <option value="retournee">Retournée</option>
                    </select>
                  ) : (
                    <p className="font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedContract.status === 'en_cours'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      } ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status === 'en_cours' ? 'En cours' : 'Retournée'}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Deuxième Conducteur</p>
                  {editMode && editedContract ? (
                    <>
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={!!editedContract.secondDriver}
                          onChange={(e) => setEditedContract(prev => ({
                            ...prev!,
                            secondDriver: e.target.checked ? { nom: '', nationalite: '', dateNaissance: '', adresse: '', telephone: '', adresseEtranger: '', permisNumero: '', permisDelivreLe: '', passeportCin: '', passeportDelivreLe: '' } : undefined
                          }))}
                        />
                        <label className="text-sm font-medium text-gray-700">Ajouter un deuxième conducteur</label>
                      </div>
                      {editedContract.secondDriver && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="editSecondDriverNom" className="block text-sm font-medium text-gray-700">Nom</label>
                            <input
                              type="text"
                              id="editSecondDriverNom"
                              value={editedContract.secondDriver?.nom || ''}
                              onChange={(e) => handleInputChange('secondDriver.nom', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.nom'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.nom'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.nom']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverNationalite" className="block text-sm font-medium text-gray-700">Nationalité</label>
                            <input
                              type="text"
                              id="editSecondDriverNationalite"
                              value={editedContract.secondDriver?.nationalite || ''}
                              onChange={(e) => handleInputChange('secondDriver.nationalite', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.nationalite'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.nationalite'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.nationalite']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverDateNaissance" className="block text-sm font-medium text-gray-700">Né (e) le</label>
                            <DatePicker
                              selected={editedContract.secondDriver?.dateNaissance ? new Date(editedContract.secondDriver.dateNaissance) : null}
                              onChange={(date) => handleInputChange('secondDriver.dateNaissance', date ? date.toISOString().split('T')[0] : '')}
                              dateFormat="dd/MM/yyyy"
                              locale="fr"
                              showPopperArrow={false}
                              placeholderText="jj/mm/aaaa"
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.dateNaissance'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.dateNaissance'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.dateNaissance']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverAdresse" className="block text-sm font-medium text-gray-700">Adresse</label>
                            <input
                              type="text"
                              id="editSecondDriverAdresse"
                              value={editedContract.secondDriver?.adresse || ''}
                              onChange={(e) => handleInputChange('secondDriver.adresse', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.adresse'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.adresse'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.adresse']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverTelephone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                            <input
                              type="text"
                              id="editSecondDriverTelephone"
                              value={editedContract.secondDriver?.telephone || ''}
                              onChange={(e) => handleInputChange('secondDriver.telephone', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.telephone'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.telephone'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.telephone']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverAdresseEtranger" className="block text-sm font-medium text-gray-700">Adresse à l'étranger</label>
                            <input
                              type="text"
                              id="editSecondDriverAdresseEtranger"
                              value={editedContract.secondDriver?.adresseEtranger || ''}
                              onChange={(e) => handleInputChange('secondDriver.adresseEtranger', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.adresseEtranger'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.adresseEtranger'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.adresseEtranger']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverPermisNumero" className="block text-sm font-medium text-gray-700">Permis de conduite N°</label>
                            <input
                              type="text"
                              id="editSecondDriverPermisNumero"
                              value={editedContract.secondDriver?.permisNumero || ''}
                              onChange={(e) => handleInputChange('secondDriver.permisNumero', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.permisNumero'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.permisNumero'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.permisNumero']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverPermisDelivreLe" className="block text-sm font-medium text-gray-700">Délivré le</label>
                            <DatePicker
                              selected={editedContract.secondDriver?.permisDelivreLe ? new Date(editedContract.secondDriver.permisDelivreLe) : null}
                              onChange={(date) => handleInputChange('secondDriver.permisDelivreLe', date ? date.toISOString().split('T')[0] : '')}
                              dateFormat="dd/MM/yyyy"
                              locale="fr"
                              showPopperArrow={false}
                              placeholderText="jj/mm/aaaa"
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.permisDelivreLe'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.permisDelivreLe'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.permisDelivreLe']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverPasseportCin" className="block text-sm font-medium text-gray-700">Passeport N° ou CIN</label>
                            <input
                              type="text"
                              id="editSecondDriverPasseportCin"
                              value={editedContract.secondDriver?.passeportCin || ''}
                              onChange={(e) => handleInputChange('secondDriver.passeportCin', e.target.value)}
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.passeportCin'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.passeportCin'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.passeportCin']}</p>}
                          </div>
                          <div>
                            <label htmlFor="editSecondDriverPasseportDelivreLe" className="block text-sm font-medium text-gray-700">Délivré le</label>
                            <DatePicker
                              selected={editedContract.secondDriver?.passeportDelivreLe ? new Date(editedContract.secondDriver.passeportDelivreLe) : null}
                              onChange={(date) => handleInputChange('secondDriver.passeportDelivreLe', date ? date.toISOString().split('T')[0] : '')}
                              dateFormat="dd/MM/yyyy"
                              locale="fr"
                              showPopperArrow={false}
                              placeholderText="jj/mm/aaaa"
                              className={`w-full border rounded-lg p-2 mt-1 ${validationErrors['secondDriver.passeportDelivreLe'] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {validationErrors['secondDriver.passeportDelivreLe'] && <p className="text-red-500 text-xs mt-1">{validationErrors['secondDriver.passeportDelivreLe']}</p>}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    selectedContract.secondDriver ? (
                      <div className="font-medium">
                        <p><strong>Nom:</strong> {selectedContract.secondDriver.nom || 'N/A'}</p>
                        <p><strong>Nationalité:</strong> {selectedContract.secondDriver.nationalite || 'N/A'}</p>
                        <p><strong>Né (e) le:</strong> {selectedContract.secondDriver.dateNaissance ? new Date(selectedContract.secondDriver.dateNaissance).toLocaleDateString('fr-FR') : 'N/A'}</p>
                        <p><strong>Adresse:</strong> {selectedContract.secondDriver.adresse || 'N/A'}</p>
                        <p><strong>Téléphone:</strong> {selectedContract.secondDriver.telephone || 'N/A'}</p>
                        <p><strong>Adresse à l'étranger:</strong> {selectedContract.secondDriver.adresseEtranger || 'N/A'}</p>
                        <p><strong>Permis de conduite N°:</strong> {selectedContract.secondDriver.permisNumero || 'N/A'}</p>
                        <p><strong>Délivré le:</strong> {selectedContract.secondDriver.permisDelivreLe ? new Date(selectedContract.secondDriver.permisDelivreLe).toLocaleDateString('fr-FR') : 'N/A'}</p>
                        <p><strong>Passeport N° ou CIN:</strong> {selectedContract.secondDriver.passeportCin || 'N/A'}</p>
                        <p><strong>Délivré le:</strong> {selectedContract.secondDriver.passeportDelivreLe ? new Date(selectedContract.secondDriver.passeportDelivreLe).toLocaleDateString('fr-FR') : 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-500">Aucun deuxième conducteur</p>
                    )
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Équipements</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {editMode && editedContract ? (
                      EQUIPMENT_ITEMS.map(item => (
                        <div key={item.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedContract.equipment?.[item.id as keyof Equipment] || false}
                            onChange={(e) => handleInputChange(`equipment.${item.id as keyof Equipment}`, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">
                            {item.label}
                          </span>
                        </div>
                      ))
                    ) : (
                      EQUIPMENT_ITEMS.map(item => (
                        <div key={item.id} className="flex items-center">
                          <CheckCircle
                            size={16}
                            className={selectedContract.equipment?.[item.id as keyof Equipment] ? 'text-green-500' : 'text-gray-300'}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {item.label}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pièces Jointes */}
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-2">Pièces Jointes:</h4>
                  {editMode && editedContract ? (
                    <FileUploader
                      api_url={API_URL}
                      existingDocuments={editedContract.piecesJointes || []}
                      newFiles={editedContractFiles}
                      onNewFilesChange={setEditedContractFiles}
                      onRemoveExistingDocument={handleRemoveExistingDocument}
                    />
                  ) : (
                    selectedContract.piecesJointes && selectedContract.piecesJointes.length > 0 ? (
                      <FileUploader
                        api_url={API_URL}
                        existingDocuments={selectedContract.piecesJointes}
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

                {!editMode && (
                  <div className="pt-4 border-t">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => selectedContract && handlePrint(selectedContract)}
                        disabled={!selectedContract}
                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Imprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <AlertTriangle size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Aucun contrat sélectionné
              </h3>
              <p className="text-gray-500 mb-4">
                Sélectionnez un contrat pour voir ses détails
              </p>
              <button
                onClick={() => {
                  setShowNewContractModal(true);
                  setValidationErrors({}); // Clear validation errors when opening modal
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
              >
                <Plus size={16} className="mr-2" />
                Nouveau Contrat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Contract Modal */}
      {showNewContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <CloseButton onClick={() => setShowNewContractModal(false)} />
            <h2 className="text-xl font-bold mb-4">Nouveau Contrat</h2>
            <form className="space-y-6" onSubmit={handleAddContract}>
              {/* Client Information */}
              <section className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Information Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col col-span-3 mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1">Sélectionner un client</label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={selectedClientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner un client</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.prenomFr || ''} {customer.nomFr || ''} - {customer.numeroPermis}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      placeholder="Prénom"
                      className="w-full border rounded-lg p-2"
                      value={newContract.client?.prenomFr || ''}
                      onChange={(e) => handleNewContractChange('client.prenomFr', e.target.value)}
                      required
                      readOnly={!!selectedClientId}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      placeholder="Nom"
                      className="w-full border rounded-lg p-2"
                      value={newContract.client?.nomFr || ''}
                      onChange={(e) => handleNewContractChange('client.nomFr', e.target.value)}
                      required
                      readOnly={!!selectedClientId}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">N° Permis</label>
                    <input
                      type="text"
                      placeholder="N° Permis"
                      className="w-full border rounded-lg p-2"
                      value={newContract.client?.numeroPermis || ''}
                      onChange={(e) => handleNewContractChange('client.numeroPermis', e.target.value)}
                      required
                      readOnly={!!selectedClientId}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Validité Permis</label>
                    <DatePicker
                      selected={newContract.client?.permisValidite ? new Date(newContract.client.permisValidite) : null}
                      onChange={(date: Date | null) => handleNewContractChange('client.permisValidite', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      showPopperArrow={false}
                      placeholderText="jj/mm/aaaa"
                      className="w-full border rounded-lg p-2"
                      required
                      readOnly={!!selectedClientId}
                    />
                  </div>
                </div>
              </section>

              {/* Contract Information */}
              <section className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Information Contrat</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* N° de Contrat field is now auto-generated and hidden from the form */}
                  {/* <div>
                    <label className="text-sm font-medium text-gray-700 mb-1">N° de Contrat</label>
                    <input
                      type="text"
                      name="contractNumber"
                      placeholder="N° de Contrat"
                      className="border rounded-lg p-2 bg-gray-100"
                      value={newContract.contractNumber || ''}
                      readOnly
                    />
                  </div> */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Date de Contrat</label>
                    <DatePicker
                      selected={newContract.contractDate ? new Date(newContract.contractDate) : null}
                      onChange={(date: Date | null) => handleNewContractChange('contractDate', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      showPopperArrow={false}
                      placeholderText="jj/mm/aaaa"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Date de Sortie</label>
                    <DatePicker
                      selected={newContract.departureDate ? new Date(newContract.departureDate) : null}
                      onChange={(date: Date | null) => handleNewContractChange('departureDate', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      showPopperArrow={false}
                      placeholderText="jj/mm/aaaa"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Heure de départ</label>
                    <input
                      type="time"
                      name="departureTime"
                      placeholder="HH:MM"
                      className="w-full border rounded-lg p-2"
                      value={newContract.departureTime || ''}
                      onChange={(e) => handleNewContractChange('departureTime', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Date de Retour</label>
                    <DatePicker
                      selected={newContract.returnDate ? new Date(newContract.returnDate) : null}
                      onChange={(date: Date | null) => handleNewContractChange('returnDate', date ? date.toISOString().split('T')[0] : '')}
                      dateFormat="dd/MM/yyyy"
                      locale="fr"
                      showPopperArrow={false}
                      placeholderText="jj/mm/aaaa"
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Lieu de Contrat</label>
                    <input
                      type="text"
                      name="contractLocation"
                      placeholder="Lieu de Contrat"
                      className={`w-full border rounded-lg p-2 ${validationErrors.contractLocation ? 'border-red-500' : ''}`}
                      value={newContract.contractLocation || ''}
                      onChange={(e) => handleNewContractChange('contractLocation', e.target.value)}
                      required
                    />
                    {validationErrors.contractLocation && <p className="text-red-500 text-xs mt-1">{validationErrors.contractLocation}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Durée (jours)</label>
                    <input
                      type="number"
                      name="duration"
                      placeholder="Durée (jours)"
                      className="w-full border rounded-lg p-2 bg-gray-100"
                      value={newContract.duration}
                      readOnly
                      required
                      min="1"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Lieu Livraison</label>
                    <input
                      type="text"
                      name="pickupLocation"
                      placeholder="Lieu Livraison"
                      className={`w-full border rounded-lg p-2 ${validationErrors.pickupLocation ? 'border-red-500' : ''}`}
                      value={newContract.pickupLocation || ''}
                      onChange={(e) => handleNewContractChange('pickupLocation', e.target.value)}
                      required
                    />
                    {validationErrors.pickupLocation && <p className="text-red-500 text-xs mt-1">{validationErrors.pickupLocation}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Lieu Récupération</label>
                    <input
                      type="text"
                      name="returnLocation" // Assuming this is the field name for "Lieu Récupération"
                      placeholder="Lieu Récupération"
                      className={`w-full border rounded-lg p-2 ${validationErrors.returnLocation ? 'border-red-500' : ''}`}
                      value={newContract.returnLocation || ''}
                      onChange={(e) => handleNewContractChange('returnLocation', e.target.value)}
                    />
                    {validationErrors.returnLocation && <p className="text-red-500 text-xs mt-1">{validationErrors.returnLocation}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={selectedVehicleId}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner Véhicule</option>
                      {vehicles
                        .filter(vehicle => vehicle.statut === 'En parc') // Only show vehicles that are in the fleet
                        .map(vehicle => (
                          <option
                            key={vehicle._id}
                            value={vehicle._id}
                          >
                            {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Prix par Jour</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      placeholder="Prix par Jour"
                      className="w-full border rounded-lg p-2"
                      value={newContract.pricePerDay || ''}
                      onChange={(e) => handleNewContractChange('pricePerDay', Number(e.target.value))}
                      required
                      readOnly={!!selectedVehicleId}
                      min="0"
                    />
                    {validationErrors.pricePerDay && <p className="text-red-500 text-xs mt-1">{validationErrors.pricePerDay}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Km Départ</label>
                    <input
                      type="number"
                      name="startingKm"
                      placeholder="Km Départ"
                      value={newContract.startingKm || ''}
                      onChange={(e) => handleNewContractChange('startingKm', Number(e.target.value))}
                      required
                      readOnly={!!selectedVehicleId}
                      className="w-full border rounded-lg p-2"
                      min="0"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Remise (DH)</label>
                    <input
                      type="number"
                      name="discount"
                      placeholder="Remise (DH)"
                      className="w-full border rounded-lg p-2"
                      value={newContract.discount || ''}
                      onChange={(e) => handleNewContractChange('discount', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Carburant Départ</label>
                    <select
                      name="fuelLevel"
                      className="w-full border rounded-lg p-2"
                      value={newContract.fuelLevel}
                      onChange={(e) => handleNewContractChange('fuelLevel', e.target.value as FuelLevel)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="reserve" className="text-red-500">Réserve</option>
                      <option value="1/4" className="text-yellow-500">1/4</option>
                      <option value="1/2" className="text-blue-500">1/2</option>
                      <option value="3/4" className="text-green-300">3/4</option>
                      <option value="plein" className="text-green-500">Plein</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Total</label>
                    <input
                      type="number"
                      name="total"
                      placeholder="Total"
                      className="w-full border rounded-lg p-2"
                      value={newContract.total || ''}
                      readOnly
                      min="0"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Garantie</label>
                    <input
                      type="number"
                      name="guarantee"
                      placeholder="Garantie"
                      className="w-full border rounded-lg p-2"
                      value={newContract.guarantee || ''}
                      onChange={(e) => handleNewContractChange('guarantee', Number(e.target.value))}
                      min="0"
                    />
                    {validationErrors.guarantee && <p className="text-red-500 text-xs mt-1">{validationErrors.guarantee}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Type Paiement</label>
                    <select
                      name="paymentType"
                      className="w-full border rounded-lg p-2"
                      value={newContract.paymentType}
                      onChange={(e) => handleNewContractChange('paymentType', e.target.value as PaymentType)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="espece">Espèce</option>
                      <option value="cheque">Chèque</option>
                      <option value="carte_bancaire">Carte Bancaire</option>
                      <option value="virement">Virement</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Avance</label>
                    <input
                      type="number"
                      name="advance"
                      placeholder="Avance"
                      className="w-full border rounded-lg p-2"
                      value={newContract.advance || ''}
                      onChange={(e) => handleNewContractChange('advance', Number(e.target.value))}
                      min="0"
                    />
                    {validationErrors.advance && <p className="text-red-500 text-xs mt-1">{validationErrors.advance}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Reste</label>
                    <input
                      type="number"
                      name="remaining"
                      placeholder="Reste"
                      className="w-full border rounded-lg p-2"
                      value={newContract.remaining || ''}
                      readOnly
                      min="0"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      name="status"
                      value={newContract.status || ''}
                      onChange={(e) => handleNewContractChange('status', e.target.value as ContractStatus)}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="en_cours">En cours</option>
                      <option value="retournee">Retournée</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Second Driver */}
              <section className="border-b pb-4">
                <div className="flex items-center mb-3">
                  <h3 className="text-lg font-medium">Deuxième Conducteur</h3>
                  <input
                    type="checkbox"
                    className="ml-2"
                    checked={!!newContract.secondDriver}
                    onChange={(e) => setNewContract(prev => ({
                      ...prev,
                      secondDriver: e.target.checked ? { nom: '', nationalite: '', dateNaissance: '', adresse: '', telephone: '', adresseEtranger: '', permisNumero: '', permisDelivreLe: '', passeportCin: '', passeportDelivreLe: '' } : undefined
                    }))}
                  />
                </div>
                {newContract.secondDriver && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="secondDriverNom" className="block text-sm font-medium text-gray-700">Nom</label>
                      <input
                        type="text"
                        id="secondDriverNom"
                        value={newContract.secondDriver?.nom || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.nom', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverNationalite" className="block text-sm font-medium text-gray-700">Nationalité</label>
                      <input
                        type="text"
                        id="secondDriverNationalite"
                        value={newContract.secondDriver?.nationalite || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.nationalite', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverDateNaissance" className="block text-sm font-medium text-gray-700">Né (e) le</label>
                      <DatePicker
                        selected={newContract.secondDriver?.dateNaissance ? new Date(newContract.secondDriver.dateNaissance) : null}
                        onChange={(date) => handleNewContractChange('secondDriver.dateNaissance', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd"
                        className="w-full border rounded-lg p-2"
                        locale="fr"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverAdresse" className="block text-sm font-medium text-gray-700">Adresse</label>
                      <input
                        type="text"
                        id="secondDriverAdresse"
                        value={newContract.secondDriver?.adresse || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.adresse', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverTelephone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                      <input
                        type="text"
                        id="secondDriverTelephone"
                        value={newContract.secondDriver?.telephone || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.telephone', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverAdresseEtranger" className="block text-sm font-medium text-gray-700">Adresse à l'étranger</label>
                      <input
                        type="text"
                        id="secondDriverAdresseEtranger"
                        value={newContract.secondDriver?.adresseEtranger || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.adresseEtranger', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverPermisNumero" className="block text-sm font-medium text-gray-700">Permis de conduite N°</label>
                      <input
                        type="text"
                        id="secondDriverPermisNumero"
                        value={newContract.secondDriver?.permisNumero || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.permisNumero', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverPermisDelivreLe" className="block text-sm font-medium text-gray-700">Délivré le</label>
                      <DatePicker
                        selected={newContract.secondDriver?.permisDelivreLe ? new Date(newContract.secondDriver.permisDelivreLe) : null}
                        onChange={(date) => handleNewContractChange('secondDriver.permisDelivreLe', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd"
                        className="w-full border rounded-lg p-2"
                        locale="fr"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverPasseportCin" className="block text-sm font-medium text-gray-700">Passeport N° ou CIN</label>
                      <input
                        type="text"
                        id="secondDriverPasseportCin"
                        value={newContract.secondDriver?.passeportCin || ''}
                        onChange={(e) => handleNewContractChange('secondDriver.passeportCin', e.target.value)}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="secondDriverPasseportDelivreLe" className="block text-sm font-medium text-gray-700">Délivré le</label>
                      <DatePicker
                        selected={newContract.secondDriver?.passeportDelivreLe ? new Date(newContract.secondDriver.passeportDelivreLe) : null}
                        onChange={(date) => handleNewContractChange('secondDriver.passeportDelivreLe', date ? date.toISOString().split('T')[0] : '')}
                        dateFormat="yyyy-MM-dd"
                        className="w-full border rounded-lg p-2"
                        locale="fr"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Equipment */}
              <section className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Équipements/Accessoires</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {EQUIPMENT_ITEMS.map(item => (
                    <label key={item.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name={item.id}
                        className="mr-2"
                        checked={newContract.equipment?.[item.id as keyof Equipment] || false}
                        onChange={(e) => handleNewContractChange(`equipment.${item.id as keyof Equipment}`, e.target.checked)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </section>

              {/* Extension */}
              <section>
                <div className="flex items-center mb-3">
                  <h3 className="text-lg font-medium">Prolongation</h3>
                  <input
                    type="checkbox"
                    className="ml-2"
                    checked={!!newContract.extension}
                    onChange={(e) => setNewContract(prev => ({
                      ...prev,
                      extension: e.target.checked ? { duration: 0, pricePerDay: 0 } : undefined
                    }))}
                  />
                </div>
                {newContract.extension && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée (jours)</label>
                      <input
                        type="number"
                        placeholder="Durée (jours)"
                        className={`w-full border rounded-lg p-2 ${validationErrors['extension.duration'] ? 'border-red-500' : ''}`}
                        value={newContract.extension.duration || ''}
                        onChange={(e) => handleNewContractChange('extension.duration', Number(e.target.value))}
                        min="1"
                      />
                      {validationErrors['extension.duration'] && <p className="text-red-500 text-xs mt-1">{validationErrors['extension.duration']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix par Jour</label>
                      <input
                        type="number"
                        placeholder="Prix par Jour"
                        className={`w-full border rounded-lg p-2 ${validationErrors['extension.pricePerDay'] ? 'border-red-500' : ''}`}
                        value={newContract.extension.pricePerDay || ''}
                        onChange={(e) => handleNewContractChange('extension.pricePerDay', Number(e.target.value))}
                        min="1"
                      />
                      {validationErrors['extension.pricePerDay'] && <p className="text-red-500 text-xs mt-1">{validationErrors['extension.pricePerDay']}</p>}
                    </div>
                  </div>
                )}
              </section>

              {/* Pièces Jointes */}
              <section className="border-b pb-4 mb-4">
                <h3 className="text-lg font-medium mb-4">Pièces Jointes</h3>
                <FileUploader
                  api_url={API_URL}
                  existingDocuments={[]} // New contracts don't have existing documents initially
                  newFiles={newContractFiles}
                  onNewFilesChange={setNewContractFiles}
                  onRemoveExistingDocument={() => Promise.resolve()} // No existing documents to remove for new contract
                />
              </section>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewContractModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  disabled={!selectedClientId || !selectedVehicleId}
                >
                  Créer Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contrats;
