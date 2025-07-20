import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dashboard Statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Recent Orders
export const getRecentOrders = async (limit = 5) => {
  try {
    const response = await api.get(`/orders/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
};

// Recent Users
export const getRecentUsers = async (limit = 5) => {
  try {
    const response = await api.get(`/users/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent users:', error);
    throw error;
  }
};

// Get all users with pagination
export const getAllUsers = async (page = 1, limit = 10, role = '') => {
  try {
    const response = await api.get(`/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get all orders with filters
export const getAllOrders = async (filters = {}) => {
  try {
    const queryString = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const response = await api.get(`/orders?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Get order details
export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Get user details
export const getUserDetails = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (userId, isActive) => {
  try {
    const response = await api.patch(`/users/${userId}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Get system settings
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

// Update system settings
export const updateSystemSettings = async (settings) => {
  try {
    const response = await api.put('/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getRecentOrders,
  getRecentUsers,
  getAllUsers,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getUserDetails,
  updateUserStatus,
  getSystemSettings,
  updateSystemSettings,
};
