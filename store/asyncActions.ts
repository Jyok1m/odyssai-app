import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentTimestamp } from "./utils/utils";
import { addData } from "./reducers/gameDataSlice";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Appel API
const fetchAIResponse = async (method: string, endpoint: string, body?: any): Promise<any> => {
	let options: RequestInit = { method: method };

	if (method === "POST") {
		options.headers = { "Content-Type": "application/json" };
		options.body = JSON.stringify(body);
	}

	try {
		const response = await fetch(`${API_BASE_URL}/api${endpoint}`, options);

		if (response.status !== 200) {
			console.error("API call failed:", response);
			return "An error occurred. Let's continue anyway.";
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("API call failed:", error);
		return "An error occurred. Let's continue anyway.";
	}
};

// Action principale pour envoyer un message
export const sendMessageToAI = createAsyncThunk("messages/sendMessageToAI", async (text: string, { getState, dispatch }) => {
	const state = getState() as any;
	const messagesState = state.messages;
	const gameData = state.gameData;
	const messages = messagesState?.messages || [];
	const { is_new_world } = gameData;

	const prevAIQuestions = messages.filter((msg: any) => !msg.isUser);
	const lastAIQuestion = prevAIQuestions[prevAIQuestions.length - 1];
	const { currentStep, text: aiText } = lastAIQuestion;
	const userAnswer = text.toString().toLowerCase().trim();

	// Délai simulé
	await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 1000));

	// Réponse simple basée sur le message
	let nextQuestion = ""; // Defaults
	let nextStep = ""; // Defaults

	const comprehensionError = () => {
		const filteredText = aiText.replaceAll("Sorry, I didn't quite catch that. ", "").trim();
		nextQuestion = "Sorry, I didn't quite catch that. " + filteredText;
		nextStep = currentStep;
	};

	console.log("Before => ", { currentStep, aiText, userAnswer });
	console.log("Before => ", { gameData });

	if (currentStep === "ask_new_world") {
		nextStep = "ask_world_name";
		if (userAnswer === "yes") {
			nextQuestion = "Great! Let's create a new world. How would you like to name your new world?";
			dispatch(addData({ key: "is_new_world", value: true }));
		} else if (userAnswer === "no") {
			nextQuestion = "Alright! Which world would you like to join?";
			dispatch(addData({ key: "is_new_world", value: false }));
		} else {
			comprehensionError();
		}
	} else if (currentStep === "ask_world_name") {
		const aiResponse = await fetchAIResponse("GET", `/check-world?world_name=${userAnswer}`);
		const { exists, world_name, world_id } = aiResponse;

		if (is_new_world) {
			if (exists) {
				nextQuestion = `The world '${world_name}' already exists. Please choose a different name.`;
				nextStep = currentStep; // Reset
			} else {
				nextQuestion = `Great! Let's create your new world! Describe the world’s main genre. Give as much detail as you would like.`;
				nextStep = "ask_world_genre";
				dispatch(addData({ key: "world_name", value: world_name }));
			}
		} else {
			if (exists) {
				nextQuestion = `Do you want to play as a new character? Respond by typing 'yes' or 'no'.`;
				nextStep = "ask_create_new_character";
				dispatch(addData({ key: "world_id", value: world_id }));
			} else {
				nextQuestion = `The world '${world_name}' does not exist. Do you want to create a new world? Respond by typing 'yes' or 'no'.`;
				nextStep = "ask_new_world";
			}
		}

		// console.log(aiResponse);

		// nextStep = "create_world";
		// nextQuestion = `Great! Let's create a new world called "${userAnswer}".`;
		// dispatch(addData({ key: "world_name", value: userAnswer }));
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
		text: nextQuestion,
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
