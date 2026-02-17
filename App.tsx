import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, ClipboardList, Truck } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import DeliveryScreen from './src/screens/DeliveryScreen';
import AvailableOrdersScreen from './src/screens/AvailableOrdersScreen';
import MyDeliveriesScreen from './src/screens/MyDeliveriesScreen';
import OrderRequestModal from './src/components/OrderRequestModal';

import { useDriverStore } from './src/store/driverStore';
import { RootStackParamList, MainTabParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { activeOrders } = useDriverStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={AvailableOrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
          tabBarLabel: 'Available',
        }}
      />
      <Tab.Screen
        name="Deliveries"
        component={MyDeliveriesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
          tabBarBadge: activeOrders.length > 0 ? activeOrders.length : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { checkForActiveOrders } = useDriverStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      checkForActiveOrders();
    }
  }, [isAuthenticated]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Delivery" component={DeliveryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
          <OrderRequestModal />
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
