const asyncHandler = require('express-async-handler');
const Reservation = require('../models/Reservation');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
const getReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({}).populate('customer').populate('vehicle');
  res.status(200).json(reservations);
});

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate('customer').populate('vehicle');

  if (reservation) {
    res.json(reservation);
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
  const latestReservation = await Reservation.findOne().sort({ createdAt: -1 });
  let newReservationNumber = 'RES-0001';
  if (latestReservation && latestReservation.reservationNumber) {
    const lastNumber = parseInt(latestReservation.reservationNumber.split('-')[1]);
    newReservationNumber = `RES-${String(lastNumber + 1).padStart(4, '0')}`;
  }

  const reservation = new Reservation({
    reservationNumber: newReservationNumber,
    reservationDate,
    startDate,
    endDate,
    duration,
    status,
    customer,
    vehicle,
    totalAmount,
    advance,
    notes,
  });

  const createdReservation = await reservation.save();
  res.status(201).json(createdReservation);
});

// @desc    Update a reservation
// @route   PUT /api/reservations/:id
// @access  Private
const updateReservation = asyncHandler(async (req, res) => {
  const { reservationNumber, reservationDate, startDate, endDate, duration, status, customer, vehicle, totalAmount, advance, notes } = req.body;

  const reservation = await Reservation.findById(req.params.id);

  if (reservation) {
    // reservation.reservationNumber is now auto-generated, so we don't update it from req.body
    // If you need to allow manual updates, you would re-add the line above.
    reservation.reservationDate = reservationDate || reservation.reservationDate;
    reservation.startDate = startDate || reservation.startDate;
    reservation.endDate = endDate || reservation.endDate;
    reservation.duration = duration || reservation.duration;
    reservation.status = status || reservation.status;
    reservation.customer = customer || reservation.customer;
    reservation.vehicle = vehicle || reservation.vehicle;
    reservation.totalAmount = totalAmount || reservation.totalAmount;
    reservation.advance = advance || reservation.advance;
    reservation.notes = notes || reservation.notes;

    const updatedReservation = await reservation.save();
    res.json(updatedReservation);
  } else {
    res.status(404);
    throw new Error('Reservation not found');
  }
});

// @desc    Delete a reservation
// @route   DELETE /api/reservations/:id
// @access  Private
const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (reservation) {
    await reservation.deleteOne();
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
