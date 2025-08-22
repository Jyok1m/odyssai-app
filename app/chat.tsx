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
import { useI18n } from "../hooks/useI18n";
import { v4 as uuidv4 } from "uuid";
import { getCurrentTimestamp } from "../store/utils/utils";
import { useToast } from "@/hooks/useToast";
import { ActionButtons } from "@/components/ActionButtons";

// Composant TTSButton séparé pour une meilleure optimisation
interface TTSButtonProps {
	isTTSActive: boolean;
	isTTSPlaying: boolean;
	isTTSLoading: boolean;
	onTTSReplay: () => void;
}

const TTSButton = React.memo<TTSButtonProps>(
	({ isTTSActive, isTTSPlaying, isTTSLoading, onTTSReplay }) => {
		// Mémoiser les propriétés de l'icône TTS
		const ttsIconProps = useMemo(
			() => ({
				name: isTTSActive ? (isTTSPlaying ? "volume-high" : "loading") : ("volume-medium" as any),
				size: 16,
				color: isTTSActive ? "#f39c12" : "#c9ada7",
			}),
			[isTTSActive, isTTSPlaying]
		);

		return (
			<Pressable
				style={({ pressed }) => [
					styles.ttsButton,
					isTTSActive && styles.ttsButtonActive,
					pressed && { backgroundColor: "#f39c12", borderColor: "#f39c12" },
					{ opacity: pressed ? 1 : isTTSLoading && !isTTSActive ? 0.5 : 1 },
				]}
				onPress={onTTSReplay}
				disabled={isTTSLoading && !isTTSActive}
			>
				<MaterialCommunityIcons {...ttsIconProps} />
			</Pressable>
		);
	},
	// Fonction de comparaison pour TTSButton
	(prevProps, nextProps) => {
		return (
			prevProps.isTTSActive === nextProps.isTTSActive &&
			prevProps.isTTSPlaying === nextProps.isTTSPlaying &&
			prevProps.isTTSLoading === nextProps.isTTSLoading
		);
	}
);

// Composant MessageItem optimisé avec React.memo et fonction de comparaison personnalisée
interface MessageItemProps {
	item: Message;
	isTTSActive: boolean;
	isTTSPlaying: boolean;
	isTTSLoading: boolean;
	isTTSEnabled: boolean;
	onTTSReplay: (id: string, text: string) => void;
}

const MessageItem = React.memo<MessageItemProps>(
	({ item, isTTSActive, isTTSPlaying, isTTSLoading, isTTSEnabled, onTTSReplay }) => {
		// Mémoiser les styles pour éviter la re-création à chaque render
		const messageContainerStyle = useMemo(() => [styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage], [item.isUser]);

		const messageTextStyle = useMemo(() => [styles.messageText, item.isUser ? styles.userMessageText : styles.botMessageText], [item.isUser]);

		const timestampStyle = useMemo(() => [styles.timestamp, item.isUser ? styles.userTimestamp : styles.botTimestamp], [item.isUser]);

		// Mémoiser le timestamp formaté
		const formattedTimestamp = useMemo(() => formatTimestamp(item.timestamp), [item.timestamp]);

		// Mémoiser la fonction de rappel TTS
		const handleTTSReplay = useCallback(() => {
			onTTSReplay(item.id, item.text);
		}, [item.id, item.text, onTTSReplay]);

		return (
			<View style={messageContainerStyle}>
				<View style={styles.messageContent}>
					<Text style={messageTextStyle} numberOfLines={0}>
						{item.text}
					</Text>
				</View>
				<View style={styles.messageFooter}>
					{item.isUser ? (
						<Text style={timestampStyle}>{formattedTimestamp}</Text>
					) : (
						<>
							<Text style={timestampStyle}>{formattedTimestamp}</Text>
							{isTTSEnabled && (
								<TTSButton isTTSActive={isTTSActive} isTTSPlaying={isTTSPlaying} isTTSLoading={isTTSLoading} onTTSReplay={handleTTSReplay} />
							)}
						</>
					)}
				</View>
			</View>
		);
	},
	// Fonction de comparaison personnalisée pour optimiser les re-rendus
	(prevProps, nextProps) => {
		// Comparer les propriétés essentielles
		if (prevProps.item.id !== nextProps.item.id) return false;
		if (prevProps.item.text !== nextProps.item.text) return false;
		if (prevProps.item.isUser !== nextProps.item.isUser) return false;
		if (prevProps.item.timestamp !== nextProps.item.timestamp) return false;
		if (prevProps.isTTSActive !== nextProps.isTTSActive) return false;
		if (prevProps.isTTSPlaying !== nextProps.isTTSPlaying) return false;
		if (prevProps.isTTSLoading !== nextProps.isTTSLoading) return false;
		if (prevProps.isTTSEnabled !== nextProps.isTTSEnabled) return false;

		return true; // Les props sont identiques, pas besoin de re-render
	}
);

export default function ChatScreen() {
	const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recorderState = useAudioRecorderState(audioRecorder);

	const toast = useToast();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const userState = useAppSelector((state) => state.user);
	const { user_uuid, username } = userState;
	const messagesState = useAppSelector((state) => state.messages);
	const gameDataState = useAppSelector((state) => state.gameData);
	const messages = messagesState?.messages || [];
	const isLoading = messagesState?.isLoading || false;
	const { sendMessage, resetChat } = useChatActions();
	const { t, currentLanguage } = useI18n();

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

	// Fonction pour forcer le scroll vers le bas
	const scrollToBottom = useCallback((animated = true) => {
		if (flatListRef.current) {
			flatListRef.current.scrollToEnd({ animated });
		}
	}, []);

	/* ---------------------------------------------------------------- */
	/*                            State hooks                           */
	/* ---------------------------------------------------------------- */

	const [message, setMessage] = useState("");
	const [ctaValue, setctaValue] = useState<string | undefined>(undefined);
	const [showResetModal, setShowResetModal] = useState(false);
	const [showLogoutConfModal, setShowLogoutConfModal] = useState(false);
	const [showMenuModal, setShowMenuModal] = useState(false);
	const [showGameDataModal, setShowGameDataModal] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [justStoppedRecording, setJustStoppedRecording] = useState(false);
	const [typingDots, setTypingDots] = useState("");
	const [transcriptionController, setTranscriptionController] = useState<AbortController | null>(null);
	const [isStartingRecord, setIsStartingRecord] = useState(false);
	const [isRecordingManually, setIsRecordingManually] = useState(false);
	const [pendingTranscriptionUri, setPendingTranscriptionUri] = useState<string | null>(null);
	const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

	// Pagination des messages - DÉSACTIVÉE
	// const [visibleMessagesCount, setVisibleMessagesCount] = useState(50);
	// const [showLoadMore, setShowLoadMore] = useState(false);
	// const MESSAGES_PER_LOAD = 25;

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
					toast.error(t("chat.errors.microphonePermission"));
					return;
				}

				await setAudioModeAsync({
					playsInSilentMode: true,
					allowsRecording: true,
				});

				setIsTTSReady(true);
			} catch (error) {
				toast.error(t("chat.errors.audioSetup") + (error instanceof Error ? error.message : String(error)));
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
				scrollToBottom(true);
			}, 100);
		};

		const keyboardWillHide = () => {
			setIsKeyboardVisible(false);
			setKeyboardHeight(0);
		};

		const keyboardDidShow = (event: any) => {
			// Double vérification pour s'assurer qu'on voit le dernier message
			setTimeout(() => {
				scrollToBottom(true);
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

	// État pour tracker si on est en train de charger plus de messages
	// const isLoadingMore = useRef(false);  // DÉSACTIVÉ
	const previousMessageLength = useRef(0);

	// Gestion de l'initialisation et du scroll des messages - SIMPLIFIÉ
	useEffect(() => {
		const handleMessagesUpdate = () => {
			if (messages.length === 0) {
				dispatch(resetStore());
				seenMessageIds.current.clear();
				previousMessageLength.current = 0;
			} else {
				// Au premier chargement, marquer tous les messages existants comme "vus"
				if (seenMessageIds.current.size === 0 && messages.length > 0) {
					messages.forEach((message) => {
						if (!message.isUser) {
							seenMessageIds.current.add(message.id);
						}
					});
					previousMessageLength.current = messages.length;
				}

				// SEULEMENT scroll vers le bas si :
				// 1. Ce n'est pas en cours de chargement des messages API
				// 2. Le nombre de messages a vraiment augmenté (nouveaux messages)
				const hasNewMessages = messages.length > previousMessageLength.current;

				if (!isLoading && hasNewMessages) {
					setTimeout(() => {
						scrollToBottom(true);
					}, 100);
				}

				previousMessageLength.current = messages.length;
			}
		};

		handleMessagesUpdate();
	}, [messages, dispatch, isLoading, scrollToBottom]);

	// Scroll initial au montage du composant - AMÉLIORE
	useEffect(() => {
		// Scroll initial plus agressif pour s'assurer qu'on voit les derniers messages
		const timer1 = setTimeout(() => {
			scrollToBottom(false); // Pas d'animation au début
		}, 50);

		const timer2 = setTimeout(() => {
			scrollToBottom(false); // Double vérification
		}, 200);

		const timer3 = setTimeout(() => {
			scrollToBottom(true); // Avec animation pour finaliser
		}, 500);

		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
			clearTimeout(timer3);
		};
	}, []); // Se déclenche uniquement au montage

	// Gestion TTS pour les nouveaux messages de l'IA
	useEffect(() => {
		const handleNewAIMessages = () => {
			if (visibleMessages.length > 0 && isTTSReady && userState.ttsEnabled) {
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
	}, [messages, isLoading, queueTTSMessage, isTTSReady, userState.ttsEnabled]);

	// Gestion de la transcription après arrêt de l'enregistrement
	useEffect(() => {
		const handleTranscription = async () => {
			if (pendingTranscriptionUri) {
				const uriToTranscribe = pendingTranscriptionUri;
				setPendingTranscriptionUri(null); // Nettoyer immédiatement
				await transcribeAudio(uriToTranscribe);
			}
		};

		handleTranscription();
	}, [pendingTranscriptionUri]);

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

	/* ----------------------------- Database Utils ------------------ */

	// Fonction pour envoyer les messages par défaut en base de données
	const sendDefaultMessagesToDatabase = async (userUuid: string) => {
		const timestamp1 = getCurrentTimestamp();
		await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 1000));
		const timestamp2 = getCurrentTimestamp();
		const defaultMessagesEn = [
			{
				id: uuidv4(),
				currentStep: "welcome",
				text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
				isUser: false,
				timestamp: timestamp1,
			},
			{
				id: uuidv4(),
				currentStep: "cta_ask_new_world",
				text: "Do you wish to create a new world?",
				isUser: false,
				timestamp: timestamp2,
			},
		];

		const defaultMessagesFr = [
			{
				id: uuidv4(),
				currentStep: "welcome",
				text: "Bienvenue dans Odyssai. Commencez par répondre à quelques questions et nous allons commencer !",
				isUser: false,
				timestamp: timestamp1,
			},
			{
				id: uuidv4(),
				currentStep: "cta_ask_new_world",
				text: "Souhaitez-vous créer un nouveau monde ?",
				isUser: false,
				timestamp: timestamp2,
			},
		];

		const defaultMessages = currentLanguage === "fr" ? defaultMessagesFr : defaultMessagesEn;

		// Envoyer chaque message par défaut en base de données
		for (const message of defaultMessages) {
			try {
				await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/interaction?lang=${currentLanguage}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						user_uuid: userUuid,
						message,
						world_id: null,
						character_id: null,
						interaction_source: "ai",
					}),
				});
			} catch (error) {
				console.error("Error saving default message to database:", error);
				// Continue même en cas d'erreur pour ne pas bloquer l'utilisateur
			}
		}
	};

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

			// Vérifier si le fichier existe (React Native)
			try {
				const FileSystem = require("expo-file-system");
				const fileInfo = await FileSystem.getInfoAsync(audioUri);

				if (!fileInfo.exists) {
					throw new Error("Audio file does not exist");
				}

				if (fileInfo.size === 0) {
					throw new Error("Audio file is empty (0 bytes)");
				}
			} catch (fsError) {
				console.warn("⚠️ Could not check file info:", fsError);
			}

			// Create FormData for sending the audio file
			const formData = new FormData();
			formData.append("file", {
				uri: audioUri,
				type: "audio/m4a",
				name: "audio.m4a",
			} as any);
			formData.append("model", "whisper-1");
			formData.append("language", currentLanguage);

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
				toast.error(t("chat.errors.noTextDetected"));
			}
		} catch (error: any) {
			// Nettoyer le timeout en cas d'erreur
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			// Messages d'erreur plus spécifiques

			let errorMessage = t("chat.errors.transcriptionFailed");

			if (error.name === "AbortError") {
				errorMessage = t("chat.errors.requestCancelled");
			} else if (error.message.includes("timeout") || error.message.includes("Network request timed out")) {
				errorMessage = t("chat.errors.requestTimeout");
			} else if (error.message.includes("Network")) {
				errorMessage = t("chat.errors.networkError");
			} else if (error.message.includes("401")) {
				errorMessage = t("chat.errors.apiAuthFailed");
			} else if (error.message.includes("429")) {
				errorMessage = t("chat.errors.rateLimitExceeded");
			} else if (error.message.includes("413")) {
				errorMessage = t("chat.errors.audioTooLarge");
			} else if (error.message.includes("could not be decoded")) {
				errorMessage = "Audio file format not supported or corrupted";
			} else if (error.message.includes("Audio file does not exist")) {
				errorMessage = "Audio file not found";
			} else if (error.message.includes("Audio file is empty")) {
				errorMessage = "Audio file is empty - try recording again";
			}

			toast.error(errorMessage);
		} finally {
			// Nettoyer le timeout dans tous les cas
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			setTranscriptionController(null);
			setIsTranscribing(false);
		}
	};

	// Cancel transcription
	const cancelTranscription = () => {
		if (transcriptionController) {
			transcriptionController.abort();
			setTranscriptionController(null);
		}
	};

	// Record message
	const handleRecord = async () => {
		try {
			if (recorderState.isRecording || isStartingRecord || isRecordingManually) {
				return;
			}

			setIsStartingRecord(true);
			setIsRecordingManually(true);
			// Réinitialiser l'état avant de commencer un nouvel enregistrement
			setJustStoppedRecording(false);
			setPendingTranscriptionUri(null);

			const recordingStatus = await AudioModule.requestRecordingPermissionsAsync();
			if (!recordingStatus.granted) {
				toast.error(t("chat.errors.microphonePermissionDenied"));
				setIsStartingRecord(false);
				setIsRecordingManually(false);
				return;
			}

			// Forcer l'arrêt complet et le nettoyage de l'enregistreur
			try {
				await audioRecorder.stop();
			} catch (e) {
				console.log("📝 No active recording to stop");
			}

			// Attendre plus longtemps pour s'assurer du nettoyage complet
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Forcer la réinitialisation de l'audio mode
			await setAudioModeAsync({
				playsInSilentMode: true,
				allowsRecording: true,
				// Forcer le reset
			});

			// Prepare the recorder avec les options par défaut
			await audioRecorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);

			// Start recording
			audioRecorder.record();

			// Marquer le temps de début d'enregistrement
			setRecordingStartTime(Date.now());
			setIsStartingRecord(false);
		} catch (error) {
			console.error("❌ Error starting recording:", error);
			setIsStartingRecord(false);
			setIsRecordingManually(false);

			let errorMessage = t("chat.errors.recordingStartFailed");
			if (error instanceof Error) {
				if (error.message.includes("permission")) {
					errorMessage = t("chat.errors.microphonePermissionDenied");
				} else if (error.message.includes("busy") || error.message.includes("in use")) {
					errorMessage = t("chat.errors.microphoneBusy");
				} else if (error.message.includes("hardware")) {
					errorMessage = t("chat.errors.microphoneHardware");
				} else {
					errorMessage = `${t("chat.errors.recordingError")}: ${error.message}`;
				}
			}

			toast.error(errorMessage);
		}
	};

	const stopRecording = async () => {
		try {
			if (!recorderState.isRecording && !isRecordingManually) {
				return;
			}

			// Protection : ne pas arrêter si on est encore en train de démarrer
			if (isStartingRecord) {
				return;
			}

			setIsRecordingManually(false);

			// Vérifier la durée pour éviter les fichiers trop petits
			const recordingDuration = recordingStartTime ? Date.now() - recordingStartTime : 0;

			setRecordingStartTime(null);

			// Arrêter l'enregistrement d'abord
			await audioRecorder.stop();

			// Attendre un délai pour s'assurer que le fichier est complètement écrit
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Capturer l'URI après l'arrêt et le délai
			const currentUri = audioRecorder.uri;

			// Ne transcrire que si l'enregistrement est assez long
			if (recordingDuration >= 300) {
				// 300ms minimum
				// Utiliser l'URI capturée pour la transcription
				if (currentUri) {
					setPendingTranscriptionUri(currentUri);
				} else {
					console.warn("⚠️ No URI available after recording stop");
				}
			} else {
				toast.error("Recording too short - hold the button longer");
			}
		} catch (error) {
			console.error("❌ Error stopping recording:", error);
			setJustStoppedRecording(false);
			setIsRecordingManually(false);
			setRecordingStartTime(null);

			let errorMessage = "Unable to stop recording";
			if (error instanceof Error) {
				errorMessage = `Error: ${error.message}`;
			}

			toast.error(errorMessage);
		}
	};

	/* ----------------------------- Text ----------------------------- */

	// Handle text change with auto scroll
	const handleTextChange = useCallback(
		(text: string) => {
			setMessage(text);

			// Scroll vers le bas quand l'utilisateur commence à taper
			// Seulement si le clavier est visible pour éviter les scrolls inutiles
			if (isKeyboardVisible) {
				setTimeout(() => {
					scrollToBottom(true);
				}, 50);
			}
		},
		[isKeyboardVisible, scrollToBottom]
	);

	// Handle input focus with auto scroll
	const handleInputFocus = useCallback(() => {
		// Scroll vers le bas quand l'utilisateur focus sur l'input
		setTimeout(() => {
			scrollToBottom(true);
		}, 100);
	}, [scrollToBottom]);

	// Send text message
	const handleSend = () => {
		if (String(message).trim().length > 0) {
			const { currentStep } = visibleMessages.length > 0 ? visibleMessages[visibleMessages.length - 1] : { currentStep: "cta_ask_new_world" };

			sendMessage(message, currentStep);
			setMessage("");

			// Force scroll après envoi du message
			setTimeout(() => scrollToBottom(true), 100);
		}
	};

	// Send text message
	const handleSendCta = (ctaMessage: string, ctaValue: string) => {
		if (String(ctaMessage).trim().length > 0) {
			const { currentStep } = visibleMessages.length > 0 ? visibleMessages[visibleMessages.length - 1] : { currentStep: "cta_ask_new_world" };
			sendMessage(ctaMessage, currentStep, ctaValue);

			// Force scroll après envoi du message CTA
			setTimeout(() => scrollToBottom(true), 100);
		}
	};

	/* ----------------------------- TTS ------------------------------ */

	// Handle TTS replay for a specific message - optimisé pour éviter les re-créations
	const handleTTSReplay = useCallback(
		async (messageId: string, messageText: string) => {
			await playTTSMessage(messageId, messageText);
		},
		[playTTSMessage]
	);

	// Handle reset chat with TTS cleanup
	const handleResetChat = async () => {
		if (!user_uuid) {
			toast.error(t("auth.errors.userNotAuthenticated"));
			return;
		}

		const response1 = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/clear-data?lang=${currentLanguage}`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user_uuid }),
		});

		const data1 = await response1.json();

		const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/delete-interactions?lang=${currentLanguage}`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user_uuid }),
		});

		const data = await response.json();

		if (response.status !== 200) {
			toast.error(data.error || t("chat.errors.resetChatFailed"));
			return;
		} else if (response1.status !== 200) {
			toast.error(data1.error || t("chat.errors.resetChatFailed"));
			return;
		}

		// Clear TTS and reset local state
		clearTTSQueue();
		seenMessageIds.current.clear();
		resetChat();

		// Renvoi des messages par défaut en base de données
		await sendDefaultMessagesToDatabase(user_uuid);
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

				if (message.text?.includes("world") && !worldName) {
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

	const handleLogout = async () => {
		try {
			// Save current game data
			await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/add-data?lang=${currentLanguage}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user_uuid, ...gameDataState }),
			});

			resetChat();
			dispatch(clearUser());
			clearTTSQueue(); // Nettoyer la queue TTS
			seenMessageIds.current.clear();
			router.replace("/"); // Rediriger vers l'écran d'accueil
		} catch (error: any) {
			toast.error(error.message || t("chat.errors.saveGameDataFailed"));
		}
	};

	/* ----------------------------- Message Pagination - DÉSACTIVÉ -------------- */

	// Montrer tous les messages maintenant (pas de pagination)
	const visibleMessages = messages; // Gérer le scroll - SIMPLIFIÉ (plus de détection load more)
	const handleScroll = (event: any) => {
		// Plus de logique de load more - juste un handler vide pour la FlatList
	};
	useEffect(() => {
		(async () => {
			if (username) {
				const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/check-username?username=${username}`);
				const data = await response.json();
				if (!data.exists) {
					resetChat();
					dispatch(clearUser());
					clearTTSQueue(); // Nettoyer la queue TTS
					seenMessageIds.current.clear();
					router.replace("/"); // Rediriger vers l'écran d'accueil
				}
			}
		})();
	}, [username]);

	/* ---------------------------------------------------------------- */
	/*                             Variables                            */
	/* ---------------------------------------------------------------- */

	// Optimisation de la fonction renderMessage avec useCallback et dépendances stables
	const renderMessage = useCallback(
		({ item }: { item: Message }) => {
			const isTTSActive = currentTTSItem?.id === item.id;

			return (
				<MessageItem
					item={item}
					isTTSActive={isTTSActive}
					isTTSPlaying={isTTSPlaying}
					isTTSLoading={isTTSLoading}
					isTTSEnabled={userState.ttsEnabled}
					onTTSReplay={handleTTSReplay}
				/>
			);
		},
		[currentTTSItem?.id, isTTSPlaying, isTTSLoading, userState.ttsEnabled, handleTTSReplay]
	);

	// Fonction keyExtractor optimisée
	const keyExtractor = useCallback((item: Message) => item.id, []);

	/* ---------------------------------------------------------------- */
	/*                            CTA BUTTON                            */
	/* ---------------------------------------------------------------- */

	const ctaSteps = [
		"cta_ask_new_world",
		"cta_ask_world",
		"cta_ask_new_character",
		"cta_ask_new_world_bis",
		"cta_ask_create_world",
		"cta_ask_new_character",
		"cta_ask_new_character_bis",
		"cta_ask_create_character",
		"cta_ask_join_game",
		"cta_get_prompt",
	];
	const showCta = ctaSteps.includes(messages[messages.length - 1]?.currentStep);

	/* ---------------------------------------------------------------- */
	/*                                JSX                               */
	/* ---------------------------------------------------------------- */

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<MaterialCommunityIcons name="robot" size={24} color="#9a8c98" />
					<Text style={styles.headerTitle}>
						{t("app.name")} {t("chat.assistant")}
					</Text>
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
					{/* Load More Indicator - DÉSACTIVÉ */}

					<FlatList
						ref={flatListRef}
						data={visibleMessages}
						renderItem={renderMessage}
						keyExtractor={keyExtractor}
						style={styles.messagesList}
						contentContainerStyle={styles.messagesContent}
						showsVerticalScrollIndicator={false}
						onScroll={handleScroll}
						scrollEventThrottle={16}
						removeClippedSubviews={false}
						initialNumToRender={20}
						maxToRenderPerBatch={10}
						updateCellsBatchingPeriod={50}
						windowSize={10}
						disableVirtualization={false}
						legacyImplementation={false}
					/>
					{/* Loading Indicator */}
					{isLoading && (
						<View style={styles.loadingIndicator}>
							<AIThinkingAdvanced />
						</View>
					)}
				</View>

				{/* Input Section */}

				{showCta ? (
					<ActionButtons
						currentStep={messages[messages.length - 1]?.currentStep ?? "cta_ask_new_world"}
						onButtonPress={handleSendCta}
						disabled={isLoading}
					/>
				) : (
					<View style={styles.inputSection}>
						{(recorderState.isRecording || isRecordingManually) && (
							<View style={styles.recordingIndicator}>
								<Text style={styles.recordingText}>{t("common.recording")}</Text>
							</View>
						)}
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.textInput}
								placeholder={t("chat.placeholder")}
								placeholderTextColor="#9a8c98"
								value={isTranscribing ? typingDots : message}
								onChangeText={handleTextChange}
								onFocus={handleInputFocus}
								multiline
								maxLength={500}
								editable={!isTranscribing && !isLoading}
							/>
							<View style={styles.buttonsContainer}>
								<Pressable
									style={({ pressed }) => [styles.actionButton, styles.sendButton, { opacity: pressed ? 0.6 : isTranscribing ? 0.5 : 1 }]}
									onPress={handleSend}
									disabled={isTranscribing || isLoading}
								>
									<MaterialCommunityIcons name="send" size={20} color="#f2e9e4" />
								</Pressable>
								<Pressable
									style={({ pressed }) => [styles.actionButton, styles.recordButton, { opacity: pressed ? 0.6 : 1 }]}
									onPressIn={() => {
										// Commencer l'enregistrement uniquement si pas déjà en cours
										if (!recorderState.isRecording && !isTranscribing && !isStartingRecord && !isRecordingManually) {
											handleRecord();
										}
									}}
									onPressOut={() => {
										// Toujours arrêter l'enregistrement quand on relâche le doigt
										if (recorderState.isRecording || isRecordingManually) {
											stopRecording();
										} else if (isTranscribing) {
											cancelTranscription();
										}
									}}
									disabled={isLoading}
								>
									<MaterialCommunityIcons
										name={recorderState.isRecording || isRecordingManually ? "stop" : isTranscribing ? "close" : "microphone"}
										size={20}
										color={recorderState.isRecording || isRecordingManually ? "#e74c3c" : isTranscribing ? "#e74c3c" : "#f2e9e4"}
									/>
								</Pressable>
							</View>
						</View>
					</View>
				)}
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
		maxWidth: "100%",
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 12,
	},
	messageContent: {
		width: "100%",
		backgroundColor: "transparent",
	},
	messageText: {
		fontSize: 14,
		lineHeight: 22,
		flexWrap: "wrap",
		flexShrink: 1,
		marginBottom: 8,
		marginHorizontal: 5,
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
	recordingIndicator: {
		paddingHorizontal: 16,
		paddingVertical: 4,
		alignItems: "center",
		backgroundColor: "rgba(231,76,60,0.2)",
	},
	recordingText: {
		fontSize: 12,
		color: "#e74c3c",
		fontStyle: "italic",
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
