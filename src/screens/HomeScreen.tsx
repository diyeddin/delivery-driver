import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Power, MapPin, DollarSign, LogOut } from 'lucide-react-native';
import { useDriverStore } from '../store/driverStore';
import { useAuth } from '../context/AuthContext';
import { WS_HOST, WS_PROTOCOL } from '../api/client';

export default function HomeScreen() {
  const {
    status,
    setStatus,
    setLocation,
    isConnecting,
    setConnecting,
    setIncomingOrder,
    checkForActiveOrders
  } = useDriverStore();

  const { user, token, logout } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);

  const isOnline = status === 'online';

  // ─── 1. WEBSOCKET LOGIC (with reconnection & heartbeat) ─────
  useEffect(() => {
    if (status !== 'online' || !token) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let reconnectAttempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) return;

      const wsUrl = `${WS_PROTOCOL}://${WS_HOST}/api/v1/drivers/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;

        // Heartbeat every 25s — backend responds with "pong"
        heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        // Ignore pong responses
        if (event.data === 'pong') return;

        try {
          const data = JSON.parse(event.data);

          if (data.type === 'new_order') {
            setIncomingOrder(data.order);
          }
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (isCancelled) return;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      wsRef.current?.close();
      locationWatcherRef.current?.remove();
    };
  }, [status, token]);

  // ─── 2. TOGGLE ONLINE/OFFLINE ───────────────────────
  const stopLocationWatcher = () => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
      locationWatcherRef.current = null;
    }
  };

  const toggleOnline = async () => {
    if (isOnline) {
      // Go Offline
      stopLocationWatcher();
      setLocation(null);
      setStatus('offline');
      return;
    }

    setConnecting(true);
    try {
      // 1. Ask for Permission
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert('Permission Denied', 'We need your location to assign orders.');
        setConnecting(false);
        return;
      }

      // 2. Start continuous location tracking
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 50, timeInterval: 10000 },
        (loc) => {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading ?? 0,
          };
          setLocation(coords);

          // Send to backend via WebSocket
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'location_update',
              latitude: coords.latitude,
              longitude: coords.longitude,
            }));
          }
        }
      );
      locationWatcherRef.current = subscription;

      setStatus('online');
      checkForActiveOrders();

    } catch (error) {
      console.error(error);
      Alert.alert('Location Error', 'Could not access GPS. Please check your settings.');
    } finally {
      setConnecting(false);
    }
  };

  // ─── 3. LOGOUT HANDLER ──────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: 'destructive', 
          onPress: async () => {
            if (isOnline) {
              stopLocationWatcher();
              setStatus('offline');
            }
            await logout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="p-6 bg-white shadow-sm flex-row justify-between items-center z-10">
        <View>
          <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Welcome,</Text>
          <Text className="text-xl font-bold text-gray-900">{user?.name || 'Driver'}</Text>
        </View>

        {/* Right Side: Status + Logout */}
        <View className="flex-row items-center space-x-3 gap-3">
            <View className={`px-3 py-1 rounded-full ${isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`font-bold text-xs ${isOnline ? 'text-green-700' : 'text-gray-500'}`}>
                    {status.toUpperCase()}
                </Text>
            </View>
            
            <TouchableOpacity onPress={handleLogout} className="p-2 bg-gray-100 rounded-full">
                <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
      </View>

      {/* Main Action Area */}
      <View className="flex-1 items-center justify-center space-y-8">
        <TouchableOpacity 
          onPress={toggleOnline}
          disabled={isConnecting}
          className={`w-48 h-48 rounded-full items-center justify-center border-8 shadow-xl ${
            isConnecting ? 'bg-gray-100 border-gray-200' :
            isOnline 
              ? 'bg-red-500 border-red-200 shadow-red-500/30' 
              : 'bg-green-500 border-green-200 shadow-green-500/30'
          }`}
        >
          {isConnecting ? (
            <ActivityIndicator size="large" color="#374151" />
          ) : (
            <>
              <Power size={48} color="white" strokeWidth={3} />
              <Text className="text-white font-bold text-xl mt-2">
                {isOnline ? 'STOP' : 'GO'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 font-medium text-center px-10">
          {isOnline 
            ? "You are visible to customers. Keep the app open." 
            : "Go online to start receiving delivery requests."}
        </Text>
      </View>

      {/* Footer Stats */}
      <View className="bg-white p-6 m-4 rounded-2xl shadow-sm flex-row justify-between">
        <View className="items-center flex-1">
          <DollarSign size={20} color="#D4AF37" />
          <Text className="text-lg font-bold text-gray-900">$0.00</Text>
          <Text className="text-xs text-gray-400">Today</Text>
        </View>
        <View className="w-[1px] bg-gray-100" />
        <View className="items-center flex-1">
          <MapPin size={20} color="#D4AF37" />
          <Text className="text-lg font-bold text-gray-900">0</Text>
          <Text className="text-xs text-gray-400">Trips</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}