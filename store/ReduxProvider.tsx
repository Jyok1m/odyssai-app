import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Text, View, StyleSheet } from "react-native";
import { store, persistor } from "./store";

interface ReduxProviderProps {
	children: React.ReactNode;
}

const LoadingScreen = () => (
	<View style={styles.loadingContainer}>
		<Text style={styles.loadingText}>Loading...</Text>
	</View>
);

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
	return (
		<Provider store={store}>
			<PersistGate loading={<LoadingScreen />} persistor={persistor}>
				{children}
			</PersistGate>
		</Provider>
	);
};

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#22223b",
	},
	loadingText: {
		color: "#f2e9e4",
		fontSize: 16,
	},
});
