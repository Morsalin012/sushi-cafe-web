/**
 * Reservation Routes
 * API endpoints for table reservations
 */

const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

// GET /api/reservations/user/:userId - Get user's reservations
router.get('/user/:userId', async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    const query = { user: req.params.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed'] };
    }

    const reservations = await Reservation.find(query)
      .sort('-date')
      .limit(20);

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

// GET /api/reservations/:id - Get single reservation
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ message: 'Error fetching reservation' });
  }
});

// GET /api/reservations/lookup/:code - Lookup by confirmation code
router.get('/lookup/:code', async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ 
      confirmationCode: req.params.code.toUpperCase() 
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({
      confirmationCode: reservation.confirmationCode,
      guestName: reservation.guestName,
      date: reservation.date,
      time: reservation.time,
      partySize: reservation.partySize,
      status: reservation.status,
      tableNumber: reservation.tableNumber
    });
  } catch (error) {
    console.error('Lookup reservation error:', error);
    res.status(500).json({ message: 'Error looking up reservation' });
  }
});

// POST /api/reservations - Create reservation
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      guestName,
      guestEmail,
      guestPhone,
      date,
      time,
      partySize,
      occasion,
      specialRequests
    } = req.body;

    // Validate required fields
    if (!guestName || !guestEmail || !guestPhone || !date || !time || !partySize) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if date is in the future
    const reservationDate = new Date(date);
    if (reservationDate < new Date()) {
      return res.status(400).json({ message: 'Reservation date must be in the future' });
    }

    // Create reservation
    const reservation = await Reservation.create({
      user: userId || undefined,
      guestName,
      guestEmail: guestEmail.toLowerCase(),
      guestPhone,
      date: reservationDate,
      time,
      partySize,
      occasion,
      specialRequests
    });

    console.log(`✅ Reservation created: ${reservation.confirmationCode}`);
    
    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: {
        confirmationCode: reservation.confirmationCode,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status
      }
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

// PUT /api/reservations/:id - Update reservation
router.put('/:id', async (req, res) => {
  try {
    const { date, time, partySize, specialRequests } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Can only modify pending or confirmed reservations
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Cannot modify reservation in current status' });
    }

    if (date) reservation.date = new Date(date);
    if (time) reservation.time = time;
    if (partySize) reservation.partySize = partySize;
    if (specialRequests !== undefined) reservation.specialRequests = specialRequests;

    await reservation.save();

    res.json({
      message: 'Reservation updated',
      reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Error updating reservation' });
  }
});

// POST /api/reservations/:id/cancel - Cancel reservation
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Cannot cancel reservation in current status' });
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = reason;
    
    await reservation.save();

    console.log(`✅ Reservation cancelled: ${reservation.confirmationCode}`);
    res.json({ message: 'Reservation cancelled' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ message: 'Error cancelling reservation' });
  }
});

// GET /api/reservations/available-slots - Get available time slots
router.get('/available-slots/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Get all reservations for the day
    const reservations = await Reservation.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Define available time slots (cafe hours)
    const allSlots = [
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
      '20:00', '20:30', '21:00'
    ];

    // Count reservations per slot (assuming 10 tables max)
    const MAX_TABLES = 10;
    const slotCounts = reservations.reduce((acc, res) => {
      acc[res.time] = (acc[res.time] || 0) + 1;
      return acc;
    }, {});

    const availableSlots = allSlots.map(slot => ({
      time: slot,
      available: (slotCounts[slot] || 0) < MAX_TABLES,
      remaining: MAX_TABLES - (slotCounts[slot] || 0)
    }));

    res.json(availableSlots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Error fetching available slots' });
  }
});

module.exports = router;
