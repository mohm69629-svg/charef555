// API Configuration
export const API_URL = 'http://YOUR_BACKEND_URL/api'; // Replace with your actual backend URL

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your actual Google Maps API key

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'FoodSaver DZ',
  APP_DESCRIPTION: 'Fight food waste in Algeria by connecting restaurants with customers',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'ar', // Default to Arabic
  SUPPORTED_LANGUAGES: [
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' }
  ],
  MAP_DEFAULTS: {
    LATITUDE: 36.7372, // Default to Algiers coordinates
    LONGITUDE: 3.0870,
    LATITUDE_DELTA: 0.0922,
    LONGITUDE_DELTA: 0.0421,
  },
  CURRENCY: 'DZD',
};

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPDATE_PASSWORD: '/users/update-password',
  },
  OFFERS: {
    BASE: '/offers',
    NEARBY: '/offers/nearby',
    FEATURED: '/offers/featured',
    SEARCH: '/offers/search',
  },
  BOOKINGS: {
    BASE: '/bookings',
    MY_BOOKINGS: '/bookings/my-bookings',
    CANCEL: '/bookings/cancel',
  },
  RATINGS: {
    BASE: '/ratings',
    SELLER: '/ratings/seller',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  LANGUAGE: 'language',
  FCM_TOKEN: 'fcmToken',
};

// Validation Patterns
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+213|0)[5-7][0-9]{8}$/, // Algerian phone numbers
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid Algerian phone number.',
  PASSWORD_TOO_WEAK: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
};
