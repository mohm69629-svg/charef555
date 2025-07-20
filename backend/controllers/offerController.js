const Offer = require('../models/Offer');
const Store = require('../models/Store');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const geocoder = require('../utils/geocoder');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');

// @desc    Get all offers
// @route   GET /api/v1/offers
// @access  Public
exports.getOffers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get nearby offers
// @route   GET /api/v1/offers/nearby
// @access  Public
exports.getNearbyOffers = asyncHandler(async (req, res, next) => {
  const { distance, lat, lng, unit = 'km' } = req.query;
  
  // Validate coordinates
  if (!lat || !lng) {
    return next(new ErrorResponse('Please provide latitude and longitude in the format lat,lng', 400));
  }

  // Calculate radius in radians
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  
  const offers = await Offer.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    },
    isActive: true,
    availableQuantity: { $gt: 0 },
    pickupEnd: { $gt: Date.now() }
  })
  .populate('seller', 'name storeName avatar')
  .populate('store', 'name address city')
  .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: offers.length,
    data: offers
  });
});

// @desc    Get single offer
// @route   GET /api/v1/offers/:id
// @access  Public
exports.getOffer = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id)
    .populate('seller', 'name storeName avatar phone')
    .populate('store', 'name address city location');

  if (!offer) {
    return next(
      new ErrorResponse(`Offer not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: offer });
});

// @desc    Create new offer
// @route   POST /api/v1/stores/:storeId/offers
// @access  Private (Seller)
exports.createOffer = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.seller = req.user.id;
  req.body.store = req.params.storeId;

  // Check if store exists and belongs to user
  const store = await Store.findOne({
    _id: req.params.storeId,
    owner: req.user.id
  });

  if (!store) {
    return next(
      new ErrorResponse(`No store found with id of ${req.params.storeId}`, 404)
    );
  }

  // Set available quantity to initial quantity
  req.body.availableQuantity = req.body.quantity;

  // Create offer
  const offer = await Offer.create(req.body);

  // Send notification to nearby users
  await Notification.create({
    user: req.user.id,
    title: 'New Offer Available!',
    message: `A new offer "${offer.title}" has been added to ${store.name}`,
    type: 'new_offer',
    relatedEntity: {
      entityType: 'offer',
      entityId: offer._id
    },
    actionUrl: `/offers/${offer._id}`,
    image: offer.images[0],
    priority: 'high',
    expiresAt: offer.pickupEnd
  });

  res.status(201).json({
    success: true,
    data: offer
  });
});

// @desc    Update offer
// @route   PUT /api/v1/offers/:id
// @access  Private (Seller)
exports.updateOffer = asyncHandler(async (req, res, next) => {
  let offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(
      new ErrorResponse(`No offer with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is offer owner
  if (offer.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this offer`,
        401
      )
    );
  }

  // If updating quantity, adjust availableQuantity accordingly
  if (req.body.quantity) {
    const quantityDiff = req.body.quantity - offer.quantity;
    req.body.availableQuantity = Math.max(0, offer.availableQuantity + quantityDiff);
  }

  offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: offer });
});

// @desc    Delete offer
// @route   DELETE /api/v1/offers/:id
// @access  Private (Seller, Admin)
exports.deleteOffer = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(
      new ErrorResponse(`No offer with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is offer owner or admin
  if (offer.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this offer`,
        401
      )
    );
  }

  // Cancel all pending bookings for this offer
  await Booking.updateMany(
    { 
      offer: offer._id, 
      status: { $in: ['pending', 'confirmed'] } 
    },
    { 
      status: 'cancelled',
      cancelledBy: req.user.role === 'admin' ? 'admin' : 'seller',
      cancellationReason: 'Offer was deleted by the seller'
    }
  );

  await offer.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Upload photo for offer
// @route   PUT /api/v1/offers/:id/photo
// @access  Private (Seller)
exports.offerPhotoUpload = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(
      new ErrorResponse(`Offer not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is offer owner
  if (offer.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this offer`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  const maxSize = process.env.MAX_FILE_UPLOAD || 1000000;
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${maxSize / 1000}KB`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${offer._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/offers/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add to images array if not full (max 5 images)
    if (offer.images.length < 5) {
      offer.images.push(file.name);
      await offer.save();
    }

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Get offers by store
// @route   GET /api/v1/stores/:storeId/offers
// @access  Public
exports.getOffersByStore = asyncHandler(async (req, res, next) => {
  if (req.params.storeId) {
    const offers = await Offer.find({ store: req.params.storeId });
    return res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get offers by seller
// @route   GET /api/v1/sellers/:sellerId/offers
// @access  Public
exports.getOffersBySeller = asyncHandler(async (req, res, next) => {
  const offers = await Offer.find({ seller: req.params.sellerId })
    .populate('store', 'name address')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: offers.length,
    data: offers
  });
});

// @desc    Get featured offers
// @route   GET /api/v1/offers/featured
// @access  Public
exports.getFeaturedOffers = asyncHandler(async (req, res, next) => {
  const offers = await Offer.find({
    isActive: true,
    availableQuantity: { $gt: 0 },
    pickupEnd: { $gt: Date.now() }
  })
  .sort('-rating -createdAt')
  .limit(10)
  .populate('seller', 'name storeName avatar')
  .populate('store', 'name address city');

  res.status(200).json({
    success: true,
    count: offers.length,
    data: offers
  });
});

// @desc    Search offers
// @route   GET /api/v1/offers/search
// @access  Public
exports.searchOffers = asyncHandler(async (req, res, next) => {
  const { q, category, minPrice, maxPrice, sort, lat, lng, distance = 10, unit = 'km' } = req.query;
  
  // Build query object
  const queryObj = {};
  
  // Search by keyword
  if (q) {
    queryObj.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { 'store.name': { $regex: q, $options: 'i' } }
    ];
  }
  
  // Filter by category
  if (category) {
    queryObj.category = { $in: category.split(',') };
  }
  
  // Filter by price range
  if (minPrice || maxPrice) {
    queryObj.discountedPrice = {};
    if (minPrice) queryObj.discountedPrice.$gte = Number(minPrice);
    if (maxPrice) queryObj.discountedPrice.$lte = Number(maxPrice);
  }
  
  // Filter by location if coordinates provided
  if (lat && lng) {
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    queryObj.location = {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    };
  }
  
  // Always filter active offers with available quantity and future pickup
  queryObj.isActive = true;
  queryObj.availableQuantity = { $gt: 0 };
  queryObj.pickupEnd = { $gt: Date.now() };
  
  // Build sort object
  let sortBy = '-createdAt';
  if (sort) {
    const sortOptions = {
      newest: '-createdAt',
      oldest: 'createdAt',
      priceLow: 'discountedPrice',
      priceHigh: '-discountedPrice',
      rating: '-rating',
      pickup: 'pickupStart'
    };
    sortBy = sortOptions[sort] || sortBy;
  }
  
  // Execute query
  const offers = await Offer.find(queryObj)
    .sort(sortBy)
    .populate('seller', 'name storeName avatar')
    .populate('store', 'name address city');
  
  res.status(200).json({
    success: true,
    count: offers.length,
    data: offers
  });
});

// @desc    Get similar offers
// @route   GET /api/v1/offers/:id/similar
// @access  Public
exports.getSimilarOffers = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);
  
  if (!offer) {
    return next(
      new ErrorResponse(`No offer found with id ${req.params.id}`, 404)
    );
  }
  
  const similarOffers = await Offer.find({
    _id: { $ne: offer._id },
    category: offer.category,
    isActive: true,
    availableQuantity: { $gt: 0 },
    pickupEnd: { $gt: Date.now() },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: offer.location.coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  })
  .limit(4)
  .populate('seller', 'name storeName avatar')
  .populate('store', 'name address city');
  
  res.status(200).json({
    success: true,
    count: similarOffers.length,
    data: similarOffers
  });
});
