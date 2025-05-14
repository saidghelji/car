import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Reservations from './pages/Reservations';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Contrats from './pages/Contrats';
import Factures from './pages/Factures';
import ClientPayments from './pages/ClientPayments';
import VehicleInspections from './pages/VehicleInspections';
import VehicleInsurance from './pages/VehicleInsurance';
import VehicleAgencies from './pages/VehicleAgencies';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="vehicules" element={<Vehicles />} />
            <Route path="vehicules/visites-techniques" element={<VehicleInspections />} />
            <Route path="vehicules/assurances" element={<VehicleInsurance />} />
            <Route path="vehicules/agences" element={<VehicleAgencies />} />
            <Route path="clients" element={<Customers />} />
            <Route path="clients/reglements" element={<ClientPayments />} />
            <Route path="contrats" element={<Contrats />} />
            <Route path="factures" element={<Factures />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="parametres" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;