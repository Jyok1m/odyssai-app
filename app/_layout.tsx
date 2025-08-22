import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaView, StatusBar, Platform } from "react-native";
import { ReduxProvider } from "../store";
import { useLanguageSync } from "../hooks/useLanguageSync";
import "react-native-reanimated";
import "../i18n"; // Initialize i18n

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { toast, Toasts } from "@backpackapp-io/react-native-toast";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return <RootLayoutNav />;
}

function RootLayoutNav() {
	return (
		<ReduxProvider>
			<AppContent />
		</ReduxProvider>
	);
}

function AppContent() {
	// Synchronise le store avec les changements de langue
	// (maintenant à l'intérieur du ReduxProvider)
	useLanguageSync();

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#22223b" }}>
			<StatusBar barStyle="light-content" backgroundColor="#22223b" translucent={false} />
			<GestureHandlerRootView style={{ flex: 1 }}>
				<ThemeProvider value={DarkTheme}>
					<Stack>
						<Stack.Screen name="index" options={{ headerShown: false }} />
						<Stack.Screen name="auth" options={{ headerShown: false }} />
						<Stack.Screen name="chat" options={{ headerShown: false }} />
					</Stack>
					<Toasts
						defaultStyle={{
							view: { padding: 12, borderRadius: 8, backgroundColor: "#4a4e69" },
							text: { color: "#f2e9e4", fontSize: 14, fontWeight: "400" },
						}}
					/>
				</ThemeProvider>
			</GestureHandlerRootView>
		</SafeAreaView>
	);
}
