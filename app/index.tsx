import { StyleSheet } from "react-native";
import { Text, View, Button } from "@/components/Themed";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { useAppSelector } from "@/store/hooks/typedHooks";
import { useI18n } from "@/hooks/useI18n";
import { LanguageSelector } from "@/components";

export default function LandingScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAppSelector((state) => state.user);
	const { t } = useI18n();

	const handleStartJourney = () => {
		if (isAuthenticated) {
			router.push("/chat");
		} else {
			router.replace("/auth" as any);
		}
	};

	return (
		<View style={styles.container}>
			{/* <View style={styles.languageContainer}>
				<LanguageSelector />
			</View> */}

			<View style={styles.welcomeSection}>
				<MaterialCommunityIcons name="book-open-variant" size={80} color="#9a8c98" style={styles.icon} />
				<Text style={styles.welcomeTitle}>{t("home.welcomeTo")}</Text>
				<Text style={styles.appTitle}>{t("app.name")}</Text>
				<Text style={styles.subtitle}>{t("app.tagline")}</Text>
			</View>

			<View style={styles.buttonSection}>
				<Button title={t("home.startJourney")} onPress={handleStartJourney} style={styles.startButton} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 60,
		paddingHorizontal: 24,
	},
	languageContainer: {
		position: "absolute",
		top: 60,
		right: 24,
		zIndex: 1,
	},
	welcomeSection: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	icon: {
		marginBottom: 24,
	},
	welcomeTitle: {
		fontSize: 28,
		fontWeight: "300",
		marginBottom: 8,
		opacity: 0.8,
	},
	appTitle: {
		fontSize: 48,
		fontWeight: "bold",
		marginBottom: 16,
		letterSpacing: 2,
	},
	subtitle: {
		fontSize: 18,
		fontWeight: "300",
		textAlign: "center",
		opacity: 0.7,
		lineHeight: 24,
	},
	buttonSection: {
		width: "100%",
		alignItems: "center",
	},
	startButton: {
		width: "80%",
		maxWidth: 300,
		paddingVertical: 16,
		borderRadius: 12,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 40,
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
