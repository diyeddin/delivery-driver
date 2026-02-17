import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Store, Navigation, Phone, MessageSquare, ArrowLeft } from 'lucide-react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useDriverStore } from '../store/driverStore';
import { driverApi } from '../api/drivers';
import { RootStackParamList } from '../types';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

export default function DeliveryScreen() {
  const mapRef = useRef<MapView>(null);
  const route = useRoute<RouteProp<RootStackParamList, 'Delivery'>>();
  const navigation = useNavigation();
  const { orderId } = route.params;

  const { activeOrders, updateActiveOrder, removeActiveOrder, location } = useDriverStore();
  const activeOrder = activeOrders.find(o => o.id === orderId);
  const [loading, setLoading] = useState(false);

  // If order was removed (e.g. completed elsewhere), go back
  useEffect(() => {
    if (!activeOrder) {
      navigation.goBack();
    }
  }, [activeOrder, navigation]);

  // ─── 1. COORDINATE LOGIC ─────────────────────────────
  const driverCoords = {
    latitude: location?.latitude || 33.5138,
    longitude: location?.longitude || 36.2765,
  };

  const storeCoords = {
    latitude: activeOrder?.store?.latitude || driverCoords.latitude + 0.01,
    longitude: activeOrder?.store?.longitude || driverCoords.longitude + 0.005,
  };

  const customerCoords = {
    latitude: activeOrder?.delivery_latitude || driverCoords.latitude - 0.01,
    longitude: activeOrder?.delivery_longitude || driverCoords.longitude + 0.01,
  };

  // ─── 2. MAP EFFECTS ──────────────────────────────────
  useEffect(() => {
    if (mapRef.current && location && activeOrder) {
      mapRef.current.fitToCoordinates([driverCoords, storeCoords, customerCoords], {
        edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
        animated: true,
      });
    }
  }, [activeOrder]);

  if (!activeOrder) return null;

  // ─── 3. ACTION HANDLERS ──────────────────────────────
  const handleOpenMaps = () => {
    const destLat = activeOrder.status === 'assigned' ? storeCoords.latitude : customerCoords.latitude;
    const destLng = activeOrder.status === 'assigned' ? storeCoords.longitude : customerCoords.longitude;
    const label = activeOrder.status === 'assigned' ? activeOrder.store?.name : "Customer";

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${destLat},${destLng}`,
      android: `geo:0,0?q=${destLat},${destLng}(${label})`,
    });
    Linking.openURL(url || "");
  };

  const handleUpdateStatus = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      const nextStatus = activeOrder.status === 'assigned' ? 'picked_up' : 'delivered';

      const updatedOrder = await driverApi.updateStatus(activeOrder.id, nextStatus);

      if (nextStatus === 'delivered') {
        Alert.alert("Delivery Complete", "Great job! You earned $" + activeOrder.total_price);
        removeActiveOrder(activeOrder.id);
        navigation.goBack();
      } else {
        updateActiveOrder(updatedOrder);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = activeOrder.status === 'assigned' ? "Pick up order" : "Deliver order";
  const stepSubtitle = activeOrder.status === 'assigned' ? activeOrder.store?.name : "Customer";
  const buttonText = activeOrder.status === 'assigned' ? "CONFIRM PICKUP" : "COMPLETE DELIVERY";
  const buttonColor = activeOrder.status === 'assigned' ? "bg-blue-600" : "bg-green-600";

  return (
    <View className="flex-1 bg-white">

      {/* ─── MAP VIEW ────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...driverCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Store Marker */}
        <Marker coordinate={storeCoords} title={activeOrder.store?.name} description="Pick up here">
          <View className="bg-white p-2 rounded-full border border-blue-500 shadow-sm">
            <Store size={20} color="#3B82F6" />
          </View>
        </Marker>

        {/* Customer Marker */}
        <Marker coordinate={customerCoords} title="Customer" description="Drop off here">
          <View className="bg-white p-2 rounded-full border border-green-500 shadow-sm">
            <MapPin size={20} color="#22C55E" />
          </View>
        </Marker>

        {/* Route Line */}
        <Polyline
          coordinates={[driverCoords, storeCoords, customerCoords]}
          strokeColor="#000"
          strokeWidth={3}
          lineDashPattern={[1]}
        />
      </MapView>

      {/* ─── FLOATING TOP HEADER ─────────────────────── */}
      <SafeAreaView className="absolute top-0 w-full flex-row justify-between items-center px-4" pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-white p-2.5 rounded-full shadow-md"
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="bg-white px-4 py-2 rounded-full shadow-md">
           <Text className="font-bold text-gray-800">Order #{activeOrder.id}</Text>
        </View>
        <View className="bg-black px-4 py-2 rounded-full shadow-md">
           <Text className="font-bold text-white">${activeOrder.total_price}</Text>
        </View>
      </SafeAreaView>

      {/* ─── BOTTOM CARD ─────────────────────────────── */}
      <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-10">

        {/* Handle Bar */}
        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />

        {/* Title Row */}
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">{stepTitle}</Text>
            <Text className="text-2xl font-bold text-gray-900">{stepSubtitle}</Text>
            <Text className="text-gray-400 text-sm mt-1 max-w-[250px]" numberOfLines={1}>
              {activeOrder.status === 'assigned'
                ? activeOrder.store?.address || "Address not provided"
                : activeOrder.delivery_address || "Address not provided"}
            </Text>
          </View>

          {/* Navigation Button */}
          <TouchableOpacity
            onPress={handleOpenMaps}
            className="bg-gray-100 p-4 rounded-full"
          >
            <Navigation size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Customer Actions (Call/Message) */}
        <View className="flex-row gap-4 mb-6">
           <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-gray-50 py-3 rounded-xl border border-gray-100">
              <Phone size={18} color="black" />
              <Text className="ml-2 font-bold">Call</Text>
           </TouchableOpacity>
           <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-gray-50 py-3 rounded-xl border border-gray-100">
              <MessageSquare size={18} color="black" />
              <Text className="ml-2 font-bold">Message</Text>
           </TouchableOpacity>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity
          onPress={handleUpdateStatus}
          disabled={loading}
          className={`w-full py-5 rounded-xl items-center flex-row justify-center shadow-lg ${buttonColor}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg tracking-wide">{buttonText}</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}
