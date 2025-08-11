import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "./types";
import { getCurrentTimestamp } from "./utils";

// Action asynchrone pour simuler une réponse de l'IA
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (userMessage: string, { dispatch, getState }) => {
	// Simuler un délai de réponse de l'IA
	await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

	// Simuler une réponse de l'IA (à remplacer par l'appel API réel)
	const aiResponses = [
		"That's an interesting idea for your RPG adventure! Tell me more about the setting.",
		"I can help you develop that character concept. What's their background?",
		"For that scenario, you might want to consider adding some plot twists...",
		"Let's work on the world-building for your campaign. What kind of atmosphere are you going for?",
		"That's a great hook for your story! How do you want the players to discover this?",
	];

	const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

	const aiMessage: Message = {
		id: `ai_${Date.now()}`,
		text: randomResponse,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return aiMessage;
});

// Action pour réinitialiser la conversation
export const resetConversation = createAsyncThunk("messages/resetConversation", async (_, { dispatch }) => {
	const welcomeMessage: Message = {
		id: "welcome_" + Date.now(),
		text: "Welcome to Odyssai! I'm your intelligent RPG assistant. How can I help you create your adventure today?",
		isUser: false,
		timestamp: getCurrentTimestamp(),
	};

	return welcomeMessage;
});
