// Removed unused React import
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Reservations from './pages/Reservations';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Contrats from './pages/Contrats';
import Factures from './pages/Factures';
import Charges from './pages/Charges';
import ClientPayments from './pages/ClientPayments';
import VehicleInspections from './pages/VehicleInspections';
import VehicleInsurance from './pages/VehicleInsurance';
import Infractions from './pages/Infractions';
import Interventions from './pages/Interventions';
import Accidents from './pages/Accidents';
import Traites from './pages/Traites';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="vehicules" element={<Vehicles />} />
              <Route path="vehicules/visites-techniques" element={<VehicleInspections />} />
              <Route path="vehicules/assurances" element={<VehicleInsurance />} />
              <Route path="clients" element={<Customers />} />
              <Route path="clients/reglements" element={<ClientPayments />} />
              <Route path="clients/reglements/new" element={<ClientPayments />} />
              <Route path="infractions" element={<Infractions />} />
              <Route path="interventions" element={<Interventions />} />
              <Route path="accidents" element={<Accidents />} />
              <Route path="contrats" element={<Contrats />} />
              <Route path="factures" element={<Factures />} />
              <Route path="charges" element={<Charges />} />
              <Route path="traites" element={<Traites />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="parametres" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
