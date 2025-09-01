import { useState, useEffect } from 'react';
import CloseButton from './CloseButton';
import countries from '../data/countries.json';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import FileUploader, { Document } from './FileUploader';

registerLocale('fr', fr);

const isOnlySpaces = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length === 0;
};

interface Country {
  code: string;
  name: string;
}

export interface CustomerFormData {
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
  ice?: string;
}

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData, newFiles: File[], documentsToDelete: Document[]) => void;
  onClose: () => void;
  initialData?: Partial<CustomerFormData>;
  readOnly?: boolean;
  existingDocuments?: Document[];
  onRemoveExistingDocument?: (doc: Document) => Promise<void>;
  api_url: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  onSubmit, 
  onClose, 
  initialData, 
  readOnly = false,
  existingDocuments = [],
  onRemoveExistingDocument,
  api_url
}) => {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [documentsToDelete, setDocumentsToDelete] = useState<Document[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  const [formData, setFormData] = useState<CustomerFormData>({
    // Conducteur
    civilite: initialData?.civilite || '',
    nationalite: initialData?.nationalite || '',
    type: initialData?.type || 'Particulier',
    listeNoire: initialData?.listeNoire || false,
    nomFr: initialData?.nomFr || '',
    nomAr: initialData?.nomAr || '',
    prenomFr: initialData?.prenomFr || '',
    prenomAr: initialData?.prenomAr || '',
    dateNaissance: initialData?.dateNaissance || '',
    age: initialData?.age || '',
    lieuNaissance: initialData?.lieuNaissance || '',
  ice: initialData?.ice || '',
    
    // Pièce d'identité
    cin: initialData?.cin || '',
    cinDelivreLe: initialData?.cinDelivreLe || '',
    cinDelivreA: initialData?.cinDelivreA || '',
    cinValidite: initialData?.cinValidite || '',
    
    // Permis
    numeroPermis: initialData?.numeroPermis || '',
    permisDelivreLe: initialData?.permisDelivreLe || '',
    permisDelivreA: initialData?.permisDelivreA || '',
    permisValidite: initialData?.permisValidite || '',
    
    // Passeport
    numeroPasseport: initialData?.numeroPasseport || '',
    passportDelivreLe: initialData?.passportDelivreLe || '',
    passportDelivreA: initialData?.passportDelivreA || '',
    passportValidite: initialData?.passportValidite || '',
    
    // Contact
    adresseFr: initialData?.adresseFr || '',
    ville: initialData?.ville || '',
    adresseAr: initialData?.adresseAr || '',
    codePostal: initialData?.codePostal || '',
    telephone: initialData?.telephone || '',
    telephone2: initialData?.telephone2 || '',
    fix: initialData?.fix || '',
    fax: initialData?.fax || '',
    remarque: initialData?.remarque || '',
    email: initialData?.email || '',
  });

  // Calculate age automatically when date of birth changes
  useEffect(() => {
    if (formData.dateNaissance) {
      const birthDate = new Date(formData.dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age.toString() }));

      if (age < 18) {
        setValidationErrors(prev => ({ ...prev, dateNaissance: 'Le client doit avoir au moins 18 ans.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.dateNaissance;
          return newErrors;
        });
      }
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.dateNaissance;
        return newErrors;
      });
    }
  }, [formData.dateNaissance]);

  const handleNewFilesChange = (files: File[]) => {
    setNewFiles(files);
  };

  const handleRemoveExistingDocument = async (doc: Document) => {
    if (onRemoveExistingDocument) {
      setDocumentsToDelete(prev => [...prev, doc]);
      // Optionally, you might want to remove it from the UI immediately
      // or wait for the parent component to re-render with updated existingDocuments
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    let errors: ValidationErrors = {};
    // Copy existing validation errors from state, especially for age validation
    errors = { ...validationErrors };

    const textFieldsToValidate: (keyof CustomerFormData)[] = [
      'nomFr', 'nomAr', 'prenomFr', 'prenomAr', 'lieuNaissance', 'cin', 'cinDelivreA',
      'numeroPermis', 'permisDelivreA', 'numeroPasseport', 'passportDelivreA',
      'adresseFr', 'ville', 'adresseAr', 'codePostal', 'telephone', 'telephone2',
      'fix', 'fax', 'remarque', 'email'
    ];

    const requiredFields: (keyof CustomerFormData)[] = [
      'civilite', 'nationalite', 'type', 'nomFr', 'prenomFr', 'dateNaissance',
      'lieuNaissance', 'cin', 'cinDelivreLe', 'cinDelivreA', 'cinValidite',
      'numeroPermis', 'permisDelivreLe', 'permisDelivreA', 'permisValidite'
    ];

    // Add permisDelivreLe specific validation for handleSubmit
    if (formData.permisDelivreLe) {
      const issuedDate = new Date(formData.permisDelivreLe);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      if (issuedDate > twoYearsAgo) {
        errors.permisDelivreLe = 'La date de délivrance du permis doit être supérieure à 2 ans.';
      }
    }

    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && isOnlySpaces(formData[field] as string))) {
        errors[field] = 'Ce champ est obligatoire et ne peut pas contenir uniquement des espaces.';
      }
    });

    textFieldsToValidate.forEach(field => {
      if (formData[field] && isOnlySpaces(formData[field] as string)) {
        errors[field] = 'Ce champ ne peut pas contenir uniquement des espaces.';
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert('Veuillez corriger les erreurs de validation.');
      return;
    }

    onSubmit(formData, newFiles, documentsToDelete);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    if (type === 'text' || type === 'textarea' || type === 'email' || type === 'tel') {
      if (value.length > 0 && isOnlySpaces(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: 'Ce champ ne peut pas contenir uniquement des espaces.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Specific validation for permisDelivreLe
    if (name === 'permisDelivreLe' && value) {
      const issuedDate = new Date(value);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      if (issuedDate > twoYearsAgo) {
        setValidationErrors(prev => ({ ...prev, permisDelivreLe: 'La date de délivrance du permis doit être supérieure à 2 ans.' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.permisDelivreLe;
          return newErrors;
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <CloseButton onClick={onClose} />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{initialData ? 'Modifier le client' : 'Ajouter un client'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Conducteur */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Conducteur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Civilité (*)</label>
                <select 
                  name="civilite" 
                  value={formData.civilite} 
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                >
                  <option value="">Sélectionner</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="Mlle">Mlle</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Nationalité (*)</label>
                <select 
                  name="nationalite" 
                  value={formData.nationalite} 
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                >
                  <option value="">Sélectionner</option>
                  {(countries as Country[]).map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Type (*)</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                >
                  <option value="">Sélectionner</option>
                  <option value="Particulier">Particulier</option>
                  <option value="Professionel">Professionel</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="listeNoire"
                  checked={formData.listeNoire}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'listeNoire',
                      type: 'checkbox',
                      checked: e.target.checked,
                      value: e.target.checked.toString()
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="mr-2"
                  disabled={readOnly}
                />
                <label>Liste noire</label>
              </div>


              <div>
                <label className="block mb-1">Nom français (*)</label>
                <input
                  type="text"
                  name="nomFr"
                  value={formData.nomFr}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.nomFr ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.nomFr && <p className="text-red-500 text-xs mt-1">{validationErrors.nomFr}</p>}
              </div>

              <div>
                <label className="block mb-1">Nom arabe</label>
                <input
                  type="text"
                  name="nomAr"
                  value={formData.nomAr}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.nomAr ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  dir="rtl"
                  readOnly={readOnly}
                />
                {validationErrors.nomAr && <p className="text-red-500 text-xs mt-1">{validationErrors.nomAr}</p>}
              </div>

              <div>
                <label className="block mb-1">Prénom français (*)</label>
                <input
                  type="text"
                  name="prenomFr"
                  value={formData.prenomFr}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.prenomFr ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.prenomFr && <p className="text-red-500 text-xs mt-1">{validationErrors.prenomFr}</p>}
              </div>

              <div>
                <label className="block mb-1">Prénom arabe</label>
                <input
                  type="text"
                  name="prenomAr"
                  value={formData.prenomAr}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.prenomAr ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  dir="rtl"
                  readOnly={readOnly}
                />
                {validationErrors.prenomAr && <p className="text-red-500 text-xs mt-1">{validationErrors.prenomAr}</p>}
              </div>

              <div>
                <label className="block mb-1">Date naissance (*)</label>
                <DatePicker
                  selected={formData.dateNaissance ? new Date(formData.dateNaissance) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'dateNaissance',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text' // DatePicker returns a Date object, convert to string
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className={`w-full border rounded p-2 ${validationErrors.dateNaissance ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  disabled={readOnly}
                />
                {validationErrors.dateNaissance && <p className="text-red-500 text-xs mt-1">{validationErrors.dateNaissance}</p>}
              </div>

              <div>
                <label className="block mb-1">Age</label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  className="w-full border rounded p-2"
                  readOnly
                />
              </div>

              <div>
                <label className="block mb-1">Lieu de naissance (*)</label>
                <input
                  type="text"
                  name="lieuNaissance"
                  value={formData.lieuNaissance}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.lieuNaissance ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.lieuNaissance && <p className="text-red-500 text-xs mt-1">{validationErrors.lieuNaissance}</p>}
              </div>

              <div>
                <label className="block mb-1">ICE</label>
                <input
                  type="text"
                  name="ice"
                  value={formData.ice}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.ice ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.ice && <p className="text-red-500 text-xs mt-1">{validationErrors.ice}</p>}
              </div>
            </div>
          </div>

          {/* Section Pièce d'identité */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Pièce d'identité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">C.I.N (*)</label>
                <input
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.cin ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.cin && <p className="text-red-500 text-xs mt-1">{validationErrors.cin}</p>}
              </div>

              <div>
                <label className="block mb-1">Délivré le (*)</label>
                <DatePicker
                  selected={formData.cinDelivreLe ? new Date(formData.cinDelivreLe) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'cinDelivreLe',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block mb-1">Délivrée à (*)</label>
                <input
                  type="text"
                  name="cinDelivreA"
                  value={formData.cinDelivreA}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.cinDelivreA ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.cinDelivreA && <p className="text-red-500 text-xs mt-1">{validationErrors.cinDelivreA}</p>}
              </div>

              <div>
                <label className="block mb-1">Validité (*)</label>
                <DatePicker
                  selected={formData.cinValidite ? new Date(formData.cinValidite) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'cinValidite',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Numéro permis (*)</label>
                <input
                  type="text"
                  name="numeroPermis"
                  value={formData.numeroPermis}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.numeroPermis ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.numeroPermis && <p className="text-red-500 text-xs mt-1">{validationErrors.numeroPermis}</p>}
              </div>

              <div>
                <label className="block mb-1">Délivré le (*)</label>
                <DatePicker
                  selected={formData.permisDelivreLe ? new Date(formData.permisDelivreLe) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'permisDelivreLe',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                />
                {validationErrors.permisDelivreLe && <p className="text-red-500 text-xs mt-1">{validationErrors.permisDelivreLe}</p>}
              </div>

              <div>
                <label className="block mb-1">Délivrée à (*)</label>
                <input
                  type="text"
                  name="permisDelivreA"
                  value={formData.permisDelivreA}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.permisDelivreA ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  required
                  readOnly={readOnly}
                />
                {validationErrors.permisDelivreA && <p className="text-red-500 text-xs mt-1">{validationErrors.permisDelivreA}</p>}
              </div>

              <div>
                <label className="block mb-1">Validité (*)</label>
                <DatePicker
                  selected={formData.permisValidite ? new Date(formData.permisValidite) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'permisValidite',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded p-2"
                  required
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Numéro passeport</label>
                <input
                  type="text"
                  name="numeroPasseport"
                  value={formData.numeroPasseport}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.numeroPasseport ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.numeroPasseport && <p className="text-red-500 text-xs mt-1">{validationErrors.numeroPasseport}</p>}
              </div>

              <div>
                <label className="block mb-1">Délivré le</label>
                <DatePicker
                  selected={formData.passportDelivreLe ? new Date(formData.passportDelivreLe) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'passportDelivreLe',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded p-2"
                  disabled={readOnly}
                />
              </div>

              <div>
                <label className="block mb-1">Délivrée à</label>
                <input
                  type="text"
                  name="passportDelivreA"
                  value={formData.passportDelivreA}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.passportDelivreA ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.passportDelivreA && <p className="text-red-500 text-xs mt-1">{validationErrors.passportDelivreA}</p>}
              </div>

              <div>
                <label className="block mb-1">Validité</label>
                <DatePicker
                  selected={formData.passportValidite ? new Date(formData.passportValidite) : null}
                  onChange={(date: Date | null) => handleChange({
                    target: {
                      name: 'passportValidite',
                      value: date ? date.toISOString().split('T')[0] : '',
                      type: 'text'
                    }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  dateFormat="dd/MM/yyyy"
                  locale="fr"
                  showPopperArrow={false}
                  placeholderText="jj/mm/aaaa"
                  className="w-full border rounded p-2"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          {/* Section Contact */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
              </div>
              <div>
                <label className="block mb-1">Adresse</label>
                <input
                  type="text"
                  name="adresseFr"
                  value={formData.adresseFr}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.adresseFr ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.adresseFr && <p className="text-red-500 text-xs mt-1">{validationErrors.adresseFr}</p>}
              </div>

              <div>
                <label className="block mb-1">Ville</label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.ville ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.ville && <p className="text-red-500 text-xs mt-1">{validationErrors.ville}</p>}
              </div>

              <div>
                <label className="block mb-1">Adresse au l'étranger</label>
                <input
                  type="text"
                  name="adresseAr"
                  value={formData.adresseAr}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.adresseAr ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.adresseAr && <p className="text-red-500 text-xs mt-1">{validationErrors.adresseAr}</p>}
              </div>

              <div>
                <label className="block mb-1">Code postal</label>
                <input
                  type="text"
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.codePostal ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.codePostal && <p className="text-red-500 text-xs mt-1">{validationErrors.codePostal}</p>}
              </div>

              <div>
                <label className="block mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.telephone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.telephone && <p className="text-red-500 text-xs mt-1">{validationErrors.telephone}</p>}
              </div>

              <div>
                <label className="block mb-1">Téléphone 2</label>
                <input
                  type="tel"
                  name="telephone2"
                  value={formData.telephone2}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.telephone2 ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.telephone2 && <p className="text-red-500 text-xs mt-1">{validationErrors.telephone2}</p>}
              </div>

              <div>
                <label className="block mb-1">Fix</label>
                <input
                  type="tel"
                  name="fix"
                  value={formData.fix}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.fix ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.fix && <p className="text-red-500 text-xs mt-1">{validationErrors.fix}</p>}
              </div>

              <div>
                <label className="block mb-1">Fax</label>
                <input
                  type="tel"
                  name="fax"
                  value={formData.fax}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 ${validationErrors.fax ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.fax && <p className="text-red-500 text-xs mt-1">{validationErrors.fax}</p>}
              </div>

              <div className="col-span-2">
                <label className="block mb-1">Remarque</label>
                <textarea
                  name="remarque"
                  value={formData.remarque}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 h-24 ${validationErrors.remarque ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  readOnly={readOnly}
                />
                {validationErrors.remarque && <p className="text-red-500 text-xs mt-1">{validationErrors.remarque}</p>}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <FileUploader
            api_url={api_url}
            existingDocuments={existingDocuments}
            newFiles={newFiles}
            onNewFilesChange={handleNewFilesChange}
            onRemoveExistingDocument={handleRemoveExistingDocument}
            label="Documents"
            readOnly={readOnly}
          />

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Annuler
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enregistrer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
