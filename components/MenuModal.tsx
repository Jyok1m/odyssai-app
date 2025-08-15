import React from "react";
import { Modal, StyleSheet, Alert } from "react-native";
import { View, Text, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface MenuModalProps {
	visible: boolean;
	onClose: () => void;
	onResetConversation: () => void;
	onViewGameData: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ visible, onClose, onResetConversation, onViewGameData }) => {
	const handleResetConversation = () => {
		Alert.alert("Confirm Reset", "Are you sure you want to delete the entire conversation? This action cannot be undone.", [
			{
				text: "Cancel",
				style: "cancel",
			},
			{
				text: "Reset",
				style: "destructive",
				onPress: () => {
					onResetConversation();
					onClose();
				},
			},
		]);
	};

	const handleViewGameData = () => {
		onViewGameData();
		onClose();
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<MaterialCommunityIcons name="menu" size={24} color="#9a8c98" />
						<Text style={styles.modalTitle}>Menu</Text>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<MaterialCommunityIcons name="close" size={20} color="#9a8c98" />
						</Pressable>
					</View>

					<Text style={styles.modalSubtitle}>Choose an action</Text>

					<View style={styles.menuOptions}>
						{/* View Game Data Option */}
						<Pressable style={[styles.menuOption, styles.gameDataOption]} onPress={handleViewGameData}>
							<View style={styles.optionIcon}>
								<MaterialCommunityIcons name="account-details" size={24} color="#4a4e69" />
							</View>
							<View style={styles.optionContent}>
								<Text style={styles.optionTitle}>View Game Data</Text>
								<Text style={styles.optionDescription}>See character and world information</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={20} color="#9a8c98" />
						</Pressable>

						{/* Reset Conversation Option */}
						<Pressable style={[styles.menuOption, styles.resetOption]} onPress={handleResetConversation}>
							<View style={[styles.optionIcon, styles.resetIcon]}>
								<MaterialCommunityIcons name="delete-sweep" size={24} color="#e74c3c" />
							</View>
							<View style={styles.optionContent}>
								<Text style={[styles.optionTitle, styles.resetTitle]}>Reset Conversation</Text>
								<Text style={[styles.optionDescription, styles.resetDescription]}>Delete all messages and start over</Text>
							</View>
							<MaterialCommunityIcons name="chevron-right" size={20} color="#e74c3c" />
						</Pressable>
					</View>

					<View style={styles.footer}>
						<Pressable style={styles.cancelButton} onPress={onClose}>
							<Text style={styles.cancelButtonText}>Cancel</Text>
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
	optionContent: {
		flex: 1,
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
	optionDescription: {
		fontSize: 14,
		color: "#c9ada7",
		lineHeight: 18,
	},
	resetDescription: {
		color: "rgba(231, 76, 60, 0.8)",
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
