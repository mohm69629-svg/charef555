const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a store name'],
    trim: true,
    maxlength: [100, 'Store name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'restaurant',
      'bakery',
      'cafe',
      'grocery',
      'pastry',
      'butcher',
      'other'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [
      /^(\+213|0)[5-7][0-9]{8}$/,
      'Please add a valid Algerian phone number'
    ]
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
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
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  logo: {
    type: String,
    default: 'default-store-logo.jpg'
  },
  coverImage: {
    type: String,
    default: 'default-cover.jpg'
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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
storeSchema.index({ location: '2dsphere' });

// Reverse populate with virtuals
storeSchema.virtual('offers', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'store',
  justOne: false
});

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'store',
  justOne: false
});

// Cascade delete offers when a store is deleted
storeSchema.pre('remove', async function(next) {
  await this.model('Offer').deleteMany({ store: this._id });
  await this.model('Review').deleteMany({ store: this._id });
  next();
});

// Calculate average rating for the store
storeSchema.statics.getAverageRating = async function(storeId) {
  const obj = await this.aggregate([
    {
      $match: { _id: storeId }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews'
      }
    },
    {
      $unwind: '$reviews'
    },
    {
      $match: { 'reviews.rating': { $gt: 0 } }
    },
    {
      $group: {
        _id: '$_id',
        averageRating: { $avg: '$reviews.rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Store').findByIdAndUpdate(storeId, {
      rating: obj[0] ? obj[0].averageRating : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save or update review
storeSchema.post('save', function() {
  this.constructor.getAverageRating(this._id);
});

// Call getAverageRating before remove
storeSchema.post('remove', function() {
  this.constructor.getAverageRating(this._id);
});

module.exports = mongoose.model('Store', storeSchema);
