const Booking = require('../models/Booking');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { sendEmail } = require('../utils/sendEmail');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @route   GET /api/v1/offers/:offerId/bookings
// @access  Private (Admin)
exports.getBookings = asyncHandler(async (req, res, next) => {
  if (req.params.offerId) {
    const bookings = await Booking.find({ offer: req.params.offerId });
    
    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`No booking with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner, seller, or admin
  if (
    booking.user.toString() !== req.user.id &&
    booking.seller.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this booking`,
        401
      )
    );
  }

  res.status(200).json({ success: true, data: booking });
});

// @desc    Add booking
// @route   POST /api/v1/offers/:offerId/bookings
// @access  Private
exports.addBooking = asyncHandler(async (req, res, next) => {
  req.body.offer = req.params.offerId;
  req.body.user = req.user.id;

  const offer = await Offer.findById(req.params.offerId);

  if (!offer) {
    return next(
      new ErrorResponse(`No offer with the id of ${req.params.offerId}`, 404)
    );
  }

  // Check if offer is active and has available quantity
  if (!offer.isActive || offer.availableQuantity <= 0) {
    return next(
      new ErrorResponse('This offer is no longer available', 400)
    );
  }

  // Check if pickup time has passed
  if (new Date(offer.pickupEnd) < new Date()) {
    return next(
      new ErrorResponse('The pickup time for this offer has passed', 400)
    );
  }

  // Set seller from offer
  req.body.seller = offer.seller;
  req.body.totalPrice = offer.discountedPrice * (req.body.quantity || 1);
  
  // Check if user is not booking their own offer
  if (req.user.id === offer.seller.toString()) {
    return next(
      new ErrorResponse('You cannot book your own offer', 400)
    );
  }

  // Check if user already has a booking for this offer
  const existingBooking = await Booking.findOne({
    user: req.user.id,
    offer: req.params.offerId,
    status: { $in: ['pending', 'confirmed'] }
  });

  if (existingBooking) {
    return next(
      new ErrorResponse('You already have a booking for this offer', 400)
    );
  }

  // Generate unique pickup code
  const pickupCode = await Booking.generatePickupCode();
  req.body.pickupCode = pickupCode;
  req.body.pickupTime = offer.pickupStart;

  const booking = await Booking.create(req.body);

  // Send notification to seller
  await Notification.create({
    user: offer.seller,
    title: 'New Booking!',
    message: `You have a new booking for "${offer.title}"`,
    type: 'booking_created',
    relatedEntity: {
      entityType: 'booking',
      entityId: booking._id
    },
    actionUrl: `/bookings/${booking._id}`,
    priority: 'high'
  });

  // Send confirmation email to user
  const user = await User.findById(req.user.id);
  
  const message = `
    <h2>Booking Confirmation</h2>
    <p>Thank you for your booking with FoodSaver DZ!</p>
    <h3>Booking Details</h3>
    <ul>
      <li><strong>Offer:</strong> ${offer.title}</li>
      <li><strong>Quantity:</strong> ${booking.quantity}</li>
      <li><strong>Total Price:</strong> ${booking.totalPrice} DZD</li>
      <li><strong>Pickup Code:</strong> ${booking.pickupCode}</li>
      <li><strong>Pickup Time:</strong> ${new Date(booking.pickupTime).toLocaleString()}</li>
    </ul>
    <p>Please show this code to the seller when picking up your order.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Booking Confirmation',
      html: message
    });
  } catch (err) {
    console.error('Error sending email:', err);
  }

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res, next) => {
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`No booking with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner, seller, or admin
  if (
    booking.user.toString() !== req.user.id &&
    booking.seller.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this booking`,
        401
      )
    );
  }

  // Prevent certain fields from being updated
  const { status, cancellationReason, cancelledBy } = req.body;
  const updateObj = {};

  // Only allow status updates with valid transitions
  if (status) {
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      expired: [],
      rejected: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return next(
        new ErrorResponse(
          `Invalid status transition from ${booking.status} to ${status}`,
          400
        )
      );
    }

    updateObj.status = status;

    // Handle cancellation
    if (status === 'cancelled') {
      updateObj.cancelledAt = Date.now();
      updateObj.cancelledBy = req.user.role === 'admin' ? 'admin' : 
                             (req.user.id === booking.user.toString() ? 'user' : 'seller');
      
      if (cancellationReason) {
        updateObj.cancellationReason = cancellationReason;
      }

      // If seller cancels, notify user
      if (req.user.id === booking.seller.toString()) {
        await Notification.create({
          user: booking.user,
          title: 'Booking Cancelled',
          message: `Your booking #${booking._id} has been cancelled by the seller`,
          type: 'booking_cancelled',
          relatedEntity: {
            entityType: 'booking',
            entityId: booking._id
          },
          priority: 'high'
        });
      }
    }

    // Handle completion
    if (status === 'completed') {
      updateObj.completedAt = Date.now();
      
      // Notify user
      await Notification.create({
        user: booking.user,
        title: 'Order Picked Up',
        message: `Your order #${booking._id} has been marked as picked up. Thank you for using FoodSaver DZ!`,
        type: 'booking_completed',
        relatedEntity: {
          entityType: 'booking',
          entityId: booking._id
        },
        priority: 'medium'
      });
    }
  }

  // Update booking
  booking = await Booking.findByIdAndUpdate(req.params.id, updateObj, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: booking });
});

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(
      new ErrorResponse(`No booking with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is booking owner, seller, or admin
  if (
    booking.user.toString() !== req.user.id &&
    booking.seller.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this booking`,
        401
      )
    );
  }

  // Only allow deletion of pending or cancelled bookings
  if (!['pending', 'cancelled'].includes(booking.status)) {
    return next(
      new ErrorResponse(
        `Cannot delete a booking with status ${booking.status}`,
        400
      )
    );
  }

  await booking.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get bookings by user
// @route   GET /api/v1/users/:userId/bookings
// @access  Private
exports.getUserBookings = asyncHandler(async (req, res, next) => {
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these bookings`,
        401
      )
    );
  }

  const bookings = await Booking.find({ user: req.params.userId })
    .populate('offer', 'title images')
    .populate('seller', 'name storeName')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get bookings by seller
// @route   GET /api/v1/sellers/:sellerId/bookings
// @access  Private
exports.getSellerBookings = asyncHandler(async (req, res, next) => {
  if (req.params.sellerId !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these bookings`,
        401
      )
    );
  }

  const bookings = await Booking.find({ seller: req.params.sellerId })
    .populate('user', 'name email phone')
    .populate('offer', 'title images')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Verify pickup code
// @route   GET /api/v1/bookings/verify/:code
// @access  Private (Seller)
exports.verifyPickupCode = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findOne({
    pickupCode: req.params.code,
    status: { $in: ['pending', 'confirmed'] }
  })
  .populate('user', 'name email')
  .populate('offer', 'title')
  .populate('seller', 'name storeName');

  if (!booking) {
    return next(
      new ErrorResponse('Invalid or expired pickup code', 404)
    );
  }

  // Make sure the seller is the one verifying
  if (booking.seller._id.toString() !== req.user.id) {
    return next(
      new ErrorResponse('You are not authorized to verify this code', 401)
    );
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Complete booking with pickup code
// @route   PUT /api/v1/bookings/complete/:code
// @access  Private (Seller)
exports.completeBookingWithCode = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findOne({
    pickupCode: req.params.code,
    status: { $in: ['pending', 'confirmed'] }
  });

  if (!booking) {
    return next(
      new ErrorResponse('Invalid or expired pickup code', 404)
    );
  }

  // Make sure the seller is the one completing
  if (booking.seller.toString() !== req.user.id) {
    return next(
      new ErrorResponse('You are not authorized to complete this booking', 401)
    );
  }

  // Update booking status to completed
  booking.status = 'completed';
  booking.completedAt = Date.now();
  await booking.save();

  // Notify user
  await Notification.create({
    user: booking.user,
    title: 'Order Picked Up',
    message: `Your order #${booking._id} has been marked as picked up. Thank you for using FoodSaver DZ!`,
    type: 'booking_completed',
    relatedEntity: {
      entityType: 'booking',
      entityId: booking._id
    },
    priority: 'medium'
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get booking stats
// @route   GET /api/v1/bookings/stats
// @access  Private (Admin, Seller)
exports.getBookingStats = asyncHandler(async (req, res, next) => {
  let match = {};
  
  // If not admin, only show stats for the seller's bookings
  if (req.user.role === 'seller') {
    match.seller = req.user.id;
  }

  const stats = await Booking.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        avgQuantity: { $avg: '$quantity' },
        minPrice: { $min: '$totalPrice' },
        maxPrice: { $max: '$totalPrice' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Get total stats
  const totalStats = await Booking.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // Get monthly stats
  const monthlyStats = await Booking.aggregate([
    {
      $match: {
        ...match,
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      totals: totalStats[0] || {},
      monthly: monthlyStats
    }
  });
});
