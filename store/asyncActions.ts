import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "./types";
import { getCurrentTimestamp } from "./utils";

// Types pour gérer l'état de la conversation
type ConversationState = {
	step: string;
	createNewWorld?: boolean;
	worldName?: string;
	createNewCharacter?: boolean;
	characterName?: string;
};

// Fonction pour déterminer le prochain message basé sur l'état et la réponse de l'utilisateur
const getNextMessage = (userMessage: string, currentState: ConversationState): { message: string; newState: ConversationState } => {
	const lowerMessage = userMessage.toLowerCase().trim();

	switch (currentState.step) {
		case "welcome":
			return {
				message: "Do you want to create a new world? Respond by typing 'yes' or 'no'.",
				newState: { ...currentState, step: "ask_new_world" },
			};

		case "ask_new_world":
			if (lowerMessage === "yes" || lowerMessage === "y") {
				return {
					message: "How would you like to name your world?",
					newState: { ...currentState, step: "ask_world_name", createNewWorld: true },
				};
			} else if (lowerMessage === "no" || lowerMessage === "n") {
				return {
					message: "Which existing world would you like to enter?",
					newState: { ...currentState, step: "ask_world_name", createNewWorld: false },
				};
			} else {
				return {
					message: "Please respond with 'yes' or 'no'. Do you want to create a new world?",
					newState: currentState,
				};
			}

		case "ask_world_name":
			if (lowerMessage.length > 0) {
				return {
					message: currentState.createNewWorld
						? "Describe the world's main genre. Give as much detail as you would like."
						: "Do you want to play as a new character? Respond by typing 'yes' or 'no'.",
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
					newState: currentState,
				};
			}

		case "ask_world_genre":
			return {
				message: "Are there particular themes or narrative threads you'd like to explore? Let your imagination guide the story's soul.",
				newState: { ...currentState, step: "ask_story_directives" },
			};

		case "ask_story_directives":
			return {
				message: "I am generating the data for your new world. This may take a few moments, please be patient...",
				newState: { ...currentState, step: "generating_world" },
			};

		case "generating_world":
			return {
				message: "Do you want to play as a new character? Respond by typing 'yes' or 'no'.",
				newState: { ...currentState, step: "ask_new_character" },
			};

		case "ask_new_character":
			if (lowerMessage === "yes" || lowerMessage === "y") {
				return {
					message: "How would you like to name your character?",
					newState: { ...currentState, step: "ask_character_name", createNewCharacter: true },
				};
			} else if (lowerMessage === "no" || lowerMessage === "n") {
				return {
					message: "What is the name of the character you want to play as?",
					newState: { ...currentState, step: "ask_character_name", createNewCharacter: false },
				};
			} else {
				return {
					message: "Please respond with 'yes' or 'no'. Do you want to play as a new character?",
					newState: currentState,
				};
			}

		case "ask_character_name":
			if (lowerMessage.length > 0) {
				return {
					message: currentState.createNewCharacter
						? "What is your character's gender?"
						: "I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient...",
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
					newState: currentState,
				};
			}

		case "ask_character_gender":
			return {
				message: "What is your character's description?",
				newState: { ...currentState, step: "ask_character_description" },
			};

		case "ask_character_description":
			return {
				message: "I am generating your character data. This may take a few moments, please be patient...",
				newState: { ...currentState, step: "generating_character" },
			};

		case "generating_character":
			return {
				message: "I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient...",
				newState: { ...currentState, step: "generating_lore" },
			};

		case "generating_lore":
			return {
				message: "I am now summarizing your story. This may take a few moments, please be patient...",
				newState: { ...currentState, step: "generating_summary" },
			};

		case "generating_summary":
			return {
				message: "What do you want to do?",
				newState: { ...currentState, step: "gameplay" },
			};

		case "gameplay":
			return {
				message: "Do you wish to continue? Respond by typing 'yes' or 'no'.",
				newState: { ...currentState, step: "ask_continue" },
			};

		case "ask_continue":
			if (lowerMessage === "yes" || lowerMessage === "y") {
				return {
					message: "What do you want to do?",
					newState: { ...currentState, step: "gameplay" },
				};
			} else {
				return {
					message: "Thank you for playing Odyssai! Feel free to start a new adventure anytime.",
					newState: { step: "ended" },
				};
			}

		default:
			return {
				message: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
				newState: { step: "welcome" },
			};
	}
};

// Action asynchrone pour simuler une réponse de l'IA
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (userMessage: string, { dispatch, getState }) => {
	// Simuler un délai de réponse de l'IA
	await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

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
	const { message } = getNextMessage(userMessage, currentState);

	const aiMessage: Message = {
		id: `ai_${Date.now()}`,
		text: message,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return aiMessage;
});

// Action pour réinitialiser la conversation
export const resetConversation = createAsyncThunk("messages/resetConversation", async (_, { dispatch }) => {
	const welcomeMessage: Message = {
		id: "welcome_" + Date.now(),
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
		text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return welcomeMessage;
});
