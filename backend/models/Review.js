const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Review must belong to a store']
  },
  offer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Offer',
    required: [true, 'Review must belong to an offer']
  },
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: [true, 'Review must be associated with a booking']
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  images: [{
    type: String
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  deletedReason: String,
  adminNotes: String,
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  metadata: {
    device: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate reviews from the same user for the same booking
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

// Query middleware to populate references
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name avatar'
  }).populate({
    path: 'response.respondedBy',
    select: 'name role'
  });
  
  next();
});

// Static method to get average rating and count
reviewSchema.statics.calcAverageRatings = async function(storeId) {
  const stats = await this.aggregate([
    {
      $match: { 
        store: storeId,
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$store',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.model('Store').findByIdAndUpdate(storeId, {
      rating: stats[0].avgRating,
      ratingCount: stats[0].nRating
    });
  } else {
    await this.model('Store').findByIdAndUpdate(storeId, {
      rating: 0,
      ratingCount: 0
    });
  }
};

// Call calcAverageRatings after save
reviewSchema.post('save', async function() {
  // this points to current review
  await this.constructor.calcAverageRatings(this.store);
});

// Call calcAverageRatings after update or delete
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.store);
  }
});

// Add a virtual field to check if review has a response
reviewSchema.virtual('hasResponse').get(function() {
  return !!(this.response && this.response.text);
});

// Add a virtual field for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static method to get review stats
reviewSchema.statics.getReviewStats = async function(storeId) {
  const stats = await this.aggregate([
    {
      $match: { 
        store: storeId,
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        fiveStar: {
          $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
        },
        fourStar: {
          $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
        },
        threeStar: {
          $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
        },
        twoStar: {
          $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
        },
        oneStar: {
          $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
        },
        withComments: {
          $sum: { $cond: [{ $ifNull: ['$comment', false] }, 1, 0] }
        },
        withImages: {
          $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || null;
};

module.exports = mongoose.model('Review', reviewSchema);
