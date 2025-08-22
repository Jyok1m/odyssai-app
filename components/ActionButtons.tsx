import "react-native-get-random-values";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { StyleSheet, Pressable, Platform } from "react-native";
import { View, Text } from "@/components/Themed";
import { useI18n } from "../hooks/useI18n";

interface ActionButton {
	id: string;
	label: string;
	value: string;
	icon?: string;
}

interface ActionButtonsProps {
	currentStep: string;
	onButtonPress: (value: string, buttonId: string) => void;
	disabled?: boolean;
}

// Configuration des boutons pour chaque étape
const getButtonsForStep = (step: string, t: (key: string) => string): ActionButton[] => {
	switch (step) {
		case "cta_ask_new_world": {
			return [
				{
					id: uuidv4(),
					label: t("cta.see_world_list"),
					value: "see_world_list",
				},
				{
					id: uuidv4(),
					label: t("cta.create_new_world"),
					value: "create_new_world",
				},
				{
					id: uuidv4(),
					label: t("cta.join_existing_world"),
					value: "join_existing_world",
				},
			];
		}

		case "cta_ask_world": {
			return [
				{
					id: uuidv4(),
					label: t("cta.join_created_world"),
					value: "join_created_world",
				},
				{
					id: uuidv4(),
					label: t("cta.create_new_world_instead"),
					value: "create_new_world_instead",
				},
			];
		}

		case "cta_ask_new_character": {
			return [
				{
					id: uuidv4(),
					label: t("cta.play_new_character"),
					value: "play_new_character",
				},
				{
					id: uuidv4(),
					label: t("cta.play_existing_character"),
					value: "play_existing_character",
				},
			];
		}

		case "cta_ask_new_world_bis": {
			return [
				{
					id: uuidv4(),
					label: t("cta.create_bis"),
					value: "create_bis",
				},
				{
					id: uuidv4(),
					label: t("cta.restart"),
					value: "restart",
				},
			];
		}

		case "cta_ask_create_world": {
			return [
				{
					id: uuidv4(),
					label: t("cta.start_world_creation"),
					value: "start_world_creation",
				},
				{
					id: uuidv4(),
					label: t("cta.pause_world_creation"),
					value: "pause_world_creation",
				},
			];
		}

		case "cta_ask_new_character": {
			return [
				{
					id: uuidv4(),
					label: t("cta.create_new_character"),
					value: "create_new_character",
				},
				{
					id: uuidv4(),
					label: t("cta.play_existing_character"),
					value: "play_existing_character",
				},
			];
		}

		case "cta_ask_new_character_bis": {
			return [
				{
					id: uuidv4(),
					label: t("cta.create_bis"),
					value: "create_bis",
				},
				{
					id: uuidv4(),
					label: t("cta.restart"),
					value: "restart",
				},
			];
		}

		case "cta_ask_create_character": {
			return [
				{
					id: uuidv4(),
					label: t("cta.start_character_creation"),
					value: "start_character_creation",
				},
				{
					id: uuidv4(),
					label: t("cta.pause_character_creation"),
					value: "pause_character_creation",
				},
			];
		}

		case "cta_ask_join_game": {
			return [
				{
					id: uuidv4(),
					label: t("cta.rejoin_world"),
					value: "rejoin_world",
				},
				{
					id: uuidv4(),
					label: t("cta.pause_rejoin_world"),
					value: "pause_rejoin_world",
				},
			];
		}

		case "cta_get_prompt": {
			return [
				{
					id: uuidv4(),
					label: t("cta.continue_story"),
					value: "continue_story",
				},
				{
					id: uuidv4(),
					label: t("cta.pause_story"),
					value: "pause_story",
				},
			];
		}

		default:
			return [];
	}
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ currentStep, onButtonPress, disabled = false }) => {
	const { t } = useI18n();

	return (
		<View style={styles.container}>
			<View style={styles.buttonsGrid}>
				{getButtonsForStep(currentStep, t).map((button) => (
					<Pressable
						key={button.id}
						style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed, disabled && styles.actionButtonDisabled]}
						onPress={() => !disabled && onButtonPress(button.label, button.value)}
						disabled={disabled}
					>
						<Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{button.label}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "transparent",
		marginBottom: Platform.OS === "ios" ? 0 : 45,
	},
	buttonsGrid: {
		flexDirection: "column",
		gap: 8,
		backgroundColor: "transparent",
	},
	actionButton: {
		backgroundColor: "#4a4e69",
		borderWidth: 1,
		borderColor: "#9a8c98",
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 14,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 48,
	},
	actionButtonPressed: {
		backgroundColor: "#9a8c98",
		transform: [{ scale: 0.98 }],
	},
	actionButtonDisabled: {
		backgroundColor: "#2c2f42",
		borderColor: "#666",
		opacity: 0.6,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#f2e9e4",
		textAlign: "center",
	},
	buttonTextDisabled: {
		color: "#888",
	},
});
