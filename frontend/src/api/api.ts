import axios from 'axios';
import type { Customer, Vehicle, Contract, Facture } from '../types/models';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const client = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

// Attach JWT automatically from localStorage (if present)
client.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem('token');
    cfg.headers = cfg.headers ?? {};
    if (token) (cfg.headers as any).Authorization = `Bearer ${token}`;
  } catch (e) { /* ignore */ }
  return cfg;
});

async function unwrap<T>(p: Promise<import('axios').AxiosResponse<T>>): Promise<T> {
  const res = await p;
  return res.data;
}

export const api = {
  // Customers
  getCustomers: (params?: Record<string, any>) => unwrap<Customer[]>(client.get('/api/customers', { params })),
  getCustomer: (id: string) => unwrap<Customer>(client.get(`/api/customers/${id}`)),
  createCustomer: (payload: Partial<Customer>) => unwrap<Customer>(client.post('/api/customers', payload)),
  updateCustomer: (id: string, payload: Partial<Customer>) => unwrap<Customer>(client.put(`/api/customers/${id}`, payload)),

  // Vehicles
  getVehicles: (params?: Record<string, any>) => unwrap<Vehicle[]>(client.get('/api/vehicles', { params })),
  getVehicle: (id: string) => unwrap<Vehicle>(client.get(`/api/vehicles/${id}`)),
  createVehicle: (payload: Partial<Vehicle>) => unwrap<Vehicle>(client.post('/api/vehicles', payload)),
  updateVehicle: (id: string, payload: Partial<Vehicle>) => unwrap<Vehicle>(client.put(`/api/vehicles/${id}`, payload)),

  // Contracts
  getContracts: (params?: Record<string, any>) => unwrap<Contract[]>(client.get('/api/contracts', { params })),
  getContract: (id: string) => unwrap<Contract>(client.get(`/api/contracts/${id}`)),
  createContract: (payload: Partial<Contract>) => unwrap<Contract>(client.post('/api/contracts', payload)),
  updateContract: (id: string, payload: Partial<Contract>) => unwrap<Contract>(client.put(`/api/contracts/${id}`, payload)),

  // Factures
  getFactures: (params?: Record<string, any>) => unwrap<Facture[]>(client.get('/api/factures', { params })),
  getFacture: (id: string) => unwrap<Facture>(client.get(`/api/factures/${id}`)),
  createFacture: (payload: Partial<Facture>) => unwrap<Facture>(client.post('/api/factures', payload)),
  updateFacture: (id: string, payload: Partial<Facture>) => unwrap<Facture>(client.put(`/api/factures/${id}`, payload)),
};

export default api;
