const asyncHandler = require('express-async-handler');
const Reservation = require('../models/Reservation.model');
const Customer = require('../models/Customer.model');
const Vehicle = require('../models/Vehicle.model');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
const getReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.findAll({ order: [['createdAt', 'DESC']], include: [{ model: Customer, as: 'customer' }, { model: Vehicle, as: 'vehicle' }] });
  res.status(200).json(reservations);
});

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByPk(req.params.id);
  if (reservation) {
    const populated = await Reservation.findByPk(reservation.id, { include: [{ model: Customer, as: 'customer' }, { model: Vehicle, as: 'vehicle' }] });
    res.json(populated);
  } else {
    res.status(404);
    throw new Error('Reservation not found');
  }
});

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = asyncHandler(async (req, res) => {
  const { reservationDate, startDate, endDate, duration, status, customer, vehicle, totalAmount, advance, notes } = req.body;

  if (!reservationDate || !startDate || !endDate || !customer || !vehicle) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Generate a unique reservation number
  const latestReservation = await Reservation.findOne({ order: [['createdAt', 'DESC']] });
  let newReservationNumber = 'RES-0001';
  if (latestReservation && latestReservation.reservationNumber) {
    const lastNumber = parseInt(latestReservation.reservationNumber.split('-')[1]);
    newReservationNumber = `RES-${String(lastNumber + 1).padStart(4, '0')}`;
  }

  let createdReservation;
  const payload = {
    reservationNumber: newReservationNumber,
    reservationDate,
    startDate,
    endDate,
    duration,
    status: normalizeStatus(status),
    customerId: customer,
    vehicleId: vehicle,
    totalAmount,
    advance,
    notes,
  };
  console.log('Reservation.create payload:', payload);
  try {
    createdReservation = await Reservation.create(payload);
  } catch (err) {
    console.error('Reservation.create error:', err);
    const dbError = err.parent || err.original || err;
    return res.status(500).json({ message: err.message, dbError: dbError, payload });
  }

  const populated = await Reservation.findByPk(createdReservation.id, { include: [{ model: Customer, as: 'customer' }, { model: Vehicle, as: 'vehicle' }] });
  res.status(201).json(populated);
});

// @desc    Update a reservation
// @route   PUT /api/reservations/:id
// @access  Private
const updateReservation = asyncHandler(async (req, res) => {
  const { reservationNumber, reservationDate, startDate, endDate, duration, status, customer, vehicle, totalAmount, advance, notes } = req.body;

  const reservation = await Reservation.findByPk(req.params.id);

  if (reservation) {
    const updates = {};
    if (reservationDate !== undefined) updates.reservationDate = reservationDate;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (duration !== undefined) updates.duration = duration;
  if (status !== undefined) updates.status = normalizeStatus(status);
    if (customer !== undefined) updates.customerId = customer;
    if (vehicle !== undefined) updates.vehicleId = vehicle;
    if (totalAmount !== undefined) updates.totalAmount = totalAmount;
    if (advance !== undefined) updates.advance = advance;
    if (notes !== undefined) updates.notes = notes;
    await reservation.update(updates);
  const populated = await Reservation.findByPk(reservation.id, { include: [{ model: Customer, as: 'customer' }, { model: Vehicle, as: 'vehicle' }] });
  res.json(populated);
  } else {
    res.status(404);
    throw new Error('Reservation not found');
  }
});

// helper to map incoming status values to the model ENUM
function normalizeStatus(input) {
  if (!input) return undefined;
  const s = String(input).toLowerCase();
  if (['en_cours', 'ongoing', 'in_progress', 'in progress', 'encours'].includes(s)) return 'en_cours';
  if (['validee', 'validated', 'confirmed', 'confirmé', 'confirm', 'valide'].includes(s)) return 'validee';
  if (['annulee', 'cancelled', 'cancel', 'annule', 'canceled'].includes(s)) return 'annulee';
  if (['fin_de_periode', 'ended', 'finished', 'complete', 'completed'].includes(s)) return 'fin_de_periode';
  // fallback: if it already matches one of the allowed enums, return it
  if (['en_cours', 'validee', 'annulee', 'fin_de_periode'].includes(s)) return s;
  // otherwise undefined so the model default can apply
  return undefined;
}

// @desc    Delete a reservation
// @route   DELETE /api/reservations/:id
// @access  Private
const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByPk(req.params.id);

  if (reservation) {
    await reservation.destroy();
    res.json({ message: 'Reservation removed' });
  } else {
    res.status(404);
    throw new Error('Reservation not found');
  }
});

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
