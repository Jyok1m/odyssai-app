import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Fallback storage adapter that tries AsyncStorage first, then SecureStore
export const createFallbackStorage = () => {
	return {
		getItem: async (key: string): Promise<string | null> => {
			try {
				// Try AsyncStorage first
				const item = await AsyncStorage.getItem(key);
				return item;
			} catch (error) {
				console.warn("AsyncStorage getItem failed, trying SecureStore:", error);
				try {
					return await SecureStore.getItemAsync(key);
				} catch (secureError) {
					console.warn("SecureStore getItem also failed:", secureError);
					return null;
				}
			}
		},
		setItem: async (key: string, value: string): Promise<void> => {
			try {
				await AsyncStorage.setItem(key, value);
			} catch (error) {
				console.warn("AsyncStorage setItem failed, trying SecureStore:", error);
				try {
					await SecureStore.setItemAsync(key, value);
				} catch (secureError) {
					console.warn("SecureStore setItem also failed:", secureError);
				}
			}
		},
		removeItem: async (key: string): Promise<void> => {
			try {
				await AsyncStorage.removeItem(key);
			} catch (error) {
				console.warn("AsyncStorage removeItem failed, trying SecureStore:", error);
				try {
					await SecureStore.deleteItemAsync(key);
				} catch (secureError) {
					console.warn("SecureStore removeItem also failed:", secureError);
				}
			}
		},
	};
};

// Storage adapter for Redux Persist using Expo SecureStore
export const createExpoSecureStoreAdapter = () => {
	return {
		getItem: async (key: string): Promise<string | null> => {
			try {
				return await SecureStore.getItemAsync(key);
			} catch (error) {
				console.warn("SecureStore getItem error:", error);
				return null;
			}
		},
		setItem: async (key: string, value: string): Promise<void> => {
			try {
				await SecureStore.setItemAsync(key, value);
			} catch (error) {
				console.warn("SecureStore setItem error:", error);
			}
		},
		removeItem: async (key: string): Promise<void> => {
			try {
				await SecureStore.deleteItemAsync(key);
			} catch (error) {
				console.warn("SecureStore removeItem error:", error);
			}
		},
	};
};
