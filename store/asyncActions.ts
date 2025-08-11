import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "./types";
import { getCurrentTimestamp } from "./messagesSlice";

// Types pour gérer l'état de la conversation
type ConversationState = {
	step: string;
	createNewWorld?: boolean;
	worldName?: string;
	createNewCharacter?: boolean;
	characterName?: string;
};

// Types pour les appels API
type ApiRequestData = {
	stepType: string;
	userMessage: string;
	conversationState: ConversationState;
	allMessages: Message[];
};

// Fonction pour faire les appels API à l'IA selon l'étape de la conversation
const fetchAIResponse = async (requestData: ApiRequestData): Promise<string | null> => {
	const { stepType, userMessage, conversationState, allMessages } = requestData;

	// URL de base de votre API (à adapter selon votre configuration)
	const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

	try {
		// Selon l'étape, on appelle différents endpoints
		switch (stepType) {
			case "generating_world":
				// Appel pour générer les données du monde
				const worldResponse = await fetch(`${API_BASE_URL}/api/generate-world`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						world_name: conversationState.worldName,
						user_input: userMessage,
						create_new_world: conversationState.createNewWorld,
					}),
				});

				if (!worldResponse.ok) {
					throw new Error("Failed to generate world data");
				}

				const worldData = await worldResponse.json();
				return worldData.message || "World data generated successfully! Do you want to play as a new character? Respond by typing 'yes' or 'no'.";

			case "generating_character":
				// Appel pour générer les données du personnage
				const characterResponse = await fetch(`${API_BASE_URL}/api/generate-character`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						character_name: conversationState.characterName,
						world_name: conversationState.worldName,
						user_input: userMessage,
						create_new_character: conversationState.createNewCharacter,
					}),
				});

				if (!characterResponse.ok) {
					throw new Error("Failed to generate character data");
				}

				const characterData = await characterResponse.json();
				return (
					characterData.message ||
					"Character data generated successfully! I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient..."
				);

			case "generating_lore":
				// Appel pour générer le lore
				const loreResponse = await fetch(`${API_BASE_URL}/api/generate-lore`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						world_name: conversationState.worldName,
						character_name: conversationState.characterName,
						conversation_history: allMessages,
					}),
				});

				if (!loreResponse.ok) {
					throw new Error("Failed to generate lore");
				}

				const loreData = await loreResponse.json();
				return loreData.message || "Lore generated successfully! I am now summarizing your story. This may take a few moments, please be patient...";

			case "generating_summary":
				// Appel pour générer le résumé
				const summaryResponse = await fetch(`${API_BASE_URL}/api/generate-summary`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						world_name: conversationState.worldName,
						character_name: conversationState.characterName,
						conversation_history: allMessages,
					}),
				});

				if (!summaryResponse.ok) {
					throw new Error("Failed to generate summary");
				}

				const summaryData = await summaryResponse.json();
				return summaryData.message || "What do you want to do?";

			case "gameplay":
				// Appel pour la génération de gameplay
				const gameplayResponse = await fetch(`${API_BASE_URL}/api/gameplay-action`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						world_name: conversationState.worldName,
						character_name: conversationState.characterName,
						player_action: userMessage,
						conversation_history: allMessages,
					}),
				});

				if (!gameplayResponse.ok) {
					throw new Error("Failed to process gameplay action");
				}

				const gameplayData = await gameplayResponse.json();
				return gameplayData.message || "Do you wish to continue? Respond by typing 'yes' or 'no'.";

			default:
				// Pour les autres étapes, pas d'appel API nécessaire
				return null;
		}
	} catch (error) {
		console.error("API call failed:", error);
		// En cas d'erreur, retourner un message par défaut
		switch (stepType) {
			case "generating_world":
				return "I encountered an issue generating your world. Let's continue anyway. Do you want to play as a new character? Respond by typing 'yes' or 'no'.";
			case "generating_character":
				return "I encountered an issue generating your character. Let's continue anyway. I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient...";
			case "generating_lore":
				return "I encountered an issue generating the lore. Let's continue anyway. I am now summarizing your story. This may take a few moments, please be patient...";
			case "generating_summary":
				return "I encountered an issue generating the summary. Let's start the adventure anyway. What do you want to do?";
			case "gameplay":
				return "I encountered an issue processing your action. Do you wish to continue? Respond by typing 'yes' or 'no'.";
			default:
				return null;
		}
	}
};

// Fonction pour déterminer le prochain message basé sur l'état et la réponse de l'utilisateur
const getNextMessage = (userMessage: string, currentState: ConversationState): { message: string; stepType: string; newState: ConversationState } => {
	const lowerMessage = userMessage.toLowerCase().trim();

	switch (currentState.step) {
		case "welcome":
			return {
				message: "Do you want to create a new world? Respond by typing 'yes' or 'no'.",
				stepType: "ask_new_world",
				newState: { ...currentState, step: "ask_new_world" },
			};

		case "ask_new_world":
			if (lowerMessage === "yes" || lowerMessage === "y") {
				return {
					message: "How would you like to name your world?",
					stepType: "world_name",
					newState: { ...currentState, step: "ask_world_name", createNewWorld: true },
				};
			} else if (lowerMessage === "no" || lowerMessage === "n") {
				return {
					message: "Which existing world would you like to enter?",
					stepType: "world_name",
					newState: { ...currentState, step: "ask_world_name", createNewWorld: false },
				};
			} else {
				return {
					message: "Please respond with 'yes' or 'no'. Do you want to create a new world?",
					stepType: "ask_new_world",
					newState: currentState,
				};
			}

		case "ask_world_name":
			if (lowerMessage.length > 0) {
				return {
					message: currentState.createNewWorld
						? "Describe the world's main genre. Give as much detail as you would like."
						: "Do you want to play as a new character? Respond by typing 'yes' or 'no'.",
					stepType: currentState.createNewWorld ? "world_genre" : "ask_new_character",
					newState: {
						...currentState,
						step: currentState.createNewWorld ? "ask_world_genre" : "ask_new_character",
						worldName: lowerMessage,
					},
				};
			} else {
				return {
					message: currentState.createNewWorld
						? "Please provide a name for your new world."
						: "Please provide the name of the world you want to enter.",
					stepType: "world_name",
					newState: currentState,
				};
			}

		case "ask_world_genre":
			return {
				message: "Are there particular themes or narrative threads you'd like to explore? Let your imagination guide the story's soul.",
				stepType: "story_directives",
				newState: { ...currentState, step: "ask_story_directives" },
			};

		case "ask_story_directives":
			return {
				message: "I am generating the data for your new world. This may take a few moments, please be patient...",
				stepType: "generating_world",
				newState: { ...currentState, step: "generating_world" },
			};

		case "generating_world":
			return {
				message: "Do you want to play as a new character? Respond by typing 'yes' or 'no'.",
				stepType: "ask_new_character",
				newState: { ...currentState, step: "ask_new_character" },
			};

		case "ask_new_character":
			if (lowerMessage === "yes" || lowerMessage === "y") {
				return {
					message: "How would you like to name your character?",
					stepType: "character_name",
					newState: { ...currentState, step: "ask_character_name", createNewCharacter: true },
				};
			} else if (lowerMessage === "no" || lowerMessage === "n") {
				return {
					message: "What is the name of the character you want to play as?",
					stepType: "character_name",
					newState: { ...currentState, step: "ask_character_name", createNewCharacter: false },
				};
			} else {
				return {
					message: "Please respond with 'yes' or 'no'. Do you want to play as a new character?",
					stepType: "ask_new_character",
					newState: currentState,
				};
			}

		case "ask_character_name":
			if (lowerMessage.length > 0) {
				return {
					message: currentState.createNewCharacter
						? "What is your character's gender?"
						: "I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient...",
					stepType: currentState.createNewCharacter ? "character_gender" : "generating_lore",
					newState: {
						...currentState,
						step: currentState.createNewCharacter ? "ask_character_gender" : "generating_lore",
						characterName: lowerMessage,
					},
				};
			} else {
				return {
					message: currentState.createNewCharacter
						? "Please provide a name for your new character."
						: "Please provide the name of the character you want to play as.",
					stepType: "character_name",
					newState: currentState,
				};
			}

		case "ask_character_gender":
			return {
				message: "What is your character's description?",
				stepType: "character_description",
				newState: { ...currentState, step: "ask_character_description" },
			};

		case "ask_character_description":
			return {
				message: "I am generating your character data. This may take a few moments, please be patient...",
				stepType: "generating_character",
				newState: { ...currentState, step: "generating_character" },
			};

		case "generating_character":
			return {
				message: "I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient...",
				stepType: "generating_lore",
				newState: { ...currentState, step: "generating_lore" },
			};

		case "generating_lore":
			return {
				message: "I am now summarizing your story. This may take a few moments, please be patient...",
				stepType: "generating_summary",
				newState: { ...currentState, step: "generating_summary" },
			};

		case "generating_summary":
			return {
				message: "What do you want to do?",
				stepType: "gameplay",
				newState: { ...currentState, step: "gameplay" },
			};

		case "gameplay":
			return {
				message: "Do you wish to continue? Respond by typing 'yes' or 'no'.",
				stepType: "ask_continue",
				newState: { ...currentState, step: "ask_continue" },
			};

		case "ask_continue":
			if (lowerMessage === "yes" || lowerMessage === "y") {
				return {
					message: "What do you want to do?",
					stepType: "gameplay",
					newState: { ...currentState, step: "gameplay" },
				};
			} else {
				return {
					message: "Thank you for playing Odyssai! Feel free to start a new adventure anytime.",
					stepType: "ended",
					newState: { step: "ended" },
				};
			}

		default:
			return {
				message: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
				stepType: "welcome",
				newState: { step: "welcome" },
			};
	}
};

// Action asynchrone pour simuler une réponse de l'IA
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (userMessage: string, { dispatch, getState }) => {
	// Récupérer l'état actuel de la conversation depuis le store
	const state = getState() as any;
	const messages = state.messages.messages;
	const lastAIMessage = messages.filter((msg: Message) => !msg.isUser).pop();

	// Déterminer l'état actuel basé sur le dernier message de l'IA
	let currentState: ConversationState = { step: "welcome" };

	if (lastAIMessage) {
		const lastText = lastAIMessage.text;

		if (lastText.includes("Do you want to create a new world?")) {
			currentState = { step: "ask_new_world" };
		} else if (lastText.includes("How would you like to name your world?")) {
			currentState = { step: "ask_world_name", createNewWorld: true };
		} else if (lastText.includes("Which existing world would you like to enter?")) {
			currentState = { step: "ask_world_name", createNewWorld: false };
		} else if (lastText.includes("Describe the world's main genre")) {
			currentState = { step: "ask_world_genre", createNewWorld: true };
		} else if (lastText.includes("particular themes or narrative threads")) {
			currentState = { step: "ask_story_directives" };
		} else if (lastText.includes("generating the data for your new world")) {
			currentState = { step: "generating_world" };
		} else if (lastText.includes("Do you want to play as a new character?")) {
			currentState = { step: "ask_new_character" };
		} else if (lastText.includes("How would you like to name your character?")) {
			currentState = { step: "ask_character_name", createNewCharacter: true };
		} else if (lastText.includes("What is the name of the character you want to play as?")) {
			currentState = { step: "ask_character_name", createNewCharacter: false };
		} else if (lastText.includes("What is your character's gender?")) {
			currentState = { step: "ask_character_gender" };
		} else if (lastText.includes("What is your character's description?")) {
			currentState = { step: "ask_character_description" };
		} else if (lastText.includes("generating your character data")) {
			currentState = { step: "generating_character" };
		} else if (lastText.includes("imagining an additional layer of depth")) {
			currentState = { step: "generating_lore" };
		} else if (lastText.includes("summarizing your story")) {
			currentState = { step: "generating_summary" };
		} else if (lastText.includes("What do you want to do?")) {
			currentState = { step: "gameplay" };
		} else if (lastText.includes("Do you wish to continue?")) {
			currentState = { step: "ask_continue" };
		}
	}

	// Obtenir le prochain message basé sur l'entrée utilisateur et l'état actuel
	const { message, stepType } = getNextMessage(userMessage, currentState);

	// Vérifier si on a besoin de faire un appel API pour cette étape
	const apiSteps = ["generating_world", "generating_character", "generating_lore", "generating_summary", "gameplay"];
	let finalMessage = message;

	if (apiSteps.includes(stepType)) {
		// Simuler un délai de réponse plus long pour les étapes de génération
		await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000));

		// Faire l'appel API
		const apiResponse = await fetchAIResponse({
			stepType,
			userMessage,
			conversationState: currentState,
			allMessages: messages,
		});

		// Si l'API retourne une réponse, l'utiliser, sinon garder le message par défaut
		if (apiResponse) {
			finalMessage = apiResponse;
		}
	} else {
		// Pour les autres étapes, simuler un délai court
		await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
	}

	const aiMessage: Message = {
		id: `ai_${Date.now()}`,
		step_type: stepType,
		text: finalMessage,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return aiMessage;
});

// Action pour réinitialiser la conversation
export const resetConversation = createAsyncThunk("messages/resetConversation", async (_, { dispatch }) => {
	const welcomeMessage: Message = {
		id: "welcome_" + Date.now(),
		step_type: "welcome",
		text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return welcomeMessage;
});

// Action pour reset complet du store
export const resetCompleteStore = createAsyncThunk("messages/resetCompleteStore", async (_, { dispatch }) => {
	const welcomeMessage: Message = {
		id: "welcome_" + Date.now(),
		step_type: "welcome",
		text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return welcomeMessage;
});
