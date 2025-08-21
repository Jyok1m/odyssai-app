import React from "react";
import { Modal, StyleSheet } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useI18n } from "@/hooks/useI18n";

interface GameDataModalProps {
	visible: boolean;
	onClose: () => void;
	gameData?: {
		characterName?: string;
		worldName?: string;
	};
}

export const GameDataModal: React.FC<GameDataModalProps> = ({ visible, onClose, gameData }) => {
	const { t } = useI18n();

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="account-details" size={20} color="#9a8c98" />
						<Text style={styles.modalTitle}>{t("modals.gameData.title")}</Text>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<MaterialCommunityIcons name="close" size={18} color="#9a8c98" />
						</Pressable>
					</View>

					<View style={styles.content}>
						{/* Playing As */}
						<View style={styles.infoItem}>
							<MaterialCommunityIcons name="account" size={20} color="#9a8c98" />
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>{t("modals.gameData.playingAs")} :</Text>
								<Text style={styles.infoValue}>{gameData?.characterName?.toUpperCase() || t("modals.gameData.notSet")}</Text>
							</View>
						</View>

						{/* In the world */}
						<View style={styles.infoItem}>
							<MaterialCommunityIcons name="earth" size={20} color="#9a8c98" />
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>{t("modals.gameData.inTheWorld")} :</Text>
								<Text style={styles.infoValue}>{gameData?.worldName?.toUpperCase() || t("modals.gameData.notSet")}</Text>
							</View>
						</View>

						{/* Empty State */}
						{!gameData?.characterName && !gameData?.worldName && (
							<View style={styles.emptyState}>
								<MaterialCommunityIcons name="information-outline" size={48} color="#c9ada7" />
								<Text style={styles.emptyTitle}>{t("modals.gameData.noGameData")}</Text>
								<Text style={styles.emptyDescription}>{t("modals.gameData.startConversation")}</Text>
							</View>
						)}
					</View>

					<View style={styles.footer}>
						<Pressable style={styles.closeFooterButton} onPress={onClose}>
							<Text style={styles.closeButtonText}>{t("modals.gameData.close")}</Text>
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
		justifyContent: "flex-end",
	},
	modalContainer: {
		backgroundColor: "#22223b",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		borderWidth: 1,
		borderColor: "#4a4e69",
		borderBottomWidth: 0,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#4a4e69",
		borderRadius: 20,
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
	content: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 16,
	},
	infoItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(154, 140, 152, 0.1)",
		borderRadius: 10,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(154, 140, 152, 0.2)",
	},
	infoContent: {
		flex: 1,
		marginLeft: 12,
		backgroundColor: "transparent",
	},
	infoLabel: {
		fontSize: 13,
		fontWeight: "500",
		color: "#c9ada7",
		marginBottom: 2,
	},
	infoValue: {
		fontSize: 16,
		fontWeight: "600",
		color: "#f2e9e4",
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 30,
		paddingHorizontal: 20,
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#c9ada7",
		marginTop: 12,
		marginBottom: 6,
	},
	emptyDescription: {
		fontSize: 13,
		color: "#c9ada7",
		textAlign: "center",
		lineHeight: 18,
	},
	footer: {
		paddingHorizontal: 20,
		paddingVertical: 18,
		borderTopWidth: 1,
		borderRadius: 20,
		borderTopColor: "#4a4e69",
	},
	closeFooterButton: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#9a8c98",
	},
	closeButtonText: {
		color: "#f2e9e4",
		fontSize: 15,
		fontWeight: "500",
	},
});
