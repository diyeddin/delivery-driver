import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, MapPin, ShoppingBag } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useDriverStore } from '../store/driverStore';
import { driverApi } from '../api/drivers';
import { Order } from '../types';

export default function AvailableOrdersScreen() {
  const { status, activeOrders, addActiveOrder } = useDriverStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingIds, setAcceptingIds] = useState<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const data = await driverApi.getAvailableOrders();
      setOrders(data);
    } catch (error) {
      console.log('Failed to fetch available orders', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'online') {
      setLoading(true);
      fetchOrders().finally(() => setLoading(false));
    }
  }, [status, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleAccept = async (order: Order) => {
    setAcceptingIds(prev => new Set(prev).add(order.id));
    try {
      const acceptedOrder = await driverApi.acceptOrder(order.id);
      addActiveOrder(acceptedOrder);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      Toast.show({
        type: 'success',
        text1: 'Order Accepted',
        text2: `Order #${acceptedOrder.id} added to your deliveries`,
      });
    } catch (e: any) {
      const message = e?.response?.data?.detail || 'Failed to accept order. It may have been taken.';
      Alert.alert('Error', message);
    } finally {
      setAcceptingIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  if (status !== 'online') {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-gray-50">
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-xl font-bold text-gray-900 mb-2">You're Offline</Text>
          <Text className="text-gray-400 text-center">
            Go online from the Home tab to browse available orders.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50">
      {/* Header */}
      <View className="p-6 bg-white shadow-sm">
        <Text className="text-xl font-bold text-gray-900">Available Orders</Text>
        <Text className="text-gray-500 text-sm mt-1">
          {activeOrders.length}/3 delivery slots used
        </Text>
      </View>

      {loading && orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <ShoppingBag size={48} color="#D1D5DB" />
              <Text className="text-lg font-bold text-gray-400 mt-4">No available orders</Text>
              <Text className="text-gray-400 text-sm mt-1">Pull to refresh or check back soon.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAccepting = acceptingIds.has(item.id);
            return (
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                {/* Store Row */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-black p-2 rounded-full mr-3">
                    <Store size={16} color="#D4AF37" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-base">{item.store?.name}</Text>
                    <Text className="text-gray-400 text-xs">{item.store?.address || 'No address'}</Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">${item.total_price}</Text>
                </View>

                {/* Delivery Address */}
                <View className="flex-row items-center mb-3 pl-1">
                  <MapPin size={14} color="#9CA3AF" />
                  <Text className="text-gray-500 text-sm ml-2 flex-1" numberOfLines={1}>
                    {item.delivery_address || 'No delivery address'}
                  </Text>
                </View>

                {/* Items Count + Accept */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-400 text-xs">
                    {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleAccept(item)}
                    disabled={isAccepting || activeOrders.length >= 3}
                    className={`px-6 py-2.5 rounded-xl ${
                      activeOrders.length >= 3
                        ? 'bg-gray-200'
                        : 'bg-green-500'
                    }`}
                  >
                    {isAccepting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className={`font-bold text-sm ${
                        activeOrders.length >= 3
                          ? 'text-gray-400'
                          : 'text-white'
                      }`}>
                        {activeOrders.length >= 3 ? 'Slots Full' : 'Accept'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
