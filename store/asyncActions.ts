import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentTimestamp } from "./utils";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Appel API simplifié
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
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (userMessage: string, { getState }) => {
	const state = getState() as any;
	const messages = state.messages.messages;

	// Délai simulé
	await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

	// Réponse simple basée sur le message
	let response = "I understand. What would you like to do next?";

	// Si le message contient certains mots-clés, faire un appel API
	if (userMessage.toLowerCase().includes("world")) {
		response = await fetchAIResponse("generate-world", {
			user_input: userMessage,
			conversation_history: messages,
		});
	} else if (userMessage.toLowerCase().includes("character")) {
		response = await fetchAIResponse("generate-character", {
			user_input: userMessage,
			conversation_history: messages,
		});
	} else if (userMessage.toLowerCase().includes("play") || userMessage.toLowerCase().includes("action")) {
		response = await fetchAIResponse("gameplay-action", {
			player_action: userMessage,
			conversation_history: messages,
		});
	}

	return {
		id: `ai_${Date.now()}`,
		step_type: "response",
		text: response,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};
});

// Actions de reset
export const resetConversation = createAsyncThunk("messages/resetConversation", async () => ({
	id: `welcome_${Date.now()}`,
	step_type: "welcome",
	text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
	isUser: false,
	timestamp: getCurrentTimestamp(),
}));

export const resetCompleteStore = createAsyncThunk("messages/resetCompleteStore", async () => ({
	id: `welcome_${Date.now()}`,
	step_type: "welcome",
	text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
	isUser: false,
	timestamp: getCurrentTimestamp(),
}));
