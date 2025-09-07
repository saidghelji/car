import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Car, Users, CalendarDays, Banknote, AlertTriangle, TrendingUp, ArrowDownToLine, PenTool as Tools, Wallet } from 'lucide-react';
import { StatusBadge, Reservation } from './Reservations'; // Import StatusBadge and Reservation type
import { Customer } from './Customers'; // Import Customer type
import { Vehicle } from './Vehicles'; // Import Vehicle type
import axios from 'axios'; // Import axios
import toast from 'react-hot-toast'; // For notifications
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Widget component
const StatWidget = ({ title, value, icon, color }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-lg shadow p-5 transition-all duration-300 hover:shadow-md">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);


const Dashboard = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [traites, setTraites] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [vehicleInspections, setVehicleInspections] = useState<any[]>([]);
  const [vehicleInsurances, setVehicleInsurances] = useState<any[]>([]);
  const [vehiclesNeedingInspection, setVehiclesNeedingInspection] = useState<Vehicle[]>([]);
  const [vehiclesNeedingInsurance, setVehiclesNeedingInsurance] = useState<Vehicle[]>([]);
  const [vehiclesExpiringAutorisation, setVehiclesExpiringAutorisation] = useState<Vehicle[]>([]);
  const [vehiclesExpiringCarteGrise, setVehiclesExpiringCarteGrise] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const API_URL_CUSTOMERS = 'http://localhost:5000/api/customers';
  const API_URL_RESERVATIONS = 'http://localhost:5000/api/reservations';
  const API_URL_VEHICLES = 'http://localhost:5000/api/vehicles';
  const API_URL_INTERVENTIONS = 'http://localhost:5000/api/interventions';
  const API_URL_FACTURES = 'http://localhost:5000/api/factures';
  const API_URL_TRAITES = 'http://localhost:5000/api/traites';
  const API_URL_CHARGES = 'http://localhost:5000/api/charges';
  const API_URL_VEHICLE_INSPECTIONS = 'http://localhost:5000/api/vehicleinspections';
  const API_URL_VEHICLE_INSURANCES = 'http://localhost:5000/api/vehicleinsurances';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('Fetching dashboard data...');
    try {
      const [
        customersRes,
        reservationsRes,
        vehiclesRes,
        interventionsRes,
        facturesRes,
        traitesRes,
        chargesRes,
        vehicleInspectionsRes,
        vehicleInsurancesRes,
      ] = await Promise.all([
        axios.get<Customer[]>(API_URL_CUSTOMERS),
        axios.get<Reservation[]>(API_URL_RESERVATIONS).catch(err => {
          console.warn('Reservations API not ready:', err.message);
          return { data: [] };
        }),
        axios.get<Vehicle[]>(API_URL_VEHICLES),
        axios.get<any[]>(API_URL_INTERVENTIONS).catch(err => {
          console.warn('Interventions API not ready:', err.message);
          return { data: [] };
        }),
        axios.get<any[]>(API_URL_FACTURES).catch(err => {
          console.warn('Factures API not ready:', err.message);
          return { data: [] };
        }),
        axios.get<any[]>(API_URL_TRAITES).catch(err => {
          console.warn('Traites API not ready:', err.message);
          return { data: [] };
        }),
        axios.get<any[]>(API_URL_CHARGES).catch(err => {
          console.warn('Charges API not ready:', err.message);
          return { data: [] };
        }),
        axios.get<any[]>(API_URL_VEHICLE_INSPECTIONS).catch(err => {
          console.warn('Vehicle Inspections API not ready:', err.message);
          return { data: [] };
        }),
        axios.get<any[]>(API_URL_VEHICLE_INSURANCES).catch(err => {
          console.warn('Vehicle Insurances API not ready:', err.message);
          return { data: [] };
        }),
      ]);

      setCustomers(customersRes.data);
      setReservations(reservationsRes.data);
      setVehicles(vehiclesRes.data);
      setInterventions(interventionsRes.data);
      setFactures(facturesRes.data);
      setTraites(traitesRes.data);
      setCharges(chargesRes.data);
      setVehicleInspections(vehicleInspectionsRes.data);
      setVehicleInsurances(vehicleInsurancesRes.data);
      console.log('Dashboard data fetched successfully. Charges:', chargesRes.data);
      toast.success('Dashboard data loaded!');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data.');
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleChargeUpdate = () => {
      console.log('chargeUpdated event received. Re-fetching data...');
      fetchData();
    };
    window.addEventListener('chargeUpdated', handleChargeUpdate);
    return () => {
      window.removeEventListener('chargeUpdated', handleChargeUpdate);
    };
  }, [fetchData]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(0, 0, 0, 0);

    const vehiclesWithoutInspection: Vehicle[] = [];
    const vehiclesWithoutInsurance: Vehicle[] = [];
    const vehiclesWithExpiringAutorisation: Vehicle[] = [];
    const vehiclesWithExpiringCarteGrise: Vehicle[] = [];

    vehicles.forEach(vehicle => {
      // Check for active inspection
      const hasActiveInspection = vehicleInspections.some(inspection =>
        (inspection.vehicle && typeof inspection.vehicle === 'object' ? inspection.vehicle._id : inspection.vehicle) === vehicle._id &&
        new Date(inspection.endDate) >= today
      );

      if (!hasActiveInspection) {
        vehiclesWithoutInspection.push(vehicle);
      }

      // Check for active insurance
      const hasActiveInsurance = vehicleInsurances.some(insurance =>
        (insurance.vehicle && typeof insurance.vehicle === 'object' ? insurance.vehicle._id : insurance.vehicle) === vehicle._id &&
        new Date(insurance.endDate) >= today
      );

      if (!hasActiveInsurance) {
        vehiclesWithoutInsurance.push(vehicle);
      }

      // Check for expiring Autorisation Validity
      if (vehicle.autorisationValidity) {
        const autorisationDate = new Date(vehicle.autorisationValidity);
        autorisationDate.setHours(0, 0, 0, 0);

        const diffTime = autorisationDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 30) {
          vehiclesWithExpiringAutorisation.push(vehicle);
        }
      }

      // Check for expiring Carte Grise Validity
      if (vehicle.carteGriseValidity) {
        const carteGriseDate = new Date(vehicle.carteGriseValidity);
        carteGriseDate.setHours(0, 0, 0, 0);

        const diffTime = carteGriseDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 30) {
          vehiclesWithExpiringCarteGrise.push(vehicle);
        }
      }
    });

    setVehiclesNeedingInspection(vehiclesWithoutInspection);
    setVehiclesNeedingInsurance(vehiclesWithoutInsurance);
    setVehiclesExpiringAutorisation(vehiclesWithExpiringAutorisation);
    setVehiclesExpiringCarteGrise(vehiclesWithExpiringCarteGrise);

  }, [vehicles, vehicleInspections, vehicleInsurances]);

  // Calculation functions for monthly data
  const calculateMonthlyRecettes = useCallback(() => {
    const monthlyTotals = Array(12).fill(0); // 0-indexed for months

    reservations.forEach(res => {
      const reservationDate = new Date(res.reservationDate);
      if (
        reservationDate.getFullYear() === selectedYear &&
        res.status === 'validee' &&
        (!startDate || reservationDate >= startDate) &&
        (!endDate || reservationDate <= endDate)
      ) {
        monthlyTotals[reservationDate.getMonth()] += res.totalAmount;
      }
    });

    factures.forEach(fact => {
      const invoiceDate = new Date(fact.invoiceDate);
      if (
        invoiceDate.getFullYear() === selectedYear &&
        (!startDate || invoiceDate >= startDate) &&
        (!endDate || invoiceDate <= endDate)
      ) {
        monthlyTotals[invoiceDate.getMonth()] += fact.totalTTC;
      }
    });

    return monthlyTotals;
  }, [reservations, factures, startDate, endDate, selectedYear]);

  const calculateMonthlyDepenses = useCallback(() => {
    const monthlyTotals = Array(12).fill(0); // 0-indexed for months

    traites.forEach(traite => {
      const traiteDate = new Date(traite.datePaiement || traite.createdAt);
      if (
        traiteDate.getFullYear() === selectedYear &&
        (!startDate || traiteDate >= startDate) &&
        (!endDate || traiteDate <= endDate)
      ) {
        monthlyTotals[traiteDate.getMonth()] += traite.montant;
      }
    });

    charges.forEach(charge => {
      const chargeDate = new Date(charge.date || charge.createdAt);
      const chargeAmount = Number(charge.montant); // Corrected to use charge.montant
      if (
        chargeDate.getFullYear() === selectedYear &&
        !isNaN(chargeAmount) &&
        (!startDate || chargeDate >= startDate) &&
        (!endDate || chargeDate <= endDate)
      ) {
        monthlyTotals[chargeDate.getMonth()] += chargeAmount;
      }
    });

    interventions.forEach(intervention => {
      const interventionDate = new Date(intervention.date);
      if (
        interventionDate.getFullYear() === selectedYear &&
        (!startDate || interventionDate >= startDate) &&
        (!endDate || interventionDate <= endDate)
      ) {
        monthlyTotals[interventionDate.getMonth()] += intervention.cost;
      }
    });

    vehicleInspections.forEach(inspection => {
      const inspectionDate = new Date(inspection.inspectionDate);
      if (
        inspectionDate.getFullYear() === selectedYear &&
        (!startDate || inspectionDate >= startDate) &&
        (!endDate || inspectionDate <= endDate)
      ) {
        monthlyTotals[inspectionDate.getMonth()] += inspection.price;
      }
    });

    vehicleInsurances.forEach(insurance => {
      const insuranceDate = new Date(insurance.operationDate);
      if (
        insuranceDate.getFullYear() === selectedYear &&
        (!startDate || insuranceDate >= startDate) &&
        (!endDate || insuranceDate <= endDate)
      ) {
        monthlyTotals[insuranceDate.getMonth()] += insurance.price;
      }
    });

    return monthlyTotals;
  }, [traites, charges, interventions, vehicleInspections, vehicleInsurances, startDate, endDate, selectedYear]);

  const monthlyRecettes = calculateMonthlyRecettes();
  const monthlyDepenses = calculateMonthlyDepenses();

  const totalRecettes = monthlyRecettes.reduce((sum, val) => sum + val, 0);
  const totalDepenses = monthlyDepenses.reduce((sum, val) => sum + val, 0);

  // Stats data
  const activeVehiclesCount = vehicles.filter(v => v.statut === 'En parc').length;
  const activeClientsCount = customers.filter(c => c.status === 'Actif').length;

  const stats = [
    {
      title: "Véhicules actifs",
      value: activeVehiclesCount.toString(),
      icon: <Car size={20} className="text-white" />,
      color: "bg-blue-600"
    },
    {
      title: "Réservations",
      value: reservations.length.toString(),
      icon: <CalendarDays size={20} className="text-white" />,
      color: "bg-green-600"
    },
    {
      title: "Clients",
      value: activeClientsCount.toString(),
      icon: <Users size={20} className="text-white" />,
      color: "bg-purple-600"
    },
    {
      title: "Total des recettes",
      value: `${totalRecettes.toLocaleString('fr-FR')} DH`,
      icon: <Banknote size={20} className="text-white" />,
      color: "bg-amber-600"
    },
    {
      title: "Total des dépenses",
      value: `${totalDepenses.toLocaleString('fr-FR')} DH`,
      icon: <Wallet size={20} className="text-white" />,
      color: "bg-red-600"
    },
  ];

  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Recettes',
        data: monthlyRecettes,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Dépenses',
        data: monthlyDepenses,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Recettes et Dépenses Mensuelles (${selectedYear})`,
      },
    },
  };

  // Maintenance thresholds
  const MAINTENANCE_INTERVAL = 10000; // every 10,000 km
  const ALERT_DISTANCE = 200; // alert when within 200 km

  // Compute vehicles approaching maintenance (within ALERT_DISTANCE of next MAINTENANCE_INTERVAL)
  const vehiclesApproachingMaintenance: { vehicle: Vehicle; nextThreshold: number; distance: number }[] = [];

  vehicles.forEach(vehicle => {
    const mileage = Number(vehicle.mileage) || 0;

    // Calculate next threshold: smallest multiple of MAINTENANCE_INTERVAL strictly greater than current mileage
    const nextThreshold = Math.ceil((mileage + 1) / MAINTENANCE_INTERVAL) * MAINTENANCE_INTERVAL;
    const distance = nextThreshold - mileage;

    if (distance > 0 && distance <= ALERT_DISTANCE) {
      // Check if there's already an intervention (adjustment) created for this vehicle that covers this next threshold
      const hasAdjustment = interventions.some(intervention => {
        const ivVehicleId = (intervention.vehicle && typeof intervention.vehicle === 'object') ? intervention.vehicle._id : intervention.vehicle;
        const nextMileageVal = intervention.nextMileage !== undefined && intervention.nextMileage !== null ? Number(intervention.nextMileage) : null;
        return ivVehicleId === vehicle._id && nextMileageVal !== null && nextMileageVal >= nextThreshold;
      });

      if (!hasAdjustment) {
        vehiclesApproachingMaintenance.push({ vehicle, nextThreshold, distance });
      }
    }
  });

  const alerts = [];

  if (vehiclesNeedingInspection.length > 0) {
    alerts.push({
      title: `Visite Technique requise (${vehiclesNeedingInspection.length} véhicules)`,
      description: `Les véhicules suivants nécessitent une visite technique : ${vehiclesNeedingInspection.map(v => v.licensePlate).join(', ')}`,
      action: "Gérer les visites techniques",
      type: "warning",
      onClick: () => navigate('/vehicules/visites-techniques'),
    });
  }

  if (vehiclesNeedingInsurance.length > 0) {
    alerts.push({
      title: `Assurance requise (${vehiclesNeedingInsurance.length} véhicules)`,
      description: `Les véhicules suivants nécessitent une assurance : ${vehiclesNeedingInsurance.map(v => v.licensePlate).join(', ')}`,
      action: "Gérer les assurances",
      type: "warning",
      onClick: () => navigate('/vehicules/assurances'),
    });
  }

  if (vehiclesExpiringAutorisation.length > 0) {
    alerts.push({
      title: `Validité autorisation expirant (${vehiclesExpiringAutorisation.length} véhicules)`,
      description: `L'autorisation des véhicules suivants expire bientôt : ${vehiclesExpiringAutorisation.map(v => v.licensePlate).join(', ')}`,
      action: "Gérer les véhicules",
      type: "warning",
      onClick: () => navigate('/vehicules'),
    });
  }

  if (vehiclesExpiringCarteGrise.length > 0) {
    alerts.push({
      title: `Validité carte grise expirant (${vehiclesExpiringCarteGrise.length} véhicules)`,
      description: `La carte grise des véhicules suivants expire bientôt : ${vehiclesExpiringCarteGrise.map(v => v.licensePlate).join(', ')}`,
      action: "Gérer les véhicules",
      type: "warning",
      onClick: () => navigate('/vehicules'),
    });
  }

  if (vehiclesApproachingMaintenance.length > 0) {
    // Create a separate alert for each vehicle approaching maintenance so errors are separated
    vehiclesApproachingMaintenance.forEach(({ vehicle, nextThreshold, distance }) => {
      alerts.push({
        title: `Intervention requise — ${vehicle.licensePlate}`,
        description: `Le véhicule ${vehicle.licensePlate} approche ${nextThreshold.toLocaleString('fr-FR')} km (dans ${distance} km).`,
        action: "Aller aux Interventions",
        type: "warning",
        onClick: () => navigate(`/interventions?vehicle=${vehicle._id}`),
      });
    });
  }

  // Note: removed static placeholder alerts for Maintenance and Pending Payments

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-600">
        <p className="text-lg">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatWidget key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue and Expenses Chart */}
        <div className="bg-white rounded-lg shadow col-span-2 p-4">
          <h2 className="text-lg font-medium mb-4">Recettes et Dépenses Mensuelles</h2>
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label htmlFor="yearPicker" className="block text-sm font-medium text-gray-700">Année</label>
              <DatePicker
                id="yearPicker"
                selected={new Date(selectedYear, 0, 1)}
                onChange={(date: Date | null) => setSelectedYear(date ? date.getFullYear() : new Date().getFullYear())}
                showYearPicker
                dateFormat="yyyy"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 hover:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Date de début</label>
              <DatePicker
                id="startDate"
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="dd/MM/yyyy"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 hover:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Date de fin</label>
              <DatePicker
                id="endDate"
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                dateFormat="dd/MM/yyyy"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 hover:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <button
              onClick={() => { setStartDate(null); setEndDate(null); setSelectedYear(new Date().getFullYear()); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Réinitialiser
            </button>
          </div>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Alerts and Activity */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-medium">Alertes</h2>
            </div>
            <div className="p-4 space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  alert.type === 'warning' ? 'bg-red-50 border-l-4 border-red-400' : 'bg-blue-50 border-l-4 border-blue-400'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {alert.type === 'warning' ? (
                        <AlertTriangle size={18} className="text-red-400" />
                      ) : (
                        <TrendingUp size={18} className="text-blue-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">
                        {alert.title}
                      </h3>
                      <div className="mt-1 text-sm text-gray-600">
                        {alert.description}
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={alert.onClick}
                          className={`text-sm font-medium ${
                            alert.type === 'warning' ? 'text-red-700 hover:text-red-600' : 'text-blue-700 hover:text-blue-600'
                          }`}
                        >
                          {alert.action}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-lg shadow col-span-full">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Réservations récentes</h2>
            <button
              onClick={() => navigate('/reservations')}
              className="text-blue-600 text-sm font-medium hover:text-blue-800 focus:outline-none"
            >
              Voir tout
            </button>
          </div>
          <div className="p-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de début
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.slice(0, 5).map((reservation: Reservation) => ( // Limit to 5 recent reservations
                  <tr key={reservation._id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(reservation.customer && typeof reservation.customer === 'object') ? `${reservation.customer.prenomFr} ${reservation.customer.nomFr}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(reservation.vehicle && typeof reservation.vehicle === 'object') ? reservation.vehicle.model : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(reservation.startDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={reservation.status} />
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">
                      Aucune réservation récente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
