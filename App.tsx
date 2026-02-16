import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';

import { useDriverStore } from './src/store/driverStore';
import DeliveryScreen from './src/screens/DeliveryScreen'; // Import it

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { activeOrder, checkForActiveOrder } = useDriverStore();
  
  // 👇 ADD THIS EFFECT
  React.useEffect(() => {
    if (isAuthenticated) {
      checkForActiveOrder();
    }
  }, [isAuthenticated]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : activeOrder ? ( 
        // 👇 If we have an order, SHOW DELIVERY SCREEN
        <Stack.Screen name="Delivery" component={DeliveryScreen} />
      ) : (
        // 👇 Otherwise, show Home
        <Stack.Screen name="Home" component={HomeScreen} />
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
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}