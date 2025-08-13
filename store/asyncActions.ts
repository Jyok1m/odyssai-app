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

		if (![200, 201].includes(response.status)) {
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
	const { is_new_world, world_id, world_name, world_genre, story_directives, character_name, character_id } = gameData;

	const prevAIQuestions = messages.filter((msg: any) => !msg.isUser);
	const lastAIQuestion = prevAIQuestions[prevAIQuestions.length - 1];
	const { currentStep, text: aiText } = lastAIQuestion;
	const userAnswer = text.toString().toLowerCase().trim();

	// Délai simulé
	await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 1000));

	let response = [];

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

	/* ---------------------------------------------------------------- */
	/*                               WORLD                              */
	/* ---------------------------------------------------------------- */

	// Step - If user is at step create new world, ask for world name
	if (currentStep === "ask_new_world") {
		nextStep = "ask_world_name";
		if (userAnswer === "yes") {
			dispatch(addData({ key: "is_new_world", value: true }));
			nextQuestion = "Great! Let's create a new world. How would you like to name your new world?";
		} else if (userAnswer === "no") {
			dispatch(addData({ key: "is_new_world", value: false }));
			nextQuestion = "Alright! Which world would you like to join?";
		} else {
			comprehensionError();
		}
	}

	// Step - When user inputs world name, check if it exists
	else if (currentStep === "ask_world_name") {
		const aiResponse = await fetchAIResponse("GET", `/check-world?world_name=${userAnswer}`);
		const { exists, world_name, world_id } = aiResponse;
		const { is_new_world } = gameData;

		// If the user wants a new world and the name already exists, we ask for name again
		if (is_new_world && exists) {
			nextQuestion = `The world '${world_name}' already exists. Please choose a different name.`;
			nextStep = currentStep; // Reset
		}

		// If the user wants a new world and the name doesn't exist, we go to the world genre QA
		else if (is_new_world && !exists) {
			dispatch(addData({ key: "world_name", value: world_name }));

			nextQuestion = `Great! Let's create your new world! Describe the world’s main genre. Give as much detail as you would like.`;
			nextStep = "ask_world_genre";
		}

		// If the user doesn't want a new world and the name exists, we ask if player wants to create a new character
		else if (!is_new_world && exists) {
			dispatch(addData({ key: "world_name", value: world_name }));
			dispatch(addData({ key: "world_id", value: world_id }));

			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: `Perfect, I found your world!`,
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = `So now, do you wish to play as a new character?`;
			nextStep = "ask_create_new_character";
		}

		// If the user doesn't want a new world and the name doesn't exist, we ask if the player wants to create a new world
		else if (!is_new_world && !exists) {
			nextQuestion = `The world '${world_name}' does not exist. Do you want to create a new world?`;
			nextStep = "ask_new_world";
		}
	}

	// Step - When user inputs world genre, we simply add it to Redux
	else if (currentStep === "ask_world_genre") {
		dispatch(addData({ key: "world_genre", value: userAnswer }));

		nextQuestion = "Are there particular themes or narrative threads you’d like to explore? Let your imagination guide the story’s soul.";
		nextStep = "ask_story_directives";
	}

	// Step - When user inputs story_directives, we simply add it to Redux
	else if (currentStep === "ask_story_directives") {
		dispatch(addData({ key: "story_directives", value: userAnswer }));

		nextQuestion = "Thank you. I'm ready to weave the threads of your world’s story. Are you ready?";
		nextStep = "create_world";
	}

	// Step - When user is ready to create new world, we create the world and ask for character creation
	else if (currentStep === "create_world") {
		// If user is ready for world generation
		if (userAnswer === "yes") {
			const aiResponse = await fetchAIResponse("POST", `/create-world`, { world_name, world_genre, story_directives });
			const { world_id, synopsis } = aiResponse;

			// Show synopsis to the user
			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: synopsis,
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			dispatch(addData({ key: "world_id", value: world_id }));
			dispatch(addData({ key: "synopsis", value: synopsis }));

			// Send user to character creation QA
			nextQuestion = "Now, how would you like to name your character?";
			nextStep = "ask_character_name";
		} else if (userAnswer === "no") {
			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: "Alright! Let me know if you change your mind.",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = "Are you ready to move on with the creation of your world?";
			nextStep = currentStep;
		} else {
			comprehensionError();
		}
	}

	/* ---------------------------------------------------------------- */
	/*                             CHARACTER                            */
	/* ---------------------------------------------------------------- */

	// Step - When user asks chooses if he wants to play as a new character or not
	else if (currentStep === "ask_create_new_character") {
		nextStep = "ask_character_name";
		if (userAnswer === "yes") {
			dispatch(addData({ key: "is_new_character", value: true }));
			nextQuestion = "Great! Let's create a new character. What would you like to name your character?";
		} else if (userAnswer === "no") {
			dispatch(addData({ key: "is_new_character", value: false }));
			nextQuestion = "Alright! Which character would you like to play as?";
		} else {
			comprehensionError();
		}
	}

	// Step when user asks for a character name
	else if (currentStep === "ask_character_name") {
		const aiResponse = await fetchAIResponse("GET", `/check-character?world_id=${world_id}&character_name=${userAnswer}`);
		const { exists, character_name, character_id } = aiResponse;
		const { is_new_character } = gameData;

		// If the user wants a new character and the name already exists, we ask for name again
		if (is_new_character && exists) {
			nextQuestion = `The character '${character_name}' already exists. Please choose a different name.`;
			nextStep = currentStep; // Reset
		}

		// If the user wants a new character and the name doesn't exist, we go to the character description QA
		else if (is_new_character && !exists) {
			dispatch(addData({ key: "character_name", value: character_name }));

			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: `Great! Let's start creating your new character!`,
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = `Will your character be male, female, or non-binary?`;
			nextStep = "ask_character_gender";
		}

		// If the user doesn't want a new character and the name exists, we ask if player wants to create a new character
		else if (!is_new_character && exists) {
			dispatch(addData({ key: "character_name", value: character_name }));
			dispatch(addData({ key: "character_id", value: character_id }));

			nextQuestion = `Thank you. Are you ready to join back ${world_name}?`;
			nextStep = "join_game";
		}

		// If the user doesn't want a new character and the name doesn't exist, we ask if the player wants to create a new character
		else if (!is_new_character && !exists) {
			nextQuestion = `The character '${character_name}' does not exist. Do you want to create a new character?`;
			nextStep = "ask_new_character";
		}
	}

	// Ask character gender
	else if (currentStep === "ask_character_gender") {
		dispatch(addData({ key: "character_gender", value: userAnswer }));

		nextQuestion = "What is your character's backstory or description?";
		nextStep = "ask_character_description";
	}

	// Ask character description
	else if (currentStep === "ask_character_description") {
		dispatch(addData({ key: "character_description", value: userAnswer }));

		nextQuestion = "Thank you. I'm ready to craft your character's profile. Are you ready?";
		nextStep = "create_character";
	}

	// Create new character
	else if (currentStep === "create_character") {
		if (userAnswer === "yes") {
			const { character_gender, character_description } = gameData;

			const aiResponse = await fetchAIResponse("POST", "/create-character", {
				world_id,
				character_name,
				character_gender,
				character_description,
			});

			const { character_id } = aiResponse;

			dispatch(addData({ key: "character_id", value: character_id }));
			nextQuestion = `I have successfully generated your character! Are you ready to join the world of ${world_name}?`;
			nextStep = "join_game";
		} else if (userAnswer === "no") {
			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: "Alright! Let me know if you change your mind.",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = "Are you ready to move on with your character creation?";
			nextStep = currentStep;
		} else {
			comprehensionError();
		}
	}

	/* ---------------------------------------------------------------- */
	/*                             GAMEPLAY                             */
	/* ---------------------------------------------------------------- */

	// Join existing game
	else if (currentStep === "join_game") {
		if (userAnswer === "yes") {
			const aiResponse = await fetchAIResponse("POST", "/join-game", { world_name, character_name });

			const { world_id, character_id, world_summary } = aiResponse;

			dispatch(addData({ key: "world_id", value: world_id }));
			dispatch(addData({ key: "character_id", value: character_id }));

			if (!is_new_world) {
				response.push({
					id: `ai_${Date.now()}`,
					currentStep: "filler",
					text: `Here is the story so far: ${world_summary}`,
					isUser: false,
					timestamp: getCurrentTimestamp(),
				});
			}

			nextQuestion = `Shall we begin?`;
			nextStep = "get_prompt";
		} else if (userAnswer === "no") {
			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: "Alright! Let me know if you change your mind.",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = "Are you ready to start your adventure?";
			nextStep = currentStep;
		} else {
			comprehensionError();
		}
	}

	// Request prompt from the backend
	else if (currentStep === "get_prompt") {
		if (userAnswer === "yes") {
			const aiResponse = await fetchAIResponse("GET", `/game-prompt?world_id=${world_id}&character_id=${character_id}`);
			const { ai_prompt } = aiResponse;

			nextQuestion = ai_prompt;
			nextStep = "get_response";
		} else if (userAnswer === "no") {
			response.push({
				id: `ai_${Date.now()}`,
				currentStep: "filler",
				text: "Alright! Let me know if you change your mind.",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = "Are you ready to continue your story?";
			nextStep = currentStep;
		} else {
			comprehensionError();
		}
	}

	// Get answer from the player
	else if (currentStep === "get_response") {
		const aiResponse = await fetchAIResponse("POST", "/register-answer", { world_id, character_id, player_answer: userAnswer });
		const { immediate_events } = aiResponse;

		response.push({
			id: `ai_${Date.now()}`,
			currentStep: "filler",
			text: immediate_events,
			isUser: false,
			timestamp: getCurrentTimestamp(),
		});

		nextQuestion = "Shall we continue with your story?";
		nextStep = "get_prompt";
	}

	response.push({
		id: `ai_${Date.now()}`,
		currentStep: nextStep,
		text: nextQuestion,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	});

	return response;
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
