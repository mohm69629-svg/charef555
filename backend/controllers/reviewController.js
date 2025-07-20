const Review = require('../models/Review');
const Store = require('../models/Store');
const Offer = require('../models/Offer');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/stores/:storeId/reviews
// @route   GET /api/v1/offers/:offerId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.storeId) {
    const reviews = await Review.find({ store: req.params.storeId })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else if (req.params.offerId) {
    const reviews = await Review.find({ offer: req.params.offerId })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('store', 'name')
    .populate('offer', 'title');

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Add review
// @route   POST /api/v1/stores/:storeId/reviews
// @route   POST /api/v1/offers/:offerId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if the user has made a booking for this store/offer
  if (req.params.storeId) {
    req.body.store = req.params.storeId;
    
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      return next(
        new ErrorResponse(`No store with the id of ${req.params.storeId}`, 404)
      );
    }

    // Check if user has a completed booking with this store
    const booking = await Booking.findOne({
      user: req.user.id,
      store: req.params.storeId,
      status: 'completed'
    });

    if (!booking && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to add a review for this store`,
          401
        )
      );
    }

    // Check if user already reviewed this store
    const existingReview = await Review.findOne({
      user: req.user.id,
      store: req.params.storeId
    });

    if (existingReview) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} has already reviewed this store`,
          400
        )
      );
    }
  } else if (req.params.offerId) {
    req.body.offer = req.params.offerId;
    
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) {
      return next(
        new ErrorResponse(`No offer with the id of ${req.params.offerId}`, 404)
      );
    }

    // Check if user has a completed booking for this offer
    const booking = await Booking.findOne({
      user: req.user.id,
      offer: req.params.offerId,
      status: 'completed'
    });

    if (!booking && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to add a review for this offer`,
          401
        )
      );
    }

    // Check if user already reviewed this offer
    const existingReview = await Review.findOne({
      user: req.user.id,
      offer: req.params.offerId
    });

    if (existingReview) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} has already reviewed this offer`,
          400
        )
      );
    }
  } else {
    return next(
      new ErrorResponse('Please provide a storeId or offerId', 400)
    );
  }

  // Create review
  const review = await Review.create(req.body);

  // If review is for a store, update store's average rating
  if (review.store) {
    await calculateAverageRating(review.store, 'store');
    
    // Notify store owner
    await Notification.create({
      user: review.store.owner,
      title: 'New Review Received',
      message: `You have received a new ${review.rating}-star review for your store`,
      type: 'new_review',
      relatedEntity: {
        entityType: 'review',
        entityId: review._id
      },
      actionUrl: `/stores/${review.store._id}#reviews`,
      priority: 'medium'
    });
  }
  
  // If review is for an offer, update offer's average rating
  if (review.offer) {
    await calculateAverageRating(review.offer, 'offer');
    
    // Get offer with seller info
    const offer = await Offer.findById(review.offer).populate('seller', 'name');
    
    // Notify offer owner
    if (offer && offer.seller) {
      await Notification.create({
        user: offer.seller._id,
        title: 'New Review Received',
        message: `You have received a new ${review.rating}-star review for your offer "${offer.title}"`,
        type: 'new_review',
        relatedEntity: {
          entityType: 'review',
          entityId: review._id
        },
        actionUrl: `/offers/${review.offer._id}#reviews`,
        priority: 'medium'
      });
    }
  }

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this review`,
        401
      )
    );
  }

  // Prevent changing the store/offer being reviewed
  if (req.body.store || req.body.offer) {
    return next(
      new ErrorResponse('Cannot change the store or offer being reviewed', 400)
    );
  }

  // Update review
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Recalculate average rating if rating was updated
  if (req.body.rating) {
    if (review.store) {
      await calculateAverageRating(review.store, 'store');
    }
    if (review.offer) {
      await calculateAverageRating(review.offer, 'offer');
    }
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this review`,
        401
      )
    );
  }

  // Store references before deletion
  const storeId = review.store;
  const offerId = review.offer;

  await review.remove();

  // Recalculate average rating
  if (storeId) {
    await calculateAverageRating(storeId, 'store');
  }
  if (offerId) {
    await calculateAverageRating(offerId, 'offer');
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get reviews by user
// @route   GET /api/v1/users/:userId/reviews
// @access  Public
exports.getUserReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ user: req.params.userId })
    .populate('store', 'name')
    .populate('offer', 'title')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get my reviews
// @route   GET /api/v1/reviews/me
// @access  Private
exports.getMyReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id })
    .populate('store', 'name')
    .populate('offer', 'title')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Get reviews for moderation
// @route   GET /api/v1/reviews/moderation
// @access  Private (Admin, Moderator)
exports.getReviewsForModeration = asyncHandler(async (req, res, next) => {
  // Only admin and moderators can access this
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return next(
      new ErrorResponse('Not authorized to access this route', 403)
    );
  }

  const reviews = await Review.find({
    $or: [
      { isApproved: false },
      { isFlagged: true },
      { adminAttention: true }
    ]
  })
  .populate('user', 'name avatar')
  .populate('store', 'name')
  .populate('offer', 'title')
  .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Moderate review
// @route   PUT /api/v1/reviews/:id/moderate
// @access  Private (Admin, Moderator)
exports.moderateReview = asyncHandler(async (req, res, next) => {
  // Only admin and moderators can access this
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return next(
      new ErrorResponse('Not authorized to access this route', 403)
    );
  }

  const { action, reason, message } = req.body;
  
  if (!['approve', 'reject', 'request_changes'].includes(action)) {
    return next(
      new ErrorResponse('Invalid action. Must be approve, reject, or request_changes', 400)
    );
  }

  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  let update = {};
  let notificationMessage = '';
  
  switch (action) {
    case 'approve':
      update = { 
        isApproved: true, 
        isFlagged: false, 
        adminAttention: false,
        moderationStatus: 'approved',
        moderatedBy: req.user.id,
        moderatedAt: Date.now()
      };
      notificationMessage = 'Your review has been approved and is now visible to the public.';
      break;
      
    case 'reject':
      if (!reason) {
        return next(
          new ErrorResponse('Please provide a reason for rejection', 400)
        );
      }
      update = { 
        isApproved: false, 
        isFlagged: false, 
        adminAttention: false,
        isActive: false,
        moderationStatus: 'rejected',
        moderationReason: reason,
        moderatedBy: req.user.id,
        moderatedAt: Date.now()
      };
      notificationMessage = `Your review has been rejected. Reason: ${reason}`;
      break;
      
    case 'request_changes':
      if (!message) {
        return next(
          new ErrorResponse('Please provide a message to the user', 400)
        );
      }
      update = { 
        adminAttention: true,
        moderationStatus: 'changes_requested',
        moderationMessage: message,
        moderatedBy: req.user.id,
        moderatedAt: Date.now()
      };
      notificationMessage = `The moderator has requested changes to your review. Message: ${message}`;
      break;
  }

  const updatedReview = await Review.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  });

  // Notify the review author
  if (action !== 'approve') {
    await Notification.create({
      user: review.user,
      title: 'Review Update',
      message: notificationMessage,
      type: 'account_alert',
      relatedEntity: {
        entityType: 'review',
        entityId: review._id
      },
      priority: 'medium'
    });
  }

  res.status(200).json({
    success: true,
    data: updatedReview
  });
});

// @desc    Flag review
// @route   POST /api/v1/reviews/:id/flag
// @access  Private
exports.flagReview = asyncHandler(async (req, res, next) => {
  const { reason, comment } = req.body;
  
  if (!reason) {
    return next(
      new ErrorResponse('Please provide a reason for flagging this review', 400)
    );
  }

  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Check if user already flagged this review
  const existingFlag = review.flags.find(
    flag => flag.user.toString() === req.user.id
  );
  
  if (existingFlag) {
    return next(
      new ErrorResponse('You have already flagged this review', 400)
    );
  }

  // Add flag
  review.flags.push({
    user: req.user.id,
    reason,
    comment: comment || '',
    flaggedAt: Date.now()
  });
  
  // Update flag count and check if review needs admin attention
  review.flagCount = review.flags.length;
  if (review.flagCount >= 3) {
    review.adminAttention = true;
    review.isFlagged = true;
  }
  
  await review.save();

  // Notify admins if threshold is reached
  if (review.flagCount >= 3) {
    const admins = await User.find({ role: 'admin' });
    
    await Promise.all(admins.map(admin => 
      Notification.create({
        user: admin._id,
        title: 'Review Flagged',
        message: `A review has been flagged multiple times and requires attention.`,
        type: 'admin_alert',
        relatedEntity: {
          entityType: 'review',
          entityId: review._id
        },
        actionUrl: `/admin/reviews/${review._id}`,
        priority: 'high'
      })
    ));
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// Helper function to calculate average rating
const calculateAverageRating = async (id, type) => {
  try {
    const obj = await (type === 'store' ? Store : Offer).findById(id);
    if (!obj) return;

    const stats = await Review.aggregate([
      {
        $match: { [type]: id, isApproved: true }
      },
      {
        $group: {
          _id: `$${type}`,
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    if (stats.length > 0) {
      obj.rating = stats[0].avgRating;
      obj.ratingCount = stats[0].nRating;
    } else {
      obj.rating = 0;
      obj.ratingCount = 0;
    }

    await obj.save();
  } catch (err) {
    console.error(`Error calculating average rating for ${type} ${id}:`, err);
  }
};
