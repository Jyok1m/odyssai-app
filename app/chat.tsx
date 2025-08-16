import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert, Keyboard } from "react-native";
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from "expo-audio";
import { SafeAreaView, View, Text, TextInput, Pressable } from "@/components/Themed";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useAppSelector, useAppDispatch, useChatActions, Message, formatTimestamp, resetStore } from "../store";
import { clearUser } from "../store/reducers/userSlice";
import { ResetModal } from "../components/ResetModal";
import { LogoutConfModal } from "../components/LogoutConfModal";
import { MenuModal } from "../components/MenuModal";
import { GameDataModal } from "../components/GameDataModal";
import { AIThinkingAdvanced } from "../components/AIThinkingAdvanced";
import { useTTS } from "../hooks/useTTS";

// Composant MessageItem optimisé avec React.memo
interface MessageItemProps {
	item: Message;
	isTTSActive: boolean;
	isTTSPlaying: boolean;
	isTTSLoading: boolean;
	onTTSReplay: (id: string, text: string) => void;
}

const MessageItem = React.memo<MessageItemProps>(({ item, isTTSActive, isTTSPlaying, isTTSLoading, onTTSReplay }) => {
	return (
		<View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
			<View style={styles.messageContent}>
				<Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.botMessageText]} numberOfLines={0}>
					{item.text}
				</Text>
			</View>
			<View style={styles.messageFooter}>
				{item.isUser ? (
					<Text style={[styles.timestamp, styles.userTimestamp]}>{formatTimestamp(item.timestamp)}</Text>
				) : (
					<>
						<Text style={[styles.timestamp, styles.botTimestamp]}>{formatTimestamp(item.timestamp)}</Text>
						<Pressable
							style={({ pressed }) => [
								styles.ttsButton,
								isTTSActive && styles.ttsButtonActive,
								pressed && { backgroundColor: "#f39c12", borderColor: "#f39c12" },
								{ opacity: pressed ? 1 : isTTSLoading && !isTTSActive ? 0.5 : 1 },
							]}
							onPress={() => onTTSReplay(item.id, item.text)}
							disabled={isTTSLoading && !isTTSActive}
						>
							<MaterialCommunityIcons
								name={isTTSActive ? (isTTSPlaying ? "volume-high" : "loading") : "volume-medium"}
								size={16}
								color={isTTSActive ? "#f39c12" : "#c9ada7"}
							/>
						</Pressable>
					</>
				)}
			</View>
		</View>
	);
});

export default function ChatScreen() {
	const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recorderState = useAudioRecorderState(audioRecorder);

	const dispatch = useAppDispatch();
	const router = useRouter();
	const messagesState = useAppSelector((state) => state.messages);
	const messages = messagesState?.messages || [];
	const isLoading = messagesState?.isLoading || false;
	const { sendMessage, resetChat } = useChatActions();

	// TTS Hook - Initialize only after component mount
	const [isTTSReady, setIsTTSReady] = useState(false);
	const ttsHook = useTTS();

	// Destructure TTS hook only when ready
	const {
		isLoading: isTTSLoading,
		isPlaying: isTTSPlaying,
		currentItem: currentTTSItem,
		queue: ttsQueue,
		queueMessage: queueTTSMessage,
		playMessage: playTTSMessage,
		clearQueue: clearTTSQueue,
	} = isTTSReady
		? ttsHook
		: {
				isLoading: false,
				isPlaying: false,
				currentItem: null,
				queue: [],
				queueMessage: async () => {},
				playMessage: async () => {},
				clearQueue: () => {},
		  };

	const flatListRef = useRef<FlatList>(null);
	const seenMessageIds = useRef<Set<string>>(new Set());

	/* ---------------------------------------------------------------- */
	/*                            State hooks                           */
	/* ---------------------------------------------------------------- */

	const [message, setMessage] = useState("");
	const [showResetModal, setShowResetModal] = useState(false);
	const [showLogoutConfModal, setShowLogoutConfModal] = useState(false);
	const [showMenuModal, setShowMenuModal] = useState(false);
	const [showGameDataModal, setShowGameDataModal] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [justStoppedRecording, setJustStoppedRecording] = useState(false);
	const [typingDots, setTypingDots] = useState("");
	const [transcriptionController, setTranscriptionController] = useState<AbortController | null>(null);

	// Pagination des messages
	const [visibleMessagesCount, setVisibleMessagesCount] = useState(50); // Nombre de messages visibles initialement
	const [showLoadMore, setShowLoadMore] = useState(false);
	const MESSAGES_PER_LOAD = 25; // Nombre de messages à charger à chaque fois

	// Keyboard management
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	/* ---------------------------------------------------------------- */
	/*                           Effect hooks                           */
	/* ---------------------------------------------------------------- */

	// Configuration initiale de l'audio
	useEffect(() => {
		const setupAudio = async () => {
			try {
				const recordingStatus = await AudioModule.requestRecordingPermissionsAsync();
				if (!recordingStatus.granted) {
					Alert.alert("Access denied", "Microphone access is required to record voice messages. Please enable the permission in the app settings.", [
						{ text: "Cancel", style: "cancel" },
						{
							text: "Settings",
							onPress: () => {
								// On mobile, this would open app settings
								console.log("User should go to app settings to enable microphone permission");
							},
						},
					]);
					return;
				}

				await setAudioModeAsync({
					playsInSilentMode: true,
					allowsRecording: true,
				});

				setIsTTSReady(true);
			} catch (error) {
				console.error("❌ Error setting up audio:", error);
				Alert.alert(
					"Audio setup error",
					"Unable to set up audio. Voice recording will not be available.\n\nDDetails: " + (error instanceof Error ? error.message : String(error)),
					[{ text: "OK" }]
				);
			}
		};

		setupAudio();
	}, []);

	// Gestion du clavier
	useEffect(() => {
		const keyboardWillShow = (event: any) => {
			setIsKeyboardVisible(true);
			setKeyboardHeight(event.endCoordinates.height);

			// Scroll vers le bas quand le clavier s'ouvre
			setTimeout(() => {
				if (flatListRef.current) {
					flatListRef.current.scrollToEnd({ animated: true });
				}
			}, 100);
		};

		const keyboardWillHide = () => {
			setIsKeyboardVisible(false);
			setKeyboardHeight(0);
		};

		const keyboardDidShow = (event: any) => {
			// Double vérification pour s'assurer qu'on voit le dernier message
			setTimeout(() => {
				if (flatListRef.current) {
					flatListRef.current.scrollToEnd({ animated: true });
				}
			}, 200);
		};

		// Platform-specific listeners
		const showListener = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const hideListener = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

		const showSubscription = Keyboard.addListener(showListener, keyboardWillShow);
		const hideSubscription = Keyboard.addListener(hideListener, keyboardWillHide);
		const didShowSubscription = Keyboard.addListener("keyboardDidShow", keyboardDidShow);

		return () => {
			showSubscription?.remove();
			hideSubscription?.remove();
			didShowSubscription?.remove();
		};
	}, []);

	// Gestion de l'initialisation et du scroll des messages
	useEffect(() => {
		const handleMessagesUpdate = () => {
			if (messages.length === 0) {
				dispatch(resetStore());
				// Réinitialiser le set des messages vus quand on reset
				seenMessageIds.current.clear();
				setVisibleMessagesCount(50);
				setShowLoadMore(false);
			} else {
				// Au premier chargement, marquer tous les messages existants comme "vus"
				// pour éviter de jouer automatiquement les anciens messages
				if (seenMessageIds.current.size === 0 && messages.length > 0) {
					messages.forEach((message) => {
						if (!message.isUser) {
							seenMessageIds.current.add(message.id);
						}
					});
				}

				// Vérifier s'il y a plus de messages que ceux visibles
				setShowLoadMore(messages.length > visibleMessagesCount);

				// Auto-scroll pour les nouveaux messages
				if (flatListRef.current) {
					setTimeout(() => {
						flatListRef.current?.scrollToEnd({ animated: true });
					}, 100);
				}
			}
		};

		handleMessagesUpdate();
	}, [messages.length, dispatch, isLoading, visibleMessagesCount]);

	// Gestion TTS pour les nouveaux messages de l'IA
	useEffect(() => {
		const handleNewAIMessages = () => {
			if (visibleMessages.length > 0 && isTTSReady) {
				// Traiter tous les messages IA non vus
				visibleMessages.forEach((message: Message) => {
					// Si c'est un message de l'IA et qu'il n'est pas en cours de chargement
					if (!message.isUser && !isLoading && message?.text?.trim() !== "") {
						// Vérifier si ce message est vraiment nouveau (pas rechargé depuis le store)
						if (!seenMessageIds.current.has(message.id)) {
							seenMessageIds.current.add(message.id);
							queueTTSMessage(message.id, message.text);
						}
					}
				});
			}
		};

		handleNewAIMessages();
	}, [messages, isLoading, queueTTSMessage, isTTSReady, visibleMessagesCount]);

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

	// Animation des points pendant la transcription
	useEffect(() => {
		let interval: number;

		if (isTranscribing) {
			interval = setInterval(() => {
				setTypingDots((prev) => {
					if (prev === "") return ".";
					if (prev === ".") return "..";
					if (prev === "..") return "...";

					return "";
				});
			}, 500);
		} else {
			setTypingDots("");
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [isTranscribing]);

	/* ---------------------------------------------------------------- */
	/*                             Functions                            */
	/* ---------------------------------------------------------------- */

	/* ----------------------------- Voice ---------------------------- */

	// Transcribe audio with whisper
	const transcribeAudio = async (audioUri: string) => {
		let timeoutId: number | null = null;

		try {
			setIsTranscribing(true);

			// URI check
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

			// Créer un AbortController pour annuler la requête
			const controller = new AbortController();
			setTranscriptionController(controller);

			// Créer le timeout qui annule la requête
			timeoutId = setTimeout(() => {
				controller.abort();
			}, 30000) as any; // 30 secondes timeout

			// Faire la requête avec signal d'abort
			const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
				},
				body: formData,
				signal: controller.signal, // Important : permet d'annuler la requête
			});

			// Si on arrive ici, la requête a réussi - nettoyer le timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API Error ${response.status}: ${errorText}`);
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
				Alert.alert("Info", "No text detected in the audio");
			}
		} catch (error: any) {
			// Nettoyer le timeout en cas d'erreur
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			// Messages d'erreur plus spécifiques
			let errorMessage = "Failed to transcribe audio";

			if (error.name === "AbortError") {
				errorMessage = "Request was cancelled due to timeout. Try with text input for now.";
			} else if (error.message.includes("timeout") || error.message.includes("Network request timed out")) {
				errorMessage = "Request timed out. The audio might be too long or there's a network issue. Please try with text input for now.";
			} else if (error.message.includes("Network")) {
				errorMessage = "Network error. Please check your internet connection.";
			} else if (error.message.includes("401")) {
				errorMessage = "API authentication failed. Please check your OpenAI API key.";
			} else if (error.message.includes("429")) {
				errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
			} else if (error.message.includes("413")) {
				errorMessage = "Audio file too large. Try recording a shorter message.";
			}

			Alert.alert("Transcription Error", `${errorMessage}\n\nTechnical details: ${error.message}`);
		} finally {
			// Nettoyer le timeout dans tous les cas
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			setTranscriptionController(null);
			// console.log("🏁 Transcription process completed");
			setIsTranscribing(false);
		}
	};

	// Cancel transcription
	const cancelTranscription = () => {
		if (transcriptionController) {
			console.log("🚫 Cancelling transcription");
			transcriptionController.abort();
			setTranscriptionController(null);
		}
	};

	// Record message
	const handleRecord = async () => {
		try {
			if (recorderState.isRecording) {
				console.log("⚠️ Already recording");
				return;
			}

			const recordingStatus = await AudioModule.requestRecordingPermissionsAsync();
			if (!recordingStatus.granted) {
				Alert.alert("Permission required", "Microphone access is required to record. Please grant permission in settings.");
				return;
			}

			// Prepare the recorder
			await audioRecorder.prepareToRecordAsync();

			// Start recording
			await audioRecorder.record();
		} catch (error) {
			console.error("❌ Error starting recording:", error);

			let errorMessage = "Unable to start recording";
			if (error instanceof Error) {
				if (error.message.includes("permission")) {
					errorMessage = "Microphone permission denied. Please enable it in settings.";
				} else if (error.message.includes("busy") || error.message.includes("in use")) {
					errorMessage = "Microphone is being used by another application.";
				} else if (error.message.includes("hardware")) {
					errorMessage = "Hardware issue with the microphone.";
				} else {
					errorMessage = `Recording error: ${error.message}`;
				}
			}

			Alert.alert("Recording Error", errorMessage);
		}
	};

	const stopRecording = async () => {
		try {
			if (!recorderState.isRecording) {
				console.log("⚠️ Not currently recording");
				return;
			}

			setJustStoppedRecording(true);
			await audioRecorder.stop();
		} catch (error) {
			setJustStoppedRecording(false);

			let errorMessage = "Unable to stop recording";
			if (error instanceof Error) {
				errorMessage = `Error: ${error.message}`;
			}

			Alert.alert("Stop Error", errorMessage);
		}
	};

	/* ----------------------------- Text ----------------------------- */

	// Send text message
	const handleSend = () => {
		if (String(message).trim().length > 0) {
			const { currentStep } = visibleMessages.length > 0 ? visibleMessages[visibleMessages.length - 1] : { currentStep: "ask_new_world" };

			sendMessage(message, currentStep);
			setMessage("");
		}
	};

	/* ----------------------------- TTS ------------------------------ */

	// Handle TTS replay for a specific message
	const handleTTSReplay = useCallback(
		async (messageId: string, messageText: string) => {
			// console.log(`Replaying TTS for message: ${messageId}`);
			await playTTSMessage(messageId, messageText);
		},
		[playTTSMessage]
	);

	// Handle reset chat with TTS cleanup
	const handleResetChat = () => {
		// console.log("Resetting chat and clearing TTS queue");
		clearTTSQueue();
		seenMessageIds.current.clear();
		resetChat();
	};

	/* ----------------------------- Menu/Game Data ------------------- */

	// Extract game data from messages and store
	const getGameData = () => {
		const gameDataState = useAppSelector((state) => state.gameData);

		// Extract data from store with correct property names
		let characterName = gameDataState?.character_name;
		let worldName = gameDataState?.world_name;

		// If no data in store, try to extract from messages
		if (!characterName || !worldName) {
			for (const message of messages) {
				if (message.isUser && !characterName) {
					// Simple heuristic: if user message contains "name is" or similar
					const nameMatch = message.text.match(/(?:name is|i'm|im|my name is)\s+([a-zA-Z]+)/i);
					if (nameMatch) {
						characterName = nameMatch[1];
					}
				}

				if (message.text.includes("world") && !worldName) {
					// Try to extract world name from AI responses
					const worldMatch = message.text.match(/world\s+(?:of\s+|called\s+)?([A-Z][a-zA-Z\s]+)/i);
					if (worldMatch) {
						worldName = worldMatch[1].trim();
					}
				}
			}
		}

		const result = {
			characterName,
			worldName,
		};

		return result;
	};

	// Handle menu modal actions
	const handleViewGameData = () => {
		setShowGameDataModal(true);
	};

	const handleLogout = () => {
		dispatch(clearUser());
		clearTTSQueue(); // Nettoyer la queue TTS
		seenMessageIds.current.clear();
		router.replace("/"); // Rediriger vers l'écran d'accueil
	};

	/* ----------------------------- Message Pagination -------------- */

	// Charger plus de messages
	const loadMoreMessages = () => {
		const newCount = Math.min(visibleMessagesCount + MESSAGES_PER_LOAD, messages.length);
		setVisibleMessagesCount(newCount);
	};

	// Calculer les messages visibles (les plus récents) avec useMemo pour optimiser les performances
	const visibleMessages = useMemo(() => {
		const totalMessages = messages.length;
		if (totalMessages <= visibleMessagesCount) {
			return messages;
		}

		// Prendre les derniers messages (les plus récents)
		const startIndex = Math.max(0, totalMessages - visibleMessagesCount);
		return messages.slice(startIndex);
	}, [messages, visibleMessagesCount]);

	// Gérer le scroll pour détecter le haut de la liste
	const handleScroll = (event: any) => {
		const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

		// Si on scroll vers le haut et qu'on est proche du début
		if (contentOffset.y <= 100 && showLoadMore) {
			loadMoreMessages();
		}
	};

	/* ---------------------------------------------------------------- */
	/*                             Variables                            */
	/* ---------------------------------------------------------------- */

	const renderMessage = useCallback(
		({ item }: { item: Message }) => {
			const isTTSActive = currentTTSItem?.id === item.id;

			return (
				<MessageItem item={item} isTTSActive={isTTSActive} isTTSPlaying={isTTSPlaying} isTTSLoading={isTTSLoading} onTTSReplay={handleTTSReplay} />
			);
		},
		[currentTTSItem?.id, isTTSPlaying, isTTSLoading, handleTTSReplay]
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
				<Pressable style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.6 : 1 }]} onPress={() => setShowMenuModal(true)}>
					<MaterialCommunityIcons name="menu" size={20} color="#9a8c98" />
				</Pressable>
			</View>

			{/* Main Content with Keyboard Avoiding */}
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardAvoidingContainer}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
			>
				{/* Messages Panel */}
				<View style={[styles.messagesPanel, { paddingBottom: isKeyboardVisible ? 10 : 0 }]}>
					{/* Load More Indicator */}
					{showLoadMore && (
						<View style={styles.loadMoreIndicator}>
							<Pressable style={styles.loadMoreButton} onPress={loadMoreMessages}>
								<MaterialCommunityIcons name="chevron-up" size={16} color="#9a8c98" />
								<Text style={styles.loadMoreText}>Load more ({messages.length - visibleMessagesCount} older messages)</Text>
							</Pressable>
						</View>
					)}

					<FlatList
						ref={flatListRef}
						data={visibleMessages}
						renderItem={renderMessage}
						keyExtractor={(item) => item.id}
						style={styles.messagesList}
						contentContainerStyle={styles.messagesContent}
						showsVerticalScrollIndicator={false}
						onScroll={handleScroll}
						scrollEventThrottle={400}
						removeClippedSubviews={true}
						initialNumToRender={10}
						maxToRenderPerBatch={5}
						updateCellsBatchingPeriod={50}
						windowSize={10}
						getItemLayout={undefined}
					/>
					{/* Loading Indicator */}
					{isLoading && (
						<View style={styles.loadingIndicator}>
							<AIThinkingAdvanced />
						</View>
					)}
				</View>

				{/* Input Section */}
				<View style={styles.inputSection}>
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.textInput}
							placeholder="Type your message..."
							placeholderTextColor="#9a8c98"
							value={isTranscribing ? typingDots : message}
							onChangeText={setMessage}
							multiline
							maxLength={500}
							editable={!isTranscribing}
						/>
						<View style={styles.buttonsContainer}>
							<Pressable
								style={({ pressed }) => [styles.actionButton, styles.sendButton, { opacity: pressed ? 0.6 : isTranscribing ? 0.5 : 1 }]}
								onPress={handleSend}
								disabled={isTranscribing}
							>
								<MaterialCommunityIcons name="send" size={20} color="#f2e9e4" />
							</Pressable>
							<Pressable
								style={({ pressed }) => [styles.actionButton, styles.recordButton, { opacity: pressed ? 0.6 : 1 }]}
								onPress={() => (recorderState.isRecording ? stopRecording() : isTranscribing ? cancelTranscription() : handleRecord())}
								disabled={isTranscribing}
							>
								<MaterialCommunityIcons
									name={recorderState.isRecording ? "stop" : isTranscribing ? "close" : "microphone"}
									size={20}
									color={recorderState.isRecording ? "#e74c3c" : isTranscribing ? "#e74c3c" : "#f2e9e4"}
								/>
							</Pressable>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>

			{/* Reset Modal */}
			<ResetModal visible={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={handleResetChat} />

			<LogoutConfModal visible={showLogoutConfModal} onClose={() => setShowLogoutConfModal(false)} onConfirm={handleLogout} />

			{/* Menu Modal */}
			<MenuModal
				visible={showMenuModal}
				onClose={() => setShowMenuModal(false)}
				onResetConversation={() => {
					setShowMenuModal(false);
					setShowResetModal(true);
				}}
				onViewGameData={handleViewGameData}
				onLogout={() => setShowLogoutConfModal(true)}
			/>

			{/* Game Data Modal */}
			<GameDataModal visible={showGameDataModal} onClose={() => setShowGameDataModal(false)} gameData={getGameData()} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	keyboardAvoidingContainer: {
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
		borderColor: "#9a8c98",
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
	messageContent: {
		width: "100%",
		backgroundColor: "transparent",
	},
	messageText: {
		fontSize: 16,
		lineHeight: 22,
		flexWrap: "wrap",
		flexShrink: 1,
		marginBottom: 8,
	},
	messageFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		marginTop: 4,
		paddingHorizontal: 4,
		backgroundColor: "transparent",
	},
	userMessage: {
		alignSelf: "flex-end",
		backgroundColor: "#9a8c98",
	},
	botMessage: {
		alignSelf: "flex-start",
		backgroundColor: "#4a4e69",
	},
	userMessageText: {
		color: "#f2e9e4",
		backgroundColor: "inherit",
	},
	botMessageText: {
		color: "#f2e9e4",
		backgroundColor: "inherit",
	},
	timestamp: {
		fontSize: 11,
		textAlign: "left",
		flexShrink: 1,
		backgroundColor: "inherit",
	},
	userTimestamp: {
		color: "#FFFFFF",
		textAlign: "right",
		width: "100%",
		opacity: 1,
		fontWeight: "500",
	},
	botTimestamp: {
		color: "#C9ADA7",
		textAlign: "left",
		opacity: 0.8,
	},
	ttsButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(201, 173, 167, 0.3)",
		borderWidth: 1,
		borderColor: "rgba(201, 173, 167, 0.5)",
	},
	ttsButtonActive: {
		backgroundColor: "rgba(243, 156, 18, 0.4)",
		borderColor: "#f39c12",
	},
	ttsQueueIndicator: {
		marginTop: 4,
		paddingHorizontal: 8,
		paddingVertical: 2,
		backgroundColor: "rgba(243, 156, 18, 0.2)",
		borderRadius: 8,
		alignSelf: "flex-start",
	},
	ttsQueueText: {
		fontSize: 10,
		color: "#f39c12",
		fontStyle: "italic",
	},
	ttsStatusIndicator: {
		position: "absolute",
		top: 100,
		left: 16,
		right: 16,
		backgroundColor: "rgba(74, 78, 105, 0.95)",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		borderWidth: 1,
		borderColor: "#f39c12",
	},
	ttsStatusText: {
		flex: 1,
		fontSize: 12,
		color: "#f39c12",
		fontWeight: "500",
	},
	ttsStopButton: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(231, 76, 60, 0.2)",
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
	transcriptionIndicator: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: "rgba(243, 156, 18, 0.1)",
		borderRadius: 8,
		marginHorizontal: 16,
		marginBottom: 8,
		gap: 8,
	},
	transcriptionText: {
		fontSize: 14,
		color: "#f39c12",
		fontWeight: "500",
	},
	cancelButton: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(231, 76, 60, 0.2)",
		borderWidth: 1,
		borderColor: "#e74c3c",
	},
	debugInfo: {
		backgroundColor: "rgba(243, 156, 18, 0.1)",
		padding: 8,
		margin: 8,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "#f39c12",
	},
	debugText: {
		fontSize: 10,
		color: "#f39c12",
		fontFamily: "monospace",
	},
	loadMoreIndicator: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		alignItems: "center",
	},
	loadMoreButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(154, 140, 152, 0.1)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(154, 140, 152, 0.3)",
		gap: 6,
	},
	loadMoreText: {
		fontSize: 12,
		color: "#9a8c98",
		fontWeight: "500",
	},
});
