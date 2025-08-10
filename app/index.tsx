import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
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
	debug: {
		fontSize: 14,
		marginTop: 10,
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
});
