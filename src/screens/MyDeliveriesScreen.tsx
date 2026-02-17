import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, ChevronRight, Package } from 'lucide-react-native';
import { useDriverStore } from '../store/driverStore';
import { RootStackParamList, Order, OrderStatus } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getStatusDisplay(status: OrderStatus) {
  switch (status) {
    case 'assigned':
      return { label: 'Assigned', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
    case 'picked_up':
      return { label: 'Picked Up', bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
    case 'in_transit':
      return { label: 'In Transit', bgColor: 'bg-green-100', textColor: 'text-green-700' };
    default:
      return { label: status, bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
  }
}

export default function MyDeliveriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { activeOrders, checkForActiveOrders } = useDriverStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await checkForActiveOrders();
    setRefreshing(false);
  }, [checkForActiveOrders]);

  const handlePress = (order: Order) => {
    navigation.navigate('Delivery', { orderId: order.id });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50">
      {/* Header */}
      <View className="p-6 bg-white shadow-sm">
        <Text className="text-xl font-bold text-gray-900">My Deliveries</Text>
        <Text className="text-gray-500 text-sm mt-1">
          {activeOrders.length} active delivery{activeOrders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Package size={48} color="#D1D5DB" />
            <Text className="text-lg font-bold text-gray-400 mt-4">No active deliveries</Text>
            <Text className="text-gray-400 text-sm mt-1">Accept orders from the Available tab.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusDisplay = getStatusDisplay(item.status);
          return (
            <TouchableOpacity
              onPress={() => handlePress(item)}
              className="bg-white rounded-2xl p-4 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                {/* Left: Store info */}
                <View className="flex-row items-center flex-1">
                  <View className="bg-black p-2 rounded-full mr-3">
                    <Store size={16} color="#D4AF37" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="font-bold text-gray-900 text-base mr-2">
                        Order #{item.id}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${statusDisplay.bgColor}`}>
                        <Text className={`font-bold text-xs ${statusDisplay.textColor}`}>
                          {statusDisplay.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 text-sm">{item.store?.name}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                      {item.delivery_address || 'No delivery address'}
                    </Text>
                  </View>
                </View>

                {/* Right: Price + Chevron */}
                <View className="items-end ml-3">
                  <Text className="text-lg font-bold text-gray-900">${item.total_price}</Text>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
