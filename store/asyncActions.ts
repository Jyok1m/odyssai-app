import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentTimestamp } from "./utils";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Appel API
const fetchAIResponse = async (endpoint: string, data: any): Promise<string> => {
	try {
		const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!response.ok) throw new Error(`Failed to ${endpoint}`);

		const result = await response.json();
		return result.message || "Success";
	} catch (error) {
		console.error("API call failed:", error);
		return "An error occurred. Let's continue anyway.";
	}
};

// Action principale pour envoyer un message
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (text: string, { getState }) => {
	const state = getState() as any;
	const messages = state.messages.messages;
	const prevAIQuestions = messages.filter((msg: any) => !msg.isUser);
	const lastAIQuestion = prevAIQuestions[prevAIQuestions.length - 1];
	const { currentStep, text: aiText } = lastAIQuestion;
	const userAnswer = text.toString().toLowerCase().trim();

	// Délai simulé
	await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 1000));

	// Réponse simple basée sur le message
	let nextResponse = ""; // Defaults
	let nextStep = ""; // Defaults

	const comprehensionError = () => {
		nextResponse = "Sorry, I didn't quite catch that. " + aiText;
		nextStep = currentStep;
	};

	if (currentStep === "ask_new_world") {
		nextStep = "world_name";
		if (userAnswer === "yes") {
			nextResponse = "Great! Let's create a new world. How would you like to name your new world?";
		} else if (userAnswer === "no") {
			nextResponse = "Alright! Which world would you like to join?";
		} else {
			comprehensionError();
		}
	}

	// if (currentStep === "ask_new_world")
	// 	// if (msg_type === "ask_new_world" && ["yes", "ye", "y"].includes(text.toString().toLowerCase().trim())) {
	// 	// 	response = "Great! Let's create a new world.";
	// 	// 	currentStep = "create_world";
	// 	// } else {
	// 	// 	response = "Do you want to create a new world? Respond by typing 'yes' or 'no'.";
	// 	// 	currentStep = "ask_new_world";
	// 	// }

	// 	// Si le message contient certains mots-clés, faire un appel API
	// 	// if (userMessage.toLowerCase().includes("world")) {
	// 	// 	response = await fetchAIResponse("generate-world", {
	// 	// 		user_input: userMessage,
	// 	// 		conversation_history: messages,
	// 	// 	});
	// 	// } else if (userMessage.toLowerCase().includes("character")) {
	// 	// 	response = await fetchAIResponse("generate-character", {
	// 	// 		user_input: userMessage,
	// 	// 		conversation_history: messages,
	// 	// 	});
	// 	// } else if (userMessage.toLowerCase().includes("play") || userMessage.toLowerCase().includes("action")) {
	// 	// 	response = await fetchAIResponse("gameplay-action", {
	// 	// 		player_action: userMessage,
	// 	// 		conversation_history: messages,
	// 	// 	});
	// 	// }

	return {
		id: `ai_${Date.now()}`,
		currentStep: nextStep,
		text: nextResponse,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};
});

// Actions de reset
export const resetConversation = createAsyncThunk("messages/resetConversation", async () => ({
	id: `welcome_${Date.now()}`,
	currentStep: "welcome",
	text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
	isUser: false,
	timestamp: getCurrentTimestamp(),
}));

export const resetCompleteStore = createAsyncThunk("messages/resetCompleteStore", async () => ({
	id: `welcome_${Date.now()}`,
	currentStep: "welcome",
	text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
	isUser: false,
	timestamp: getCurrentTimestamp(),
}));
