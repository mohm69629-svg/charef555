const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user']
  },
  title: {
    type: String,
    required: [true, 'Please add a title for the notification'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message for the notification']
  },
  type: {
    type: String,
    required: [true, 'Please specify the notification type'],
    enum: [
      'booking_created',
      'booking_confirmed',
      'booking_cancelled',
      'booking_completed',
      'offer_expired',
      'new_offer',
      'new_review',
      'promotion',
      'system_update',
      'account_alert',
      'payment_received',
      'payment_failed',
      'announcement',
      'other'
    ]
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['booking', 'offer', 'store', 'user', 'review', 'payment', 'system']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityType'
    }
  },
  actionUrl: {
    type: String,
    description: 'URL to navigate when notification is clicked'
  },
  image: {
    type: String,
    description: 'Optional image URL for the notification'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create a notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = await this.create(notificationData);
    
    // Emit real-time notification using Socket.IO if available
    if (process.io && notification.user) {
      process.io.to(`user_${notification.user}`).emit('new_notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds },
      user: userId,
      isRead: false
    },
    { 
      $set: { 
        isRead: true,
        readAt: Date.now()
      } 
    }
  );
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ 
    user: userId, 
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Query middleware to filter out expired notifications
notificationSchema.pre(/^find/, function(next) {
  this.find({
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Virtual for formatted date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save hook to set default expiration if not set
notificationSchema.pre('save', function(next) {
  // Set default expiration to 30 days from now if not set
  if (!this.expiresAt) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    this.expiresAt = thirtyDaysFromNow;
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
