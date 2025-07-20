const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all notifications for current user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const query = { user: req.user.id };
  
  // Filter by read status if provided
  if (isRead === 'true' || isRead === 'false') {
    query.isRead = isRead === 'true';
  }
  
  // Get notifications with pagination
  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  // Get total count for pagination
  const total = await Notification.countDocuments(query);
  
  // Get unread count
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    isRead: false 
  });
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    data: notifications
  });
});

// @desc    Get single notification
// @route   GET /api/v1/notifications/:id
// @access  Private
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!notification) {
    return next(
      new ErrorResponse(`No notification found with id ${req.params.id}`, 404)
    );
  }
  
  // Mark as read when fetched
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();
  }
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark notifications as read
// @route   PUT /api/v1/notifications/mark-read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { notificationIds } = req.body;
  
  if (!notificationIds || !Array.isArray(notificationIds)) {
    return next(
      new ErrorResponse('Please provide an array of notification IDs', 400)
    );
  }
  
  const result = await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      user: req.user.id,
      isRead: false
    },
    {
      $set: { 
        isRead: true,
        readAt: Date.now()
      }
    }
  );
  
  // Get updated unread count
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    isRead: false 
  });
  
  res.status(200).json({
    success: true,
    data: {
      modifiedCount: result.nModified,
      unreadCount
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  const result = await Notification.updateMany(
    {
      user: req.user.id,
      isRead: false
    },
    {
      $set: { 
        isRead: true,
        readAt: Date.now()
      }
    }
  );
  
  res.status(200).json({
    success: true,
    data: {
      modifiedCount: result.nModified,
      unreadCount: 0
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!notification) {
    return next(
      new ErrorResponse(`No notification found with id ${req.params.id}`, 404)
    );
  }
  
  // Get updated unread count
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    isRead: false 
  });
  
  res.status(200).json({
    success: true,
    data: {},
    unreadCount
  });
});

// @desc    Clear all notifications
// @route   DELETE /api/v1/notifications
// @access  Private
exports.clearNotifications = asyncHandler(async (req, res, next) => {
  // Optional: Archive notifications instead of deleting
  if (process.env.NODE_ENV === 'production') {
    // In production, we might want to archive notifications instead of deleting
    await Notification.updateMany(
      { user: req.user.id },
      { $set: { archived: true } }
    );
  } else {
    // In development, we can delete them
    await Notification.deleteMany({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get notification preferences
// @route   GET /api/v1/notifications/preferences
// @access  Private
exports.getNotificationPreferences = asyncHandler(async (req, res, next) => {
  // This would typically come from the user's profile or settings
  // For now, return default preferences
  const defaultPreferences = {
    email: {
      bookingUpdates: true,
      newOffers: true,
      promotions: true,
      accountAlerts: true
    },
    push: {
      bookingUpdates: true,
      newOffers: true,
      promotions: false,
      accountAlerts: true
    },
    sms: {
      bookingUpdates: true,
      newOffers: false,
      promotions: false,
      accountAlerts: true
    }
  };
  
  res.status(200).json({
    success: true,
    data: defaultPreferences
  });
});

// @desc    Update notification preferences
// @route   PUT /api/v1/notifications/preferences
// @access  Private
exports.updateNotificationPreferences = asyncHandler(async (req, res, next) => {
  // In a real app, this would update the user's preferences in the database
  // For now, just return the updated preferences
  
  res.status(200).json({
    success: true,
    data: req.body
  });
});

// @desc    Get unread notifications count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({ 
    user: req.user.id, 
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: { count }
  });
});

// @desc    Get latest notifications (for badge count)
// @route   GET /api/v1/notifications/latest
// @access  Private
exports.getLatestNotifications = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 5;
  
  const notifications = await Notification.find({
    user: req.user.id,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort('-createdAt')
  .limit(limit)
  .select('title message type isRead createdAt');
  
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount
    }
  });
});

// @desc    Create a test notification (for development only)
// @route   POST /api/v1/notifications/test
// @access  Private
exports.createTestNotification = asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next(new ErrorResponse('This route is not available in production', 403));
  }
  
  const { type = 'test', title = 'Test Notification', message = 'This is a test notification' } = req.body;
  
  const notification = await Notification.create({
    user: req.user.id,
    title,
    message,
    type,
    relatedEntity: {
      entityType: 'test',
      entityId: req.user.id
    },
    priority: 'medium'
  });
  
  res.status(201).json({
    success: true,
    data: notification
  });
});
