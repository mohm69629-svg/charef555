import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import * as Notifications from 'expo-notifications';

// Default user permissions based on role
const DEFAULT_PERMISSIONS = {
  admin: {
    canViewDashboard: true,
    canManageUsers: true,
    canManageOffers: true,
    canManageOrders: true,
    canViewReports: true,
  },
  seller: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageOffers: true,
    canManageOrders: true,
    canViewReports: false,
  },
  user: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageOffers: false,
    canManageOrders: false,
    canViewReports: false,
  },
  guest: {
    canViewDashboard: false,
    canManageUsers: false,
    canManageOffers: false,
    canManageOrders: false,
    canViewReports: false,
  },
};

// Helper function to get user permissions
const getUserPermissions = (role) => {
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.guest;
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS.guest);
  const [refreshToken, setRefreshToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  // Set up axios response interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await refreshAuthToken();
            if (newToken) {
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log the user out
            await logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const [storedToken, storedUser, storedRefreshToken, storedExpiry] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('refreshToken'),
          AsyncStorage.getItem('tokenExpiry')
        ]);
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          setRefreshToken(storedRefreshToken);
          setTokenExpiry(storedExpiry ? new Date(storedExpiry) : null);
          
          // Set user permissions based on role
          setPermissions(getUserPermissions(userData.role));
          
          // Set the default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Setup push notifications for the user
          await setupPushNotifications(userData._id);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);
  
  // Setup token refresh timer
  useEffect(() => {
    if (!tokenExpiry) return;
    
    // Calculate time until token expires (5 minutes before actual expiry)
    const timeUntilExpiry = tokenExpiry.getTime() - Date.now() - (5 * 60 * 1000);
    
    if (timeUntilExpiry > 0) {
      const timer = setTimeout(() => {
        refreshAuthToken();
      }, timeUntilExpiry);
      
      return () => clearTimeout(timer);
    }
  }, [tokenExpiry]);

  // Setup push notifications for the user
  const setupPushNotifications = async (userId) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Save the push token to the user's profile
      await axios.post(`${API_URL}/users/${userId}/push-token`, { token }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // Refresh authentication token
  const refreshAuthToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken
      });
      
      const { token: newToken, refreshToken: newRefreshToken, expiresIn } = response.data;
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      
      // Update AsyncStorage
      await AsyncStorage.multiSet([
        ['token', newToken],
        ['refreshToken', newRefreshToken],
        ['tokenExpiry', expiryDate.toISOString()]
      ]);
      
      // Update state
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setTokenExpiry(expiryDate);
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      return null;
    }
  };
  
  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    return permissions[permission] === true;
  }, [user, permissions]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password 
      });
      
      const { token, refreshToken, user, expiresIn } = response.data;
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      
      // Save to AsyncStorage
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(user)],
        ['refreshToken', refreshToken],
        ['tokenExpiry', expiryDate.toISOString()]
      ]);
      
      // Update state
      setToken(token);
      setUser(user);
      setRefreshToken(refreshToken);
      setTokenExpiry(expiryDate);
      setPermissions(getUserPermissions(user.role));
      
      // Set the default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Setup push notifications
      await setupPushNotifications(user._id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, refreshToken, user, expiresIn } = response.data;
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      
      // Save to AsyncStorage
      await AsyncStorage.multiSet([
        ['token', token],
        ['user', JSON.stringify(user)],
        ['refreshToken', refreshToken],
        ['tokenExpiry', expiryDate.toISOString()]
      ]);
      
      // Update state
      setToken(token);
      setUser(user);
      setRefreshToken(refreshToken);
      setTokenExpiry(expiryDate);
      setPermissions(getUserPermissions(user.role));
      
      // Set the default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Setup push notifications
      await setupPushNotifications(user._id);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/me`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, ...response.data };
      
      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile. Please try again.'
      };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post(
        `${API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to change password. Please try again.'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear push notification token from server if user is logged in
      if (user?._id) {
        try {
          const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
          await axios.delete(`${API_URL}/users/${user._id}/push-token/${pushToken}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Error clearing push token:', error);
        }
      }
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['token', 'user', 'refreshToken', 'tokenExpiry']);
      
      // Update state
      setToken(null);
      setUser(null);
      setRefreshToken(null);
      setTokenExpiry(null);
      setPermissions(DEFAULT_PERMISSIONS.guest);
      
      // Remove auth header
      delete axios.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        message: 'An error occurred during logout. Please try again.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        permissions,
        hasPermission,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
