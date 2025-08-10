import { StyleSheet, Text, View } from "react-native";
import React from "react";

export default function LandingScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Landing Screen</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
});
