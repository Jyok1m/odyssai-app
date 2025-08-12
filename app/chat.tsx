import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, View, Text, TextInput, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppSelector, useAppDispatch, useChatActions, Message, formatTimestamp, resetStore } from "../store";
import { ResetModal } from "../components/ResetModal";
import { AIThinkingAdvanced } from "../components/AIThinkingAdvanced";

export default function ChatScreen() {
	const [message, setMessage] = useState("");
	const [showResetModal, setShowResetModal] = useState(false);
	const flatListRef = useRef<FlatList>(null);
	const dispatch = useAppDispatch();
	const messagesState = useAppSelector((state) => state.messages);
	const messages = messagesState?.messages || [];
	const isLoading = messagesState?.isLoading || false;
	const { sendMessage, resetChat } = useChatActions();

	const gameData = useAppSelector((state) => state.gameData);
	const prevAIQuestions = messages.filter((msg: any) => !msg.isUser);
	const lastAIQuestion = prevAIQuestions[prevAIQuestions.length - 1];
	const { currentStep, text: aiText } = lastAIQuestion;

	console.log("After => ", { currentStep, aiText });
	console.log("After => ", { gameData });

	// Initialiser les messages si ils sont vides au premier chargement
	useEffect(() => {
		if (messages.length === 0) {
			dispatch(resetStore());
		}
	}, [messages.length, dispatch]);

	// Scroll automatiquement vers le dernier message
	useEffect(() => {
		if (messages.length > 0 && flatListRef.current) {
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
	}, [messages.length, isLoading]);

	const handleSend = () => {
		if (message.trim()) {
			const currentStep = messages.length > 0 ? messages[messages.length - 1].currentStep : "user_message";
			sendMessage(message, currentStep);
			setMessage("");
		}
	};

	const handleRecord = () => {
		// Placeholder for audio recording
		console.log("Recording audio...");
	};

	const handleReset = () => {
		resetChat();
	};

	const handleOpenResetModal = () => {
		setShowResetModal(true);
	};

	const handleCloseResetModal = () => {
		setShowResetModal(false);
	};

	const renderMessage = ({ item }: { item: Message }) => (
		<View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
			<Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.botMessageText]}>{item.text}</Text>
			<Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<MaterialCommunityIcons name="robot" size={24} color="#9a8c98" />
					<Text style={styles.headerTitle}>Odyssai Assistant</Text>
				</View>
				<Pressable style={styles.resetButton} onPress={handleOpenResetModal}>
					<MaterialCommunityIcons name="delete-sweep" size={20} color="#e74c3c" />
				</Pressable>
			</View>

			{/* Messages Panel */}
			<View style={styles.messagesPanel}>
				<FlatList
					ref={flatListRef}
					data={messages}
					renderItem={renderMessage}
					keyExtractor={(item) => item.id}
					style={styles.messagesList}
					contentContainerStyle={styles.messagesContent}
					showsVerticalScrollIndicator={false}
				/>
				{/* Loading Indicator */}
				{isLoading && (
					<View style={styles.loadingIndicator}>
						<AIThinkingAdvanced />
					</View>
				)}
			</View>

			{/* Input Section */}
			<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputSection}>
				<View style={styles.inputContainer}>
					<TextInput
						style={styles.textInput}
						placeholder="Type your message..."
						placeholderTextColor="#9a8c98"
						value={message}
						onChangeText={setMessage}
						multiline
						maxLength={500}
					/>
					<View style={styles.buttonsContainer}>
						<Pressable style={[styles.actionButton, styles.sendButton]} onPress={handleSend}>
							<MaterialCommunityIcons name="send" size={20} color="#f2e9e4" />
						</Pressable>
						<Pressable style={[styles.actionButton, styles.recordButton]} onPress={handleRecord}>
							<MaterialCommunityIcons name="microphone" size={20} color="#f2e9e4" />
						</Pressable>
					</View>
				</View>
			</KeyboardAvoidingView>

			{/* Reset Modal */}
			<ResetModal visible={showResetModal} onClose={handleCloseResetModal} onConfirm={handleReset} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#4a4e69",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginLeft: 12,
	},
	resetButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#e74c3c",
	},
	messagesPanel: {
		flex: 1,
		paddingHorizontal: 16,
	},
	messagesList: {
		flex: 1,
	},
	messagesContent: {
		paddingVertical: 16,
	},
	messageContainer: {
		marginVertical: 8,
		maxWidth: "80%",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	userMessage: {
		alignSelf: "flex-end",
		backgroundColor: "#9a8c98",
	},
	botMessage: {
		alignSelf: "flex-start",
		backgroundColor: "#4a4e69",
	},
	messageText: {
		fontSize: 16,
		lineHeight: 22,
		marginBottom: 4,
	},
	userMessageText: {
		color: "#f2e9e4",
	},
	botMessageText: {
		color: "#f2e9e4",
	},
	timestamp: {
		fontSize: 12,
		color: "#c9ada7",
		textAlign: "right",
	},
	inputSection: {
		borderTopWidth: 1,
		borderTopColor: "#4a4e69",
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
	},
	textInput: {
		flex: 1,
		minHeight: 44,
		maxHeight: 100,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		borderRadius: 22,
		backgroundColor: "#4a4e69",
		borderWidth: 1,
		borderColor: "#9a8c98",
	},
	buttonsContainer: {
		flexDirection: "row",
		gap: 8,
	},
	actionButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	sendButton: {
		backgroundColor: "#9a8c98",
	},
	recordButton: {
		backgroundColor: "#c9ada7",
	},
	loadingIndicator: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		alignItems: "center",
	},
});
