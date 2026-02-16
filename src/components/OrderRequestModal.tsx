import React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { X, MapPin, Store, DollarSign, Clock } from 'lucide-react-native';
import { useDriverStore } from '../store/driverStore';
import { driverApi } from '../api/drivers';

export default function OrderRequestModal() {
  const { incomingOrder, setIncomingOrder, setActiveOrder } = useDriverStore();

  if (!incomingOrder) return null;

  const handleAccept = async () => {
    try {
        const acceptedOrder = await driverApi.acceptOrder(incomingOrder.id);
        setActiveOrder(acceptedOrder);
        setIncomingOrder(null);
    } catch (e) {
        Alert.alert("Error", "Failed to accept order. It may have been taken.");
        setIncomingOrder(null);
    }
  };

  const handleReject = () => {
    // TODO: Call API to reject
    console.log("Rejected Order:", incomingOrder.id);
    setIncomingOrder(null);
  };

  return (
    <Modal visible={!!incomingOrder} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900">New Delivery Request!</Text>
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-700 font-bold text-xs">Verified</Text>
            </View>
          </View>

          {/* Price & Distance */}
          <View className="flex-row justify-between mb-8">
            <View className="items-center">
              <Text className="text-gray-400 text-xs uppercase font-bold">Earnings</Text>
              <Text className="text-3xl font-bold text-gray-900">${incomingOrder.total_price}</Text>
            </View>
            <View className="w-[1px] bg-gray-200" />
            <View className="items-center">
              <Text className="text-gray-400 text-xs uppercase font-bold">Distance</Text>
              <Text className="text-3xl font-bold text-gray-900">2.4 km</Text>
            </View>
          </View>

          {/* Route Info */}
          <View className="space-y-6 mb-8 relative">
            {/* The Line */}
            <View className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-gray-200 z-0" />

            {/* Store */}
            <View className="flex-row items-center z-10 bg-white">
              <View className="bg-black p-2 rounded-full mr-4">
                <Store size={16} color="#D4AF37" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Pick up</Text>
                <Text className="font-bold text-lg text-gray-800">{incomingOrder.store?.name}</Text>
              </View>
            </View>

            {/* Customer */}
            <View className="flex-row items-center z-10 bg-white">
              <View className="bg-gray-100 p-2 rounded-full mr-4 border border-gray-200">
                <MapPin size={16} color="#4B5563" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Drop off</Text>
                <Text className="font-bold text-lg text-gray-800">Customer Location</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-4">
            <TouchableOpacity 
              onPress={handleReject}
              className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
            >
              <X size={24} color="#EF4444" />
              <Text className="text-gray-900 font-bold mt-1">Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleAccept}
              className="flex-2 flex-grow bg-green-500 py-4 rounded-xl items-center shadow-lg shadow-green-500/30"
            >
              <Clock size={24} color="white" />
              <Text className="text-white font-bold mt-1 text-lg">ACCEPT DELIVERY</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}