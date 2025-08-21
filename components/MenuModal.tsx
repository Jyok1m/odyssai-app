import React from "react";
import { Modal, StyleSheet, Alert } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import { useAppSelector } from "@/store/hooks/typedHooks";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useI18n } from "@/hooks/useI18n";

interface MenuModalProps {
	visible: boolean;
	onClose: () => void;
	onResetConversation: () => void;
	onViewGameData: () => void;
	onLogout: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ visible, onClose, onResetConversation, onViewGameData, onLogout }) => {
	const userState = useAppSelector((state) => state.user);
	const { t } = useI18n();

	const handleResetConversation = () => {
		onResetConversation();
		onClose();
	};

	const handleViewGameData = () => {
		onViewGameData();
		onClose();
	};

	const handleLogout = () => {
		onLogout();
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="menu" size={24} color="#9a8c98" />
						<Text style={styles.modalTitle}>{t("menu.title", { username: userState.username })}</Text>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<MaterialCommunityIcons name="close" size={20} color="#9a8c98" />
						</Pressable>
					</View>

					<Text style={styles.modalSubtitle}>{t("menu.chooseAction")}</Text>

					<View style={styles.menuOptions}>
						{/* View Game Data Option */}
						<Pressable style={[styles.menuOption, styles.gameDataOption]} onPress={handleViewGameData}>
							<View style={styles.optionIcon}>
								<MaterialCommunityIcons name="account-details" size={24} color="#4a4e69" />
							</View>
							<View style={styles.optionContent}>
								<Text style={styles.optionTitle}>{t("menu.gameData")}</Text>
								<Text style={styles.optionDescription}>{t("menu.gameDataDescription")}</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={20} color="#9a8c98" />
						</Pressable>

						{/* Reset Conversation Option */}
						<Pressable style={[styles.menuOption, styles.resetOption]} onPress={handleResetConversation}>
							<View style={[styles.optionIcon, styles.resetIcon]}>
								<MaterialCommunityIcons name="delete-sweep" size={24} color="#e74c3c" />
							</View>
							<View style={styles.optionContent}>
								<Text style={[styles.optionTitle, styles.resetTitle]}>{t("menu.reset")}</Text>
								<Text style={[styles.optionDescription, styles.resetDescription]}>{t("menu.resetDescription")}</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={20} color="#e74c3c" />
						</Pressable>

						{/* Logout Option */}
						<Pressable style={[styles.menuOption, styles.logoutOption]} onPress={handleLogout}>
							<View style={[styles.optionIcon, styles.logoutIcon]}>
								<MaterialCommunityIcons name="logout" size={24} color="#f39c12" />
							</View>
							<View style={styles.optionContent}>
								<Text style={[styles.optionTitle, styles.logoutTitle]}>{t("menu.logout")}</Text>
								<Text style={[styles.optionDescription, styles.logoutDescription]}>{t("menu.logoutDescription")}</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={20} color="#f39c12" />
						</Pressable>
					</View>

					<View style={styles.footer}>
						<Pressable style={styles.cancelButton} onPress={onClose}>
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
		padding: 0,
		width: "100%",
		maxWidth: 400,
		borderWidth: 1,
		borderColor: "#4a4e69",
		overflow: "hidden",
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#4a4e69",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#f2e9e4",
		flex: 1,
		marginLeft: 12,
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(154, 140, 152, 0.1)",
	},
	modalSubtitle: {
		fontSize: 14,
		color: "#c9ada7",
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 12,
	},
	menuOptions: {
		paddingHorizontal: 20,
		paddingBottom: 20,
		gap: 12,
	},
	menuOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderRadius: 12,
		borderWidth: 1,
	},
	gameDataOption: {
		backgroundColor: "rgba(154, 140, 152, 0.1)",
		borderColor: "rgba(154, 140, 152, 0.3)",
	},
	resetOption: {
		backgroundColor: "rgba(231, 76, 60, 0.1)",
		borderColor: "rgba(231, 76, 60, 0.3)",
	},
	logoutOption: {
		backgroundColor: "rgba(243, 156, 18, 0.1)",
		borderColor: "rgba(243, 156, 18, 0.3)",
	},
	optionIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(242, 233, 228, 0.9)",
		marginRight: 16,
	},
	resetIcon: {
		backgroundColor: "rgba(231, 76, 60, 0.1)",
	},
	logoutIcon: {
		backgroundColor: "rgba(243, 156, 18, 0.1)",
	},
	optionContent: {
		flex: 1,
		backgroundColor: "transparent",
	},
	optionTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#f2e9e4",
		marginBottom: 4,
	},
	resetTitle: {
		color: "#e74c3c",
	},
	logoutTitle: {
		color: "#f39c12",
	},
	optionDescription: {
		fontSize: 14,
		color: "#c9ada7",
		lineHeight: 18,
	},
	resetDescription: {
		color: "rgba(231, 76, 60, 0.8)",
	},
	logoutDescription: {
		color: "rgba(243, 156, 18, 0.8)",
	},
	footer: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: "#4a4e69",
	},
	cancelButton: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
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
