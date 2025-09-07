const Customer = require('./Customer.model');
const User = require('./User.model');
const Vehicle = require('./Vehicle.model');
const Contract = require('./Contract.model');
const Reservation = require('./Reservation.model');
const Accident = require('./Accident.model');
const Charge = require('./Charge.model');
const ClientPayment = require('./ClientPayment.model');
const Facture = require('./Facture.model');
const Infraction = require('./Infraction.model');
const Intervention = require('./Intervention.model');
const Traite = require('./Traite.model');
const VehicleInspection = require('./VehicleInspection.model');
const VehicleInsurance = require('./VehicleInsurance.model');

// Associations
// Contract belongs to Customer and Vehicle
Contract.belongsTo(Customer, { foreignKey: 'clientId', as: 'client' });
Customer.hasMany(Contract, { foreignKey: 'clientId', as: 'contracts' });
Contract.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Contract, { foreignKey: 'vehicleId', as: 'contracts' });

// Reservation belongs to Customer and Vehicle
Reservation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Reservation, { foreignKey: 'customerId', as: 'reservations' });
Reservation.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Reservation, { foreignKey: 'vehicleId', as: 'reservations' });

// Accident belongs to Contract, Customer, Vehicle
Accident.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
Contract.hasMany(Accident, { foreignKey: 'contractId', as: 'accidents' });
Accident.belongsTo(Customer, { foreignKey: 'clientId', as: 'client' });
Customer.hasMany(Accident, { foreignKey: 'clientId', as: 'accidents' });
Accident.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Accident, { foreignKey: 'vehicleId', as: 'accidents' });

// Facture belongs to Customer, Contract
Facture.belongsTo(Customer, { foreignKey: 'clientId', as: 'client' });
Customer.hasMany(Facture, { foreignKey: 'clientId', as: 'factures' });
Facture.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
Contract.hasMany(Facture, { foreignKey: 'contractId', as: 'factures' });

// ClientPayment belongs to Customer and Contract and Facture and Accident
ClientPayment.belongsTo(Customer, { foreignKey: 'clientId', as: 'client' });
Customer.hasMany(ClientPayment, { foreignKey: 'clientId', as: 'payments' });
ClientPayment.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
Contract.hasMany(ClientPayment, { foreignKey: 'contractId', as: 'payments' });
ClientPayment.belongsTo(Facture, { foreignKey: 'factureId', as: 'facture' });
Facture.hasMany(ClientPayment, { foreignKey: 'factureId', as: 'payments' });
ClientPayment.belongsTo(Accident, { foreignKey: 'accidentId', as: 'accident' });
Accident.hasMany(ClientPayment, { foreignKey: 'accidentId', as: 'payments' });

// Infraction belongs to Vehicle and Customer
Infraction.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Infraction, { foreignKey: 'vehicleId', as: 'infractions' });
// model uses customerId column, ensure association matches it
Infraction.belongsTo(Customer, { foreignKey: 'customerId', as: 'client' });
Customer.hasMany(Infraction, { foreignKey: 'customerId', as: 'infractions' });

// Intervention belongs to Vehicle
Intervention.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Intervention, { foreignKey: 'vehicleId', as: 'interventions' });

// VehicleInspection and VehicleInsurance belong to Vehicle
VehicleInspection.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(VehicleInspection, { foreignKey: 'vehicleId', as: 'inspections' });
VehicleInsurance.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(VehicleInsurance, { foreignKey: 'vehicleId', as: 'insurances' });
// VehicleInsurance may also belong to a Customer (policy holder)
VehicleInsurance.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(VehicleInsurance, { foreignKey: 'customerId', as: 'vehicleInsurances' });

// Traite belongs to Vehicle (monthly payments for a vehicle)
Traite.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Traite, { foreignKey: 'vehicleId', as: 'traites' });

module.exports = {
  Customer,
  User,
  Vehicle,
  Contract,
  Reservation,
  Accident,
  Charge,
  ClientPayment,
  Facture,
  Infraction,
  Intervention,
  Traite,
  VehicleInspection,
  VehicleInsurance,
};
