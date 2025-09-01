require('dotenv').config({ path: './.env', debug: true, override: true });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the connectDB function
const customerRoutes = require('./routes/customerRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const contractRoutes = require('./routes/contractRoutes');
const reservationRoutes = require('./routes/reservationRoutes'); // Import reservation routes
const interventionRoutes = require('./routes/interventionRoutes'); // Import intervention routes
const accidentRoutes = require('./routes/accidentRoutes'); // Import accident routes
const chargeRoutes = require('./routes/chargeRoutes'); // Import charge routes
const clientPaymentRoutes = require('./routes/clientPaymentRoutes'); // Import client payment routes
const factureRoutes = require('./routes/factureRoutes'); // Import facture routes
const infractionRoutes = require('./routes/infractionRoutes'); // Import infraction routes
const traiteRoutes = require('./routes/traiteRoutes'); // Import traite routes
const vehicleInspectionRoutes = require('./routes/vehicleInspectionRoutes'); // Import vehicle inspection routes
const vehicleInsuranceRoutes = require('./routes/vehicleInsuranceRoutes'); // Import vehicle insurance routes
const userRoutes = require('./routes/userRoutes'); // Import user routes

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Define Routes
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reservations', reservationRoutes); // Use reservation routes
app.use('/api/interventions', interventionRoutes); // Use intervention routes
app.use('/api/accidents', accidentRoutes); // Use accident routes
app.use('/api/charges', chargeRoutes); // Use charge routes
app.use('/api/clientpayments', clientPaymentRoutes); // Use client payment routes
app.use('/api/factures', factureRoutes); // Use facture routes
app.use('/api/infractions', infractionRoutes); // Use infraction routes
app.use('/api/traites', traiteRoutes); // Use traite routes
app.use('/api/vehicleinspections', vehicleInspectionRoutes); // Use vehicle inspection routes
app.use('/api/vehicleinsurances', vehicleInsuranceRoutes); // Use vehicle insurance routes
app.use('/api/users', userRoutes); // Use user routes

// Basic route (optional, for testing server status)
app.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = app;
