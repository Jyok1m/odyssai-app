import React from "react";
import { StyleSheet, Alert, AlertButton } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useI18n } from "@/hooks/useI18n";

interface LanguageSelectorProps {
	style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ style }) => {
	const { t, changeLanguage, currentLanguage } = useI18n();

	const languages = [
		{ code: "en", name: "English", flag: "🇺🇸" },
		{ code: "fr", name: "Français", flag: "🇫🇷" },
	];

	const handleLanguageChange = () => {
		const languageButtons: AlertButton[] = languages.map((lang) => ({
			text: `${lang.flag} ${lang.name}`,
			onPress: () => {
				if (lang.code !== currentLanguage) {
					changeLanguage(lang.code);
				}
			},
			style: lang.code === currentLanguage ? "default" : "default",
		}));

		const cancelButton: AlertButton = {
			text: t("common.cancel"),
			style: "cancel",
			onPress: () => {},
		};

		Alert.alert(t("menu.language"), t("menu.language"), [...languageButtons, cancelButton]);
	};

	const currentLang = languages.find((lang) => lang.code === currentLanguage);

	return (
		<Pressable style={[styles.container, style]} onPress={handleLanguageChange}>
			<MaterialCommunityIcons name="translate" size={24} color="#9a8c98" />
			<Text style={styles.languageText}>
				{currentLang?.flag} {currentLang?.name}
			</Text>
			<MaterialCommunityIcons name="chevron-down" size={20} color="#9a8c98" />
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#4a4e69",
		borderRadius: 12,
		gap: 12,
	},
	languageText: {
		flex: 1,
		fontSize: 16,
		color: "#f2e9e4",
	},
});
