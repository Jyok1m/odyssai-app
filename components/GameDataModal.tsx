import React from "react";
import { Modal, StyleSheet } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface GameDataModalProps {
	visible: boolean;
	onClose: () => void;
	gameData?: {
		characterName?: string;
		worldName?: string;
	};
}

export const GameDataModal: React.FC<GameDataModalProps> = ({ visible, onClose, gameData }) => {
	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="account-details" size={24} color="#9a8c98" />
						<Text style={styles.modalTitle}>Game Info</Text>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<MaterialCommunityIcons name="close" size={20} color="#9a8c98" />
						</Pressable>
					</View>

					<View style={styles.content}>
						{/* Playing As */}
						<View style={styles.infoItem}>
							<MaterialCommunityIcons name="account" size={24} color="#9a8c98" />
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>Playing As</Text>
								<Text style={styles.infoValue}>{gameData?.characterName || "Not set"}</Text>
							</View>
						</View>

						{/* In the world */}
						<View style={styles.infoItem}>
							<MaterialCommunityIcons name="earth" size={24} color="#9a8c98" />
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>In the world</Text>
								<Text style={styles.infoValue}>{gameData?.worldName || "Not set"}</Text>
							</View>
						</View>

						{/* Empty State */}
						{!gameData?.characterName && !gameData?.worldName && (
							<View style={styles.emptyState}>
								<MaterialCommunityIcons name="information-outline" size={48} color="#c9ada7" />
								<Text style={styles.emptyTitle}>No Game Data</Text>
								<Text style={styles.emptyDescription}>Start a conversation with Odyssai to create your character and world.</Text>
							</View>
						)}
					</View>

					<View style={styles.footer}>
						<Pressable style={styles.closeFooterButton} onPress={onClose}>
							<Text style={styles.closeButtonText}>Close</Text>
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
	content: {
		paddingHorizontal: 20,
		paddingVertical: 20,
		gap: 20,
	},
	infoItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(154, 140, 152, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(154, 140, 152, 0.2)",
	},
	infoContent: {
		flex: 1,
		marginLeft: 16,
	},
	infoLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: "#c9ada7",
		marginBottom: 4,
	},
	infoValue: {
		fontSize: 18,
		fontWeight: "600",
		color: "#f2e9e4",
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
		paddingHorizontal: 20,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#c9ada7",
		marginTop: 16,
		marginBottom: 8,
	},
	emptyDescription: {
		fontSize: 14,
		color: "#c9ada7",
		textAlign: "center",
		lineHeight: 20,
	},
	footer: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: "#4a4e69",
	},
	closeFooterButton: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#9a8c98",
	},
	closeButtonText: {
		color: "#f2e9e4",
		fontSize: 16,
		fontWeight: "500",
	},
});
