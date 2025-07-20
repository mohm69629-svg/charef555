const Store = require('../models/Store');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path');

// @desc    Get all stores
// @route   GET /api/v1/stores
// @access  Public
exports.getStores = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get nearby stores
// @route   GET /api/v1/stores/radius/:zipcode/:distance/:unit?
// @access  Public
exports.getStoresInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance, unit = 'km' } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const stores = await Store.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    isActive: true
  });

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores
  });
});

// @desc    Get single store
// @route   GET /api/v1/stores/:id
// @access  Public
exports.getStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id)
    .populate('owner', 'name email phone avatar')
    .populate({
      path: 'reviews',
      select: 'rating comment user',
      populate: {
        path: 'user',
        select: 'name avatar'
      },
      options: { 
        sort: { createdAt: -1 },
        limit: 5
      }
    });

  if (!store) {
    return next(
      new ErrorResponse(`Store not found with id of ${req.params.id}`, 404)
    );
  }

  // Get active offers count
  const activeOffers = await Offer.countDocuments({
    store: store._id,
    isActive: true,
    availableQuantity: { $gt: 0 },
    pickupEnd: { $gt: Date.now() }
  });

  // Calculate average rating from reviews
  const [stats] = await Review.aggregate([
    {
      $match: { store: store._id }
    },
    {
      $group: {
        _id: '$store',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  // Add additional data to the store object
  const storeWithStats = {
    ...store.toObject(),
    stats: stats || { averageRating: 0, totalRatings: 0 },
    activeOffers
  };

  res.status(200).json({
    success: true,
    data: storeWithStats
  });
});

// @desc    Create new store
// @route   POST /api/v1/stores
// @access  Private (Admin, Seller)
exports.createStore = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.owner = req.user.id;

  // Check for published store
  const publishedStore = await Store.findOne({ owner: req.user.id });

  // If the user is not an admin, they can only add one store
  if (publishedStore && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a store`,
        400
      )
    );
  }

  // Create store
  const store = await Store.create(req.body);

  // Update user role to seller if not already
  if (req.user.role === 'user') {
    await User.findByIdAndUpdate(req.user.id, { role: 'seller' });
  }

  res.status(201).json({
    success: true,
    data: store
  });
});

// @desc    Update store
// @route   PUT /api/v1/stores/:id
// @access  Private (Store Owner, Admin)
exports.updateStore = asyncHandler(async (req, res, next) => {
  let store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorResponse(`No store with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is store owner or admin
  if (
    store.owner.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this store`,
        401
      )
    );
  }

  // If location is being updated, update the GeoJSON point
  if (req.body.address || req.body.city) {
    // Get address data from the store or request body
    const address = req.body.address || store.address;
    const city = req.body.city || store.city;
    const country = req.body.country || store.country || 'Algeria';
    
    // Geocode the address
    const loc = await geocoder.geocode(`${address}, ${city}, ${country}`);
    
    // Update location fields
    req.body.location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude],
      formattedAddress: loc[0].formattedAddress,
      street: loc[0].streetName || '',
      city: loc[0].city || city,
      state: loc[0].stateCode || '',
      zipcode: loc[0].zipcode || '',
      country: loc[0].countryCode || ''
    };
  }

  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: store });
});

// @desc    Delete store
// @route   DELETE /api/v1/stores/:id
// @access  Private (Store Owner, Admin)
exports.deleteStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorResponse(`No store with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is store owner or admin
  if (
    store.owner.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this store`,
        401
      )
    );
  }

  // Prevent deletion if there are active offers
  const activeOffers = await Offer.countDocuments({
    store: store._id,
    isActive: true,
    pickupEnd: { $gt: Date.now() }
  });

  if (activeOffers > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete store with ${activeOffers} active offers. Please deactivate or delete the offers first.`,
        400
      )
    );
  }

  // Deactivate instead of deleting to preserve history
  store.isActive = false;
  await store.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload photo for store
// @route   PUT /api/v1/stores/:id/photo
// @access  Private (Store Owner, Admin)
exports.storePhotoUpload = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorResponse(`Store not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is store owner or admin
  if (
    store.owner.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this store`,
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
  file.name = `photo_${store._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/stores/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Store.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Get stores by category
// @route   GET /api/v1/stores/category/:category
// @access  Public
exports.getStoresByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const stores = await Store.find({
    category: { $in: [new RegExp(category, 'i')] },
    isActive: true
  })
  .skip((page - 1) * limit)
  .limit(parseInt(limit))
  .populate('owner', 'name avatar');
  
  const total = await Store.countDocuments({
    category: { $in: [new RegExp(category, 'i')] },
    isActive: true
  });
  
  res.status(200).json({
    success: true,
    count: stores.length,
    total,
    data: stores
  });
});

// @desc    Get stores by owner
// @route   GET /api/v1/stores/owner/:ownerId
// @access  Public
exports.getStoresByOwner = asyncHandler(async (req, res, next) => {
  const stores = await Store.find({
    owner: req.params.ownerId,
    isActive: true
  });
  
  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores
  });
});

// @desc    Get store statistics
// @route   GET /api/v1/stores/:id/stats
// @access  Private (Store Owner, Admin)
exports.getStoreStats = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  
  if (!store) {
    return next(
      new ErrorResponse(`No store found with id ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is store owner or admin
  if (
    store.owner.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these stats`,
        401
      )
    );
  }
  
  // Get total offers
  const totalOffers = await Offer.countDocuments({ store: store._id });
  
  // Get active offers
  const activeOffers = await Offer.countDocuments({
    store: store._id,
    isActive: true,
    availableQuantity: { $gt: 0 },
    pickupEnd: { $gt: Date.now() }
  });
  
  // Get total bookings
  const totalBookings = await Booking.countDocuments({ store: store._id });
  
  // Get completed bookings
  const completedBookings = await Booking.countDocuments({
    store: store._id,
    status: 'completed'
  });
  
  // Get monthly bookings
  const monthlyBookings = await Booking.aggregate([
    {
      $match: {
        store: store._id,
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
  
  // Get average rating
  const [ratingStats] = await Review.aggregate([
    {
      $match: { store: store._id }
    },
    {
      $group: {
        _id: '$store',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratings: {
          $push: {
            rating: '$rating',
            comment: '$comment',
            user: '$user',
            createdAt: '$createdAt'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'ratings.user',
        foreignField: '_id',
        as: 'userDetails'
      }
    }
  ]);
  
  // Get top selling offers
  const topSellingOffers = await Offer.aggregate([
    {
      $match: { store: store._id }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'offer',
        as: 'bookings'
      }
    },
    {
      $addFields: {
        bookingsCount: { $size: '$bookings' },
        totalRevenue: {
          $reduce: {
            input: '$bookings',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.totalPrice'] }
          }
        }
      }
    },
    {
      $sort: { bookingsCount: -1 }
    },
    {
      $limit: 5
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalOffers,
      activeOffers,
      totalBookings,
      completedBookings,
      monthlyBookings,
      ratingStats: ratingStats || { averageRating: 0, totalRatings: 0, ratings: [] },
      topSellingOffers
    }
  });
});

// @desc    Search stores
// @route   GET /api/v1/stores/search
// @access  Public
exports.searchStores = asyncHandler(async (req, res, next) => {
  const { q, category, city, sort, page = 1, limit = 10 } = req.query;
  
  // Build query
  const query = { isActive: true };
  
  // Search by keyword
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { 'cuisines': { $regex: q, $options: 'i' } },
      { 'address': { $regex: q, $options: 'i' } },
      { 'city': { $regex: q, $options: 'i' } }
    ];
  }
  
  // Filter by category
  if (category) {
    query.category = { $in: category.split(',') };
  }
  
  // Filter by city
  if (city) {
    query.city = { $regex: city, $options: 'i' };
  }
  
  // Build sort
  let sortBy = '-createdAt';
  if (sort === 'rating') sortBy = '-averageRating';
  if (sort === 'newest') sortBy = '-createdAt';
  if (sort === 'name') sortBy = 'name';
  
  // Execute query
  const stores = await Store.find(query)
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('owner', 'name avatar');
    
  const total = await Store.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: stores.length,
    total,
    data: stores
  });
});
