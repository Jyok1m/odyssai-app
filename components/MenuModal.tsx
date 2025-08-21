import React from "react";
import { Modal, StyleSheet, Alert } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import { useAppSelector, useAppDispatch } from "@/store/hooks/typedHooks";
import { toggleTTS } from "@/store/reducers/userSlice";
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
	const dispatch = useAppDispatch();
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

	const handleToggleTTS = () => {
		dispatch(toggleTTS());
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="menu" size={20} color="#9a8c98" />
						<Text style={styles.modalTitle}>{t("menu.title", { username: userState.username })}</Text>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<MaterialCommunityIcons name="close" size={18} color="#9a8c98" />
						</Pressable>
					</View>

					<Text style={styles.modalSubtitle}>{t("menu.chooseAction")}</Text>

					<View style={styles.menuOptions}>
						{/* View Game Data Option */}
						<Pressable style={[styles.menuOption, styles.gameDataOption]} onPress={handleViewGameData}>
							<View style={styles.optionIcon}>
								<MaterialCommunityIcons name="account-details" size={20} color="#4a4e69" />
							</View>
							<View style={styles.optionContent}>
								<Text style={styles.optionTitle}>{t("menu.gameData")}</Text>
								<Text style={styles.optionDescription}>{t("menu.gameDataDescription")}</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={16} color="#9a8c98" />
						</Pressable>

						{/* TTS Toggle Option */}
						<Pressable style={[styles.menuOption, styles.ttsOption]} onPress={handleToggleTTS}>
							<View style={[styles.optionIcon, styles.ttsIcon]}>
								<MaterialCommunityIcons
									name={userState.ttsEnabled ? "volume-high" : "volume-off"}
									size={20}
									color={userState.ttsEnabled ? "#2ecc71" : "#95a5a6"}
								/>
							</View>
							<View style={styles.optionContent}>
								<Text style={[styles.optionTitle, userState.ttsEnabled ? styles.ttsEnabledTitle : styles.ttsDisabledTitle]}>
									{userState.ttsEnabled ? t("menu.voiceActivated") : t("menu.voiceDeactivated")}
								</Text>
								<Text style={[styles.optionDescription, userState.ttsEnabled ? styles.ttsEnabledDescription : styles.ttsDisabledDescription]}>
									{userState.ttsEnabled ? t("menu.voiceToDeactivate") : t("menu.voiceToActivate")}
								</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={16} color={userState.ttsEnabled ? "#2ecc71" : "#95a5a6"} />
						</Pressable>

						{/* Reset Conversation Option */}
						<Pressable style={[styles.menuOption, styles.resetOption]} onPress={handleResetConversation}>
							<View style={[styles.optionIcon, styles.resetIcon]}>
								<MaterialCommunityIcons name="delete-sweep" size={20} color="#e74c3c" />
							</View>
							<View style={styles.optionContent}>
								<Text style={[styles.optionTitle, styles.resetTitle]}>{t("menu.reset")}</Text>
								<Text style={[styles.optionDescription, styles.resetDescription]}>{t("menu.resetDescription")}</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={16} color="#e74c3c" />
						</Pressable>

						{/* Logout Option */}
						<Pressable style={[styles.menuOption, styles.logoutOption]} onPress={handleLogout}>
							<View style={[styles.optionIcon, styles.logoutIcon]}>
								<MaterialCommunityIcons name="logout" size={20} color="#f39c12" />
							</View>
							<View style={styles.optionContent}>
								<Text style={[styles.optionTitle, styles.logoutTitle]}>{t("menu.logout")}</Text>
								<Text style={[styles.optionDescription, styles.logoutDescription]}>{t("menu.logoutDescription")}</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={16} color="#f39c12" />
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
		maxWidth: 380,
		maxHeight: "85%",
		borderWidth: 1,
		borderColor: "#4a4e69",
		overflow: "hidden",
		display: "flex",
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#4a4e69",
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#f2e9e4",
		flex: 1,
		marginLeft: 10,
	},
	closeButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(154, 140, 152, 0.1)",
	},
	modalSubtitle: {
		fontSize: 13,
		color: "#c9ada7",
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 8,
	},
	menuOptions: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 10,
	},
	menuOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 10,
		borderWidth: 1,
	},
	gameDataOption: {
		backgroundColor: "rgba(154, 140, 152, 0.1)",
		borderColor: "rgba(154, 140, 152, 0.3)",
	},
	ttsOption: {
		backgroundColor: "rgba(46, 204, 113, 0.1)",
		borderColor: "rgba(46, 204, 113, 0.3)",
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
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(242, 233, 228, 0.9)",
		marginRight: 12,
	},
	resetIcon: {
		backgroundColor: "rgba(231, 76, 60, 0.1)",
	},
	ttsIcon: {
		backgroundColor: "rgba(46, 204, 113, 0.1)",
	},
	logoutIcon: {
		backgroundColor: "rgba(243, 156, 18, 0.1)",
	},
	optionContent: {
		flex: 1,
		backgroundColor: "transparent",
	},
	optionTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#f2e9e4",
		marginBottom: 2,
	},
	resetTitle: {
		color: "#e74c3c",
	},
	ttsEnabledTitle: {
		color: "#2ecc71",
	},
	ttsDisabledTitle: {
		color: "#95a5a6",
	},
	logoutTitle: {
		color: "#f39c12",
	},
	optionDescription: {
		fontSize: 13,
		color: "#c9ada7",
		lineHeight: 16,
	},
	resetDescription: {
		color: "rgba(231, 76, 60, 0.8)",
	},
	ttsEnabledDescription: {
		color: "rgba(46, 204, 113, 0.8)",
	},
	ttsDisabledDescription: {
		color: "rgba(149, 165, 166, 0.8)",
	},
	logoutDescription: {
		color: "rgba(243, 156, 18, 0.8)",
	},
	footer: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "#4a4e69",
	},
	cancelButton: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#9a8c98",
	},
	cancelButtonText: {
		color: "#9a8c98",
		fontSize: 15,
		fontWeight: "500",
	},
});
