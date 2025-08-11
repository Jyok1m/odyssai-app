import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "./types";
import { getCurrentTimestamp } from "./utils";

// Action asynchrone pour simuler une réponse de l'IA
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (userMessage: string, { dispatch, getState }) => {
	// Simuler un délai de réponse de l'IA
	await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

	// Simuler une réponse de l'IA (à remplacer par l'appel API réel)
	const aiResponses = [
		"Do you want to create a new world? Respond by typing 'yes' or 'no'.",
		"How would you like to name your world?",
		"Describe the world's main genre. Give as much detail as you would like.",
		"Are there particular themes or narrative threads you'd like to explore? Let your imagination guide the story's soul.",
		"Do you want to play as a new character? Respond by typing 'yes' or 'no'.",
		"How would you like to name your character?",
		"What is your character's gender?",
		"What is your character's description?",
		"I am generating the data for your new world. This may take a few moments, please be patient...",
		"I am generating your character data. This may take a few moments, please be patient...",
		"I am now imagining an additional layer of depth to the lore. This may take a few moments, please be patient...",
		"I am now summarizing your story. This may take a few moments, please be patient...",
		"What do you want to do?",
		"Do you wish to continue? Respond by typing 'yes' or 'no'.",
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
