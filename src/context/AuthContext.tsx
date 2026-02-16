import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';
import { authInterceptor } from '../api/client';
import { usersApi } from '../api/users'; 
import { User } from '../types';
import Toast from 'react-native-toast-message';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await storage.removeToken();
  }, []);

  // Interceptor setup
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  useEffect(() => {
    authInterceptor.setup(() => {
      logoutRef.current();
      Toast.show({ type: 'error', text1: 'Session Expired', text2: 'Please log in again.' });
    });
    return () => authInterceptor.teardown();
  }, []);

  // Initial Load
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await storage.getToken();
        if (storedToken) {
          const decoded = jwtDecode<User>(storedToken);
          // Check Expiry
          if (decoded.exp && decoded.exp < (Date.now() / 1000)) {
            await logout();
          } 
          // Check Role (Security)
          else if (decoded.role !== 'driver' && decoded.role !== 'admin') {
            Alert.alert('Access Denied', 'This app is for Drivers only.');
            await logout();
          } else {
            setToken(storedToken);
            setUser(decoded);
          }
        }
      } catch (e) {
        await logout();
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, [logout]);

  // Push Token Logic
  const registerPushToken = async () => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      
      // Send to backend
      await usersApi.registerPushToken(tokenData.data);
    } catch (error) {
      console.log('Push token error:', error);
    }
  };

  const login = async (newToken: string) => {
    try {
      const decoded = jwtDecode<User>(newToken);
      
      if (decoded.role !== 'driver' && decoded.role !== 'admin') {
        Alert.alert('Access Denied', 'This account is not a driver account.');
        return;
      }

      setToken(newToken);
      setUser(decoded);
      await storage.setToken(newToken);
      
      // Register push token silently after login
      setTimeout(() => registerPushToken(), 2000);

    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};