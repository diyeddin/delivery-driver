import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Power, MapPin, DollarSign, LogOut } from 'lucide-react-native';
import { useDriverStore } from '../store/driverStore';
import { useAuth } from '../context/AuthContext';
import { WS_HOST } from '../api/client';
import OrderRequestModal from '../components/OrderRequestModal';

export default function HomeScreen() {
  const { 
    status, 
    setStatus, 
    setLocation, 
    isConnecting, 
    setConnecting, 
    setIncomingOrder 
  } = useDriverStore();
  
  const { user, token, logout } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  const isOnline = status === 'online';

  // ─── 1. WEBSOCKET LOGIC ─────────────────────────────
  useEffect(() => {
    if (status === 'online' && token) {
      console.log("🔌 Connecting to Driver WebSocket...");
      
      const protocol = WS_HOST?.includes('://') ? '' : 'ws://';
      const wsUrl = `${protocol}${WS_HOST}/api/v1/drivers/ws?token=${token}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log("✅ Driver WS Connected");
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 WS Message:", data);

          if (data.type === 'new_order') {
            setIncomingOrder(data.order);
            // TODO: Play sound here
          }
        } catch (e) {
          console.error("WS Parse Error", e);
        }
      };

      ws.onerror = (e) => {
        console.log("❌ WS Error", (e as any).message);
      };

      ws.onclose = () => {
        console.log("🔌 Driver WS Closed");
      };
    } else {
      wsRef.current?.close();
      wsRef.current = null;
    }

    return () => {
      wsRef.current?.close();
    };
  }, [status, token]);

  // ─── 2. TOGGLE ONLINE/OFFLINE ───────────────────────
  const toggleOnline = async () => {
    if (isOnline) {
      // Go Offline
      setLocation({ latitude: 0, longitude: 0, heading: 0 });
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

      // 2. Get Real Location directly
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading ?? 0,
      });

      setStatus('online');

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

      <OrderRequestModal />
    </SafeAreaView>
  );
}