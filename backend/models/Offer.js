const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please add the original price'],
    min: [0, 'Price cannot be negative']
  },
  discountedPrice: {
    type: Number,
    required: [true, 'Please add the discounted price'],
    validate: {
      validator: function(value) {
        return value < this.originalPrice;
      },
      message: 'Discounted price must be less than original price'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Please add the available quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  availableQuantity: {
    type: Number,
    default: function() {
      return this.quantity;
    }
  },
  pickupStart: {
    type: Date,
    required: [true, 'Please add a pickup start time']
  },
  pickupEnd: {
    type: Date,
    required: [true, 'Please add a pickup end time'],
    validate: {
      validator: function(value) {
        return value > this.pickupStart;
      },
      message: 'Pickup end time must be after pickup start time'
    }
  },
  images: [{
    type: String,
    required: [true, 'Please add at least one image']
  }],
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'bakery',
      'restaurant',
      'cafe',
      'grocery',
      'pastry',
      'butcher',
      'other'
    ]
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: true
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
offerSchema.index({ location: '2dsphere' });

// Reverse populate with virtuals
offerSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'offer',
  justOne: false
});

// Cascade delete bookings when an offer is deleted
offerSchema.pre('remove', async function(next) {
  await this.model('Booking').deleteMany({ offer: this._id });
  next();
});

// Static method to get average rating and save
offerSchema.statics.getAverageRating = async function(offerId) {
  const obj = await this.aggregate([
    {
      $match: { _id: offerId }
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
      $unwind: '$bookings'
    },
    {
      $match: { 'bookings.rating': { $gt: 0 } }
    },
    {
      $group: {
        _id: '$_id',
        averageRating: { $avg: '$bookings.rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Offer').findByIdAndUpdate(offerId, {
      rating: obj[0] ? obj[0].averageRating : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save or update booking
offerSchema.post('save', function() {
  this.constructor.getAverageRating(this._id);
});

// Call getAverageRating before remove
offerSchema.post('remove', function() {
  this.constructor.getAverageRating(this._id);
});

module.exports = mongoose.model('Offer', offerSchema);
