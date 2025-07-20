const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  offer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Offer',
    required: [true, 'Booking must belong to an offer']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must have a seller']
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify the quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Booking must have a total price']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'expired', 'rejected'],
    default: 'pending'
  },
  pickupCode: {
    type: String,
    required: [true, 'Booking must have a pickup code']
  },
  pickupTime: {
    type: Date,
    required: [true, 'Please specify the pickup time']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  review: {
    type: String,
    maxlength: [500, 'Review cannot be more than 500 characters']
  },
  reviewedAt: Date,
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['user', 'seller', 'system']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet', 'other'],
    default: 'cash'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ offer: 1, user: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ seller: 1, status: 1 });
bookingSchema.index({ pickupCode: 1 }, { unique: true });

// Static method to generate a unique pickup code
bookingSchema.statics.generatePickupCode = async function() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let isUnique = false;
  
  while (!isUnique) {
    // Generate a 6-character code
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if code already exists
    const existingBooking = await this.findOne({ pickupCode: code });
    if (!existingBooking) {
      isUnique = true;
    } else {
      code = ''; // Reset code if not unique
    }
  }
  
  return code;
};

// Middleware to update offer's available quantity when booking is created
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Update offer's available quantity
    await this.model('Offer').findByIdAndUpdate(
      this.offer,
      { $inc: { availableQuantity: -this.quantity } }
    );
  }
  
  // If booking is being cancelled, return the quantity to available
  if (this.isModified('status') && this.status === 'cancelled') {
    await this.model('Offer').findByIdAndUpdate(
      this.offer,
      { $inc: { availableQuantity: this.quantity } }
    );
  }
  
  next();
});

// Middleware to handle booking completion
bookingSchema.post('save', async function(doc) {
  // If booking is completed and has a rating, update the offer's average rating
  if (doc.status === 'completed' && doc.rating) {
    await this.model('Offer').getAverageRating(doc.offer);
  }
});

// Query middleware to populate references
const populateReferences = function(next) {
  this.populate({
    path: 'offer',
    select: 'title images originalPrice discountedPrice pickupStart pickupEnd'
  }).populate({
    path: 'user',
    select: 'name email phone'
  }).populate({
    path: 'seller',
    select: 'name storeName phone'
  });
  
  next();
};

bookingSchema.pre(/^find/, populateReferences);

module.exports = mongoose.model('Booking', bookingSchema);
