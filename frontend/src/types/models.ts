export interface Customer {
  id: string;
  nomFr: string;
  prenomFr: string;
  email?: string;
  documents?: any[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  chassisNumber?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  mileage?: number;
  statut?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contract {
  id: string;
  clientId: string;
  vehicleId: string;
  contractNumber?: string;
  contractDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Facture {
  id: string;
  invoiceNumber?: string;
  clientId?: string;
  contractId?: string;
  montantHT?: number;
  totalTTC?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default {};
