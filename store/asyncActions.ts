import "react-native-get-random-values";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentTimestamp } from "./utils/utils";
import { addData } from "./reducers/gameDataSlice";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import storeI18nService from "./services/storeI18nService";

const client = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY });
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Simple function to classify user messages (with optional API fallback)
const classifyUserMessage = async (message: string): Promise<string> => {
	const currentLanguage = storeI18nService.getCurrentLanguage();

	// Mots de validation multilingues
	const positiveWords =
		currentLanguage === "fr"
			? ["oui", "yes", "d'accord", "ok", "okay", "bien", "parfait", "vas-y", "allons-y", "continue"]
			: ["yes", "ok", "okay", "sure", "fine", "good", "perfect", "go", "continue", "proceed"];

	const negativeWords =
		currentLanguage === "fr" ? ["non", "no", "pas", "arrête", "stop", "refuse", "jamais"] : ["no", "not", "stop", "refuse", "never", "nope"];

	const lowerMessage = message.toLowerCase().trim();

	// Vérification directe des mots-clés
	if (positiveWords.some((word) => lowerMessage.includes(word))) {
		return "yes";
	}
	if (negativeWords.some((word) => lowerMessage.includes(word))) {
		return "no";
	}

	try {
		// Prompts multilingues pour l'API
		const prompts = {
			fr: `Classe le message utilisateur suivant comme 'yes' ou 'no' selon que l'utilisateur veut continuer, procéder, ou est d'accord avec quelque chose.

				Message utilisateur: "${message}"

				Règles:
				- Si l'utilisateur exprime le désir de continuer, procéder, être d'accord, ou toute intention positive: réponds "yes"
				- Si l'utilisateur exprime le désir d'arrêter, être en désaccord, ou toute intention négative: réponds "no"
				- En cas de doute, par défaut "no"
				
				Réponds uniquement "yes" ou "no", rien d'autre.`,
			en: `Classify the following user message as either 'yes' or 'no' based on whether the user wants to continue, proceed, or agrees with something.

				User message: "${message}"

				Rules:
				- If the user expresses desire to continue, proceed, agree, or any positive intent: respond with "yes"
				- If the user expresses desire to stop, disagree, or any negative intent: respond with "no"
				- If unclear, default to "no"
				
				Respond with only "yes" or "no", nothing else.`,
		};

		const response = await client.responses.create({
			model: "gpt-3.5-turbo",
			temperature: 0,
			max_output_tokens: 16,
			input: prompts[currentLanguage as keyof typeof prompts] || prompts.en,
		});

		if (!["yes", "no"].includes(response.output_text)) {
			console.error("Unexpected response from message classification API:", response);
			return "no";
		}

		return response.output_text;
	} catch (error) {
		console.error("Error calling message classification API:", error);
		return "no";
	}
};

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

	/* ---------------------------------------------------------------- */
	/*                               WORLD                              */
	/* ---------------------------------------------------------------- */

	// Step - If user is at step create new world, ask for world name
	if (currentStep === "ask_new_world") {
		nextStep = "ask_world_name";
		const classification = await classifyUserMessage(userAnswer);
		if (classification === "yes") {
			dispatch(addData({ key: "is_new_world", value: true }));
			nextQuestion = storeI18nService.t("messages.createWorldName");
		} else if (classification === "no") {
			dispatch(addData({ key: "is_new_world", value: false }));
			nextQuestion = storeI18nService.t("messages.joinWorldName");
		} else {
			comprehensionError();
		}
	}

	// Step - When user inputs world name, check if it exists
	else if (currentStep === "ask_world_name") {
		//console.log("gameData", gameData);

		const aiResponse = await fetchAIResponse("GET", `/worlds/check?world_name=${userAnswer}`);
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
				id: uuidv4(),
				currentStep: "filler",
				text: storeI18nService.t("messages.worldFound"),
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = storeI18nService.t("messages.playNewCharacter");
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
		const classification = await classifyUserMessage(userAnswer);

		// If user is ready for world generation
		if (classification === "yes") {
			//console.log("gameData", gameData);
			const aiResponse = await fetchAIResponse("POST", `/worlds`, { world_name, world_genre, story_directives });
			const { world_id, synopsis } = aiResponse;

			// Show synopsis to the user
			response.push({
				id: uuidv4(),
				currentStep: "filler",
				text: synopsis,
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			dispatch(addData({ key: "world_id", value: world_id }));
			dispatch(addData({ key: "synopsis", value: synopsis }));

			// Send user to character creation QA
			nextQuestion = storeI18nService.t("messages.nameCharacter");
			nextStep = "ask_character_name";
		} else if (classification === "no") {
			response.push({
				id: `ai_${getCurrentTimestamp()}`,
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
		const classification = await classifyUserMessage(userAnswer);
		if (classification === "yes") {
			dispatch(addData({ key: "is_new_character", value: true }));
			nextQuestion = storeI18nService.t("messages.createNewCharacter");
		} else if (classification === "no") {
			dispatch(addData({ key: "is_new_character", value: false }));
			nextQuestion = "Alright! Which character would you like to play as?";
		} else {
			comprehensionError();
		}
	}

	// Step when user asks for a character name
	else if (currentStep === "ask_character_name") {
		//console.log("gameData", gameData);
		const aiResponse = await fetchAIResponse("GET", `/characters/check?world_id=${world_id}&character_name=${userAnswer}`);
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
				id: uuidv4(),
				currentStep: "filler",
				text: storeI18nService.t("messages.startCreatingCharacter"),
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			nextQuestion = `Will your character be male or female?`;
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
			nextStep = "ask_create_new_character";
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
		const classification = await classifyUserMessage(userAnswer);
		if (classification === "yes") {
			const { character_gender, character_description } = gameData;
			//console.log("gameData", gameData);
			const aiResponse = await fetchAIResponse("POST", "/characters", {
				world_id,
				character_name,
				character_gender,
				character_description,
			});

			const { character_id } = aiResponse;

			response.push({
				id: uuidv4(),
				currentStep: "filler",
				text: storeI18nService.t("messages.characterGenerated"),
				isUser: false,
				timestamp: getCurrentTimestamp(),
			});

			dispatch(addData({ key: "character_id", value: character_id }));
			nextQuestion = `Are you ready to join the world of ${world_name}?`;
			nextStep = "join_game";
		} else if (classification === "no") {
			response.push({
				id: uuidv4(),
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
		const classification = await classifyUserMessage(userAnswer);
		console.log("User response classification:", classification);

		if (classification === "yes") {
			//console.log("gameData", gameData);
			const aiResponse = await fetchAIResponse("POST", "/game/join", { world_name, character_name });

			const { world_id, character_id, world_summary } = aiResponse;

			dispatch(addData({ key: "world_id", value: world_id }));
			dispatch(addData({ key: "character_id", value: character_id }));

			if (!is_new_world) {
				response.push({
					id: uuidv4(),
					currentStep: "filler",
					text: `Here is the story so far: ${world_summary}`,
					isUser: false,
					timestamp: getCurrentTimestamp(),
				});
			}

			nextQuestion = `Shall we begin?`;
			nextStep = "get_prompt";
		} else if (classification === "no") {
			response.push({
				id: uuidv4(),
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
			//console.log("gameData", gameData);
			const aiResponse = await fetchAIResponse("GET", `/game/prompt?world_id=${world_id}&character_id=${character_id}`);
			const { ai_prompt } = aiResponse;

			nextQuestion = ai_prompt;
			nextStep = "get_response";
		} else if (userAnswer === "no") {
			response.push({
				id: uuidv4(),
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
		//console.log("gameData", gameData);
		const aiResponse = await fetchAIResponse("POST", "/game/action", { world_id, character_id, player_answer: userAnswer });
		const { immediate_events } = aiResponse;

		response.push({
			id: uuidv4(),
			currentStep: "filler",
			text: immediate_events,
			isUser: false,
			timestamp: getCurrentTimestamp(),
		});

		nextQuestion = "Shall we continue with your story?";
		nextStep = "get_prompt";
	}

	response.push({
		id: uuidv4(),
		currentStep: nextStep,
		text: nextQuestion,
		isUser: false,
		timestamp: getCurrentTimestamp(),
	});

	// Envoi en BDD
	const prevUserAns = messages.filter((msg: any) => msg.isUser);
	const lastUserMessage = prevUserAns[prevUserAns.length - 1];
	const { user_uuid } = state.user;

	await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/interaction`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			user_uuid,
			message: lastUserMessage,
			world_id: world_id.length > 0 ? world_id : null,
			character_id: character_id.length > 0 ? character_id : null,
			interaction_source: "user",
		}),
	});

	for (const message of response) {
		await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/interaction`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				user_uuid,
				message,
				world_id: world_id.length > 0 ? world_id : null,
				character_id: character_id.length > 0 ? character_id : null,
				interaction_source: "ai",
			}),
		});
	}

	return response;
});

// Actions de reset
export const resetConversation = createAsyncThunk("messages/resetConversation", async () => ({
	id: uuidv4(),
	currentStep: "welcome",
	text: storeI18nService.t("messages.welcome"),
	isUser: false,
	timestamp: getCurrentTimestamp(),
}));

export const resetCompleteStore = createAsyncThunk("messages/resetCompleteStore", async () => ({
	id: uuidv4(),
	currentStep: "welcome",
	text: storeI18nService.t("messages.welcome"),
	isUser: false,
	timestamp: getCurrentTimestamp(),
}));
