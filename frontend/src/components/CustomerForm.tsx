import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import countries from '../data/countries.json';

interface Country {
  code: string;
  name: string;
}

interface CustomerFormData {
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
}

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    // Conducteur
    civilite: '',
    nationalite: '',
    type: 'Particulier',
    listeNoire: false,
    nomFr: '',
    nomAr: '',
    prenomFr: '',
    prenomAr: '',
    dateNaissance: '',
    age: '',
    lieuNaissance: '',
    
    // Pièce d'identité
    cin: '',
    cinDelivreLe: '',
    cinDelivreA: '',
    cinValidite: '',
    
    // Permis
    numeroPermis: '',
    permisDelivreLe: '',
    permisDelivreA: '',
    permisValidite: '',
    
    // Passeport
    numeroPasseport: '',
    passportDelivreLe: '',
    passportDelivreA: '',
    passportValidite: '',
    
    // Contact
    adresseFr: '',
    ville: '',
    adresseAr: '',
    codePostal: '',
    telephone: '',
    telephone2: '',
    fix: '',
    fax: '',
    remarque: '',
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
    }
  }, [formData.dateNaissance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const requiredFields = [
      'civilite',
      'nationalite',
      'type',
      'nomFr',
      'prenomFr',
      'dateNaissance',
      'lieuNaissance',
      'cin',
      'cinDelivreLe',
      'cinDelivreA',
      'cinValidite',
      'numeroPermis',
      'permisDelivreLe',
      'permisDelivreA',
      'permisValidite'
    ] as (keyof CustomerFormData)[];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      alert('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ajouter un client</h2>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
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
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Nom arabe</label>
                <input
                  type="text"
                  name="nomAr"
                  value={formData.nomAr}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block mb-1">Prénom français (*)</label>
                <input
                  type="text"
                  name="prenomFr"
                  value={formData.prenomFr}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Prénom arabe</label>
                <input
                  type="text"
                  name="prenomAr"
                  value={formData.prenomAr}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block mb-1">Date naissance (*)</label>
                <input
                  type="date"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
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
                  className="w-full border rounded p-2"
                  required
                />
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
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Délivré le (*)</label>
                <input
                  type="date"
                  name="cinDelivreLe"
                  value={formData.cinDelivreLe}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Délivrée à (*)</label>
                <input
                  type="text"
                  name="cinDelivreA"
                  value={formData.cinDelivreA}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Validité (*)</label>
                <input
                  type="date"
                  name="cinValidite"
                  value={formData.cinValidite}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
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
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Délivré le (*)</label>
                <input
                  type="date"
                  name="permisDelivreLe"
                  value={formData.permisDelivreLe}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Délivrée à (*)</label>
                <input
                  type="text"
                  name="permisDelivreA"
                  value={formData.permisDelivreA}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Validité (*)</label>
                <input
                  type="date"
                  name="permisValidite"
                  value={formData.permisValidite}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
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
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Délivré le</label>
                <input
                  type="date"
                  name="passportDelivreLe"
                  value={formData.passportDelivreLe}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Délivrée à</label>
                <input
                  type="text"
                  name="passportDelivreA"
                  value={formData.passportDelivreA}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Validité</label>
                <input
                  type="date"
                  name="passportValidite"
                  value={formData.passportValidite}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
          </div>

          {/* Section Contact */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Adresse français</label>
                <input
                  type="text"
                  name="adresseFr"
                  value={formData.adresseFr}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Ville</label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Adresse arabe</label>
                <input
                  type="text"
                  name="adresseAr"
                  value={formData.adresseAr}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block mb-1">Code postal</label>
                <input
                  type="text"
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Téléphone 2</label>
                <input
                  type="tel"
                  name="telephone2"
                  value={formData.telephone2}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Fix</label>
                <input
                  type="tel"
                  name="fix"
                  value={formData.fix}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Fax</label>
                <input
                  type="tel"
                  name="fax"
                  value={formData.fax}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-1">Remarque</label>
                <textarea
                  name="remarque"
                  value={formData.remarque}
                  onChange={handleChange}
                  className="w-full border rounded p-2 h-24"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;