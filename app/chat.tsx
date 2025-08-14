import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from "expo-audio";
import { SafeAreaView, View, Text, TextInput, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppSelector, useAppDispatch, useChatActions, Message, formatTimestamp, resetStore } from "../store";
import { ResetModal } from "../components/ResetModal";
import { AIThinkingAdvanced } from "../components/AIThinkingAdvanced";

export default function ChatScreen() {
	const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recorderState = useAudioRecorderState(audioRecorder);

	const dispatch = useAppDispatch();
	const messagesState = useAppSelector((state) => state.messages);
	const messages = messagesState?.messages || [];
	const isLoading = messagesState?.isLoading || false;
	const { sendMessage, resetChat } = useChatActions();

	const flatListRef = useRef<FlatList>(null);

	/* ---------------------------------------------------------------- */
	/*                            State hooks                           */
	/* ---------------------------------------------------------------- */

	const [message, setMessage] = useState("");
	const [showResetModal, setShowResetModal] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [justStoppedRecording, setJustStoppedRecording] = useState(false);

	/* ---------------------------------------------------------------- */
	/*                           Effect hooks                           */
	/* ---------------------------------------------------------------- */

	// Configuration initiale de l'audio
	useEffect(() => {
		const setupAudio = async () => {
			try {
				const status = await AudioModule.requestRecordingPermissionsAsync();
				if (!status.granted) {
					Alert.alert("Permission to access microphone was denied");
				}

				await setAudioModeAsync({
					playsInSilentMode: true,
					allowsRecording: true,
				});
			} catch (error) {
				console.error("Error setting up audio:", error);
			}
		};

		setupAudio();
	}, []);

	// Gestion de l'initialisation et du scroll des messages
	useEffect(() => {
		const handleMessagesUpdate = () => {
			if (messages.length === 0) {
				dispatch(resetStore());
			} else if (flatListRef.current) {
				setTimeout(() => {
					flatListRef.current?.scrollToEnd({ animated: true });
				}, 100);
			}
		};

		handleMessagesUpdate();
	}, [messages.length, dispatch, isLoading]);

	// Gestion de la transcription après arrêt de l'enregistrement
	useEffect(() => {
		const handleTranscription = () => {
			if (justStoppedRecording && !recorderState.isRecording && audioRecorder.uri) {
				setJustStoppedRecording(false);
				transcribeAudio(audioRecorder.uri);
			}
		};

		handleTranscription();
	}, [recorderState.isRecording, audioRecorder.uri, justStoppedRecording]);

	/* ---------------------------------------------------------------- */
	/*                             Functions                            */
	/* ---------------------------------------------------------------- */

	/* ----------------------------- Voice ---------------------------- */

	// Transcribe audio with whisper
	const transcribeAudio = async (audioUri: string) => {
		try {
			setIsTranscribing(true);

			// uri check
			if (!audioUri || audioUri.trim() === "") {
				throw new Error("Empty audio URI");
			}

			// Create FormData for sending the audio file
			const formData = new FormData();
			formData.append("file", {
				uri: audioUri,
				type: "audio/m4a",
				name: "audio.m4a",
			} as any);
			formData.append("model", "whisper-1");
			formData.append("language", "en");

			// Appel à l'API OpenAI (IMPORTANT: ne pas définir Content-Type manuellement)
			const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
				},
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("API Error:", errorText);
				throw new Error(`Error ${response.status}: ${errorText}`);
			}

			const result = await response.json();

			// Ajouter le texte transcrit au champ de saisie
			const transcribedText = result.text?.trim() || "";
			if (transcribedText) {
				setMessage((prevMessage) => {
					const newMessage = prevMessage ? `${prevMessage} ${transcribedText}` : transcribedText;
					return newMessage.trim();
				});
			} else {
				Alert.alert("Info", "No text detected");
			}
		} catch (error: any) {
			console.error("Error during transcription:", error);
			Alert.alert("Transcription Error", `Failed to transcribe audio: ${error.message}`);
		} finally {
			setIsTranscribing(false);
		}
	};

	// Record message
	const handleRecord = async () => {
		try {
			if (recorderState.isRecording) {
				console.log("Already recording");
				return;
			}

			await audioRecorder.prepareToRecordAsync();
			audioRecorder.record();
		} catch (error) {
			console.error("Error starting recording:", error);
			Alert.alert("Erreur", "Impossible de démarrer l'enregistrement");
		}
	};

	const stopRecording = async () => {
		try {
			if (!recorderState.isRecording) {
				console.log("Not currently recording");
				return;
			}

			console.log("Stopping recording...");
			setJustStoppedRecording(true);
			await audioRecorder.stop();
			console.log("Audio recording stopped.");
		} catch (error) {
			console.error("Error stopping recording:", error);
			setJustStoppedRecording(false);
			Alert.alert("Erreur", "Impossible d'arrêter l'enregistrement");
		}
	};

	/* ----------------------------- Text ----------------------------- */

	// Send text message
	const handleSend = () => {
		if (String(message).trim().length > 0) {
			const { currentStep } = messages[messages.length - 1];

			sendMessage(message, currentStep);
			setMessage("");
		}
	};

	/* ---------------------------------------------------------------- */
	/*                             Variables                            */
	/* ---------------------------------------------------------------- */

	const renderMessage = ({ item }: { item: Message }) => (
		<View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
			<Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.botMessageText]}>{item.text}</Text>
			<Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
		</View>
	);

	/* ---------------------------------------------------------------- */
	/*                                JSX                               */
	/* ---------------------------------------------------------------- */

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<MaterialCommunityIcons name="robot" size={24} color="#9a8c98" />
					<Text style={styles.headerTitle}>Odyssai Assistant</Text>
				</View>
				<Pressable style={styles.resetButton} onPress={() => setShowResetModal(true)}>
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
						editable={!isTranscribing}
					/>
					<View style={styles.buttonsContainer}>
						<Pressable style={[styles.actionButton, styles.sendButton]} onPress={handleSend} disabled={isTranscribing}>
							<MaterialCommunityIcons name="send" size={20} color="#f2e9e4" />
						</Pressable>
						<Pressable
							style={[styles.actionButton, styles.recordButton, isTranscribing && styles.transcribingButton]}
							onPress={() => (recorderState.isRecording ? stopRecording() : handleRecord())}
							disabled={isTranscribing}
						>
							<MaterialCommunityIcons
								name={isTranscribing ? "loading" : recorderState.isRecording ? "stop" : "microphone"}
								size={20}
								color={isTranscribing ? "#f39c12" : recorderState.isRecording ? "#e74c3c" : "#f2e9e4"}
							/>
						</Pressable>
					</View>
				</View>
				{isTranscribing && (
					<View style={styles.transcribingIndicator}>
						<Text style={styles.transcribingText}>Transcribing...</Text>
					</View>
				)}
			</KeyboardAvoidingView>

			{/* Reset Modal */}
			<ResetModal visible={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={resetChat} />
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
	transcribingIndicator: {
		paddingHorizontal: 16,
		paddingBottom: 8,
		alignItems: "center",
	},
	transcribingText: {
		fontSize: 12,
		color: "#f39c12",
		fontStyle: "italic",
	},
	transcribingButton: {
		backgroundColor: "#f39c12",
	},
});
