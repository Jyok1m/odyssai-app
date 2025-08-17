import React from "react";
import { Modal, StyleSheet } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useI18n } from "@/hooks/useI18n";

interface LanguageOption {
	code: string;
	name: string;
	flag: string;
}

interface LanguageSelectionModalProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (languageCode: string) => void;
	selectedLanguage: string;
	languages: LanguageOption[];
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ visible, onClose, onSelect, selectedLanguage, languages }) => {
	const { t } = useI18n();

	const handleLanguageSelect = (languageCode: string) => {
		onSelect(languageCode);
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="translate" size={24} color="#9a8c98" />
						<Text style={styles.modalTitle}>{t("auth.selectLanguage")}</Text>
					</View>

					<Text style={styles.modalText}>{t("auth.languageWarning")}</Text>

					<View style={styles.warningBox}>
						<MaterialCommunityIcons name="information" size={16} color="#3498db" />
						<Text style={styles.warningText}>{t("auth.languageNotModifiable")}</Text>
					</View>

					<View style={styles.languageList}>
						{languages.map((language) => (
							<Pressable
								key={language.code}
								style={[styles.languageOption, selectedLanguage === language.code && styles.selectedLanguageOption]}
								onPress={() => handleLanguageSelect(language.code)}
							>
								<Text style={styles.languageFlag}>{language.flag}</Text>
								<Text style={[styles.languageName, selectedLanguage === language.code && styles.selectedLanguageName]}>{language.name}</Text>
								{selectedLanguage === language.code && <MaterialCommunityIcons name="check-circle" size={20} color="#27ae60" />}
							</Pressable>
						))}
					</View>

					<View style={styles.buttonContainer}>
						<Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
							<Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	modalContainer: {
		backgroundColor: "#22223b",
		borderRadius: 16,
		padding: 24,
		width: "100%",
		maxWidth: 400,
		borderWidth: 1,
		borderColor: "#4a4e69",
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#f2e9e4",
		marginLeft: 12,
	},
	modalText: {
		fontSize: 16,
		color: "#c9ada7",
		lineHeight: 24,
		marginBottom: 20,
	},
	warningBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(52, 152, 219, 0.1)",
		borderRadius: 8,
		padding: 12,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "rgba(52, 152, 219, 0.3)",
	},
	warningText: {
		color: "#3498db",
		fontSize: 14,
		fontWeight: "500",
		marginLeft: 8,
		flex: 1,
	},
	languageList: {
		marginBottom: 20,
		gap: 8,
	},
	languageOption: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#4a4e69",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderWidth: 1,
		borderColor: "transparent",
	},
	selectedLanguageOption: {
		backgroundColor: "#9a8c98",
		borderColor: "#27ae60",
	},
	languageFlag: {
		fontSize: 20,
		marginRight: 12,
	},
	languageName: {
		flex: 1,
		fontSize: 16,
		color: "#f2e9e4",
		fontWeight: "500",
	},
	selectedLanguageName: {
		color: "#22223b",
		fontWeight: "600",
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "center",
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	cancelButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#9a8c98",
	},
	cancelButtonText: {
		color: "#9a8c98",
		fontSize: 16,
		fontWeight: "500",
	},
});
