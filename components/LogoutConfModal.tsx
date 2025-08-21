import React from "react";
import { Modal, StyleSheet } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useI18n } from "@/hooks/useI18n";

interface LogoutConfModalProps {
	visible: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const LogoutConfModal: React.FC<LogoutConfModalProps> = ({ visible, onClose, onConfirm }) => {
	const { t } = useI18n();

	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="logout" size={20} color="#f39c12" />
						<Text style={styles.modalTitle}>{t("modals.logout.title")}</Text>
					</View>

					<Text style={styles.modalText}>{t("modals.logout.message")}</Text>

					<View style={styles.buttonContainer}>
						<Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
							<Text style={styles.cancelButtonText}>{t("modals.logout.cancel")}</Text>
						</Pressable>

						<Pressable style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
							<MaterialCommunityIcons name="logout" size={16} color="#f2e9e4" />
							<Text style={styles.confirmButtonText}>{t("modals.logout.confirm")}</Text>
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
		padding: 20,
		width: "100%",
		maxWidth: 380,
		borderWidth: 1,
		borderColor: "#4a4e69",
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#f2e9e4",
		marginLeft: 10,
	},
	modalText: {
		fontSize: 14,
		color: "#c9ada7",
		lineHeight: 20,
		marginBottom: 20,
	},
	buttonContainer: {
		flexDirection: "row",
		gap: 12,
	},
	button: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 6,
	},
	cancelButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#9a8c98",
	},
	confirmButton: {
		backgroundColor: "#f39c12",
		opacity: 0.9,
	},
	cancelButtonText: {
		color: "#9a8c98",
		fontSize: 15,
		fontWeight: "500",
	},
	confirmButtonText: {
		color: "#f2e9e4",
		fontSize: 15,
		fontWeight: "500",
	},
	warningBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(243, 156, 18, 0.1)",
		borderRadius: 8,
		padding: 12,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "rgba(243, 156, 18, 0.3)",
	},
	warningText: {
		color: "#f39c12",
		fontSize: 14,
		fontWeight: "500",
		marginLeft: 8,
	},
});
