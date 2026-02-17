import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { handleApiError } from '../utils/handleApiError';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      await login(data.access_token, data.refresh_token);
    } catch (error) {
      handleApiError(error, { fallbackTitle: 'Login Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-center p-6">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-gray-900">Driver App</Text>
        <Text className="text-gray-500 mt-2">Sign in to start earning</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-700 font-medium mb-1">Email</Text>
          <TextInput 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
            placeholder="driver@example.com"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-1">Password</Text>
          <TextInput 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          className="w-full bg-black py-4 rounded-xl items-center mt-4"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}