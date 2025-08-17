import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "../hooks/useI18n";

export const I18nTest: React.FC = () => {
	const { t, currentLanguage } = useI18n();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>I18n Test</Text>
			<Text style={styles.info}>Current Language: {currentLanguage}</Text>
			<Text style={styles.text}>{t("app.name")}</Text>
			<Text style={styles.text}>{t("app.tagline")}</Text>
			<Text style={styles.text}>{t("auth.signIn")}</Text>
			<Text style={styles.text}>{t("chat.placeholder")}</Text>
			<Text style={styles.text}>{t("common.loading")}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		backgroundColor: "#22223b",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#f2e9e4",
		marginBottom: 10,
	},
	info: {
		fontSize: 14,
		color: "#9a8c98",
		marginBottom: 20,
	},
	text: {
		fontSize: 16,
		color: "#c9ada7",
		marginBottom: 8,
	},
});
