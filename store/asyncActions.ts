import "react-native-get-random-values";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentTimestamp } from "./utils/utils";
import { addData } from "./reducers/gameDataSlice";
import { v4 as uuidv4 } from "uuid";
import storeI18nService from "./services/storeI18nService";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Appel API
export const fetchAIResponse = async (method: string, endpoint: string, body?: any): Promise<any> => {
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
export const sendMessageToAI = createAsyncThunk(
	"messages/sendMessageToAI",
	async ({ text, ctaValue }: { text: string; ctaValue?: string }, { getState, dispatch }) => {
		const state = getState() as any;
		const messagesState = state.messages;
		const gameData = state.gameData;
		const userData = state.user;
		const messages = messagesState?.messages || [];
		const { world_id, world_name, world_genre, story_directives, character_name, character_id, character_gender, character_description } = gameData;
		const { language, user_uuid } = userData;

		const prevAIQuestions = messages.filter((msg: any) => !msg.isUser);
		const lastAIQuestion = prevAIQuestions[prevAIQuestions.length - 1];
		const { currentStep } = lastAIQuestion;
		const userAnswer = ctaValue ?? text.toString().toLowerCase().trim();

		let response = [];

		// Réponse simple basée sur le message
		let nextQuestion = ""; // Defaults
		let nextStep = ""; // Defaults

		/* ---------------------------------------------------------------- */
		/*                               WORLD                              */
		/* ---------------------------------------------------------------- */

		switch (currentStep) {
			/* ----------------------- Création du monde ---------------------- */

			case "cta_ask_new_world": {
				switch (userAnswer) {
					case "see_world_list": {
						const res = await fetchAIResponse("GET", `/worlds/?lang=${language}`);
						if (res.count > 0 && res.worlds?.length > 0) {
							// Push le filler
							response.push({
								id: uuidv4(),
								currentStep: "filler",
								text: storeI18nService.t("messages.world_presentation"),
								isUser: false,
								timestamp: getCurrentTimestamp(),
							});

							for (const world of res.worlds) {
								response.push({
									id: uuidv4(),
									currentStep: "filler",
									text: storeI18nService.t("messages.world_shell", {
										worldName: world.world_name,
										worldDescription: world.world_description,
									}),
									isUser: false,
									timestamp: getCurrentTimestamp(),
								});
							}

							nextQuestion = storeI18nService.t("messages.world_dilemma");
							nextStep = "cta_ask_world";
						} else {
							dispatch(addData({ key: "is_new_world", value: true }));
							nextQuestion = storeI18nService.t("messages.no_world_found");
							nextStep = "ask_world_name";
						}

						break;
					}

					case "create_new_world": {
						dispatch(addData({ key: "is_new_world", value: true }));
						nextQuestion = storeI18nService.t("messages.createWorldName");
						nextStep = "ask_world_name";
						break;
					}

					case "join_existing_world": {
						dispatch(addData({ key: "is_new_world", value: false }));
						nextQuestion = storeI18nService.t("messages.joinWorldName");
						nextStep = "ask_world_name";
						break;
					}
				}
				break;
			}

			case "cta_ask_world": {
				switch (userAnswer) {
					case "join_created_world": {
						dispatch(addData({ key: "is_new_world", value: false }));
						nextQuestion = storeI18nService.t("messages.joinWorldName");
						nextStep = "ask_world_name";
						break;
					}

					case "create_new_world_instead": {
						dispatch(addData({ key: "is_new_world", value: true }));
						nextQuestion = storeI18nService.t("messages.createWorldName");
						nextStep = "ask_world_name";
						break;
					}
				}
				break;
			}

			case "ask_world_name": {
				const aiResponse = await fetchAIResponse("GET", `/worlds/check?world_name=${userAnswer}&lang=${language}`);
				const { exists, world_name, world_id } = aiResponse;
				const { is_new_world } = gameData;

				// Si on veut créer un nouveau monde
				if (is_new_world) {
					if (exists) {
						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.worldAlreadyExists", { worldName: world_name }),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						nextQuestion = storeI18nService.t("messages.worldRestartProcess");
						nextStep = "cta_ask_new_world";
					} else {
						dispatch(addData({ key: "world_name", value: world_name }));
						nextQuestion = storeI18nService.t("messages.createWorldDescription");
						nextStep = "ask_world_genre";
					}
				} else {
					if (exists) {
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
						nextStep = "cta_ask_new_character";
					} else {
						dispatch(addData({ key: "world_name", value: userAnswer }));
						nextQuestion = storeI18nService.t("messages.worldDoesNotExistCreateNew");
						nextStep = "cta_ask_new_world_bis";
					}
				}
				break;
			}

			case "cta_ask_new_world_bis": {
				switch (userAnswer) {
					case "create_bis": {
						dispatch(addData({ key: "is_new_world", value: true }));
						nextQuestion = storeI18nService.t("messages.createWorldDescription");
						nextStep = "ask_world_genre";
						break;
					}
					case "restart": {
						dispatch(addData({ key: "world_name", value: "" }));
						nextQuestion = storeI18nService.t("messages.worldRestartProcess");
						nextStep = "cta_ask_new_world";
						break;
					}
				}
				break;
			}

			case "ask_world_genre": {
				dispatch(addData({ key: "world_genre", value: userAnswer }));
				nextQuestion = storeI18nService.t("messages.askStoryDirectives");
				nextStep = "ask_story_directives";
				break;
			}

			case "ask_story_directives": {
				dispatch(addData({ key: "story_directives", value: userAnswer }));
				nextQuestion = storeI18nService.t("messages.readyToWeaveStory");
				nextStep = "cta_ask_create_world";
				break;
			}

			case "cta_ask_create_world": {
				switch (userAnswer) {
					case "start_world_creation": {
						const aiResponse = await fetchAIResponse("POST", `/worlds/?lang=${language}`, { world_name, world_genre, story_directives });
						const { world_id, synopsis } = aiResponse;

						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: synopsis ?? aiResponse,
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						dispatch(addData({ key: "world_id", value: world_id }));
						dispatch(addData({ key: "synopsis", value: synopsis }));

						// Send user to character creation QA
						nextQuestion = storeI18nService.t("messages.nameCharacter");
						nextStep = "ask_character_name";
						break;
					}
					case "pause_world_creation": {
						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.changeMindGeneric"),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						nextQuestion = storeI18nService.t("messages.readyToMoveOnWorldCreation");
						nextStep = currentStep;
						break;
					}
				}
				break;
			}

			/* --------------------------- Character -------------------------- */

			case "cta_ask_new_character": {
				switch (userAnswer) {
					case "play_new_character": {
						dispatch(addData({ key: "is_new_character", value: true }));
						nextQuestion = storeI18nService.t("messages.createNewCharacter");
						nextStep = "ask_character_name";
						break;
					}
					case "play_existing_character": {
						dispatch(addData({ key: "is_new_character", value: false }));
						nextQuestion = storeI18nService.t("messages.whichCharacterToPlay");
						nextStep = "ask_character_name";
						break;
					}
				}
				break;
			}

			case "ask_character_name": {
				const aiResponse = await fetchAIResponse("GET", `/characters/check?world_id=${world_id}&character_name=${userAnswer}&lang=${language}`);
				const { exists, character_name, character_id } = aiResponse;
				const { is_new_character } = gameData;

				if (is_new_character) {
					if (exists) {
						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.characterAlreadyExists", { characterName: character_name }),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						nextQuestion = storeI18nService.t("messages.characterRestartProcess");
						nextStep = "cta_ask_new_character";
					} else {
						dispatch(addData({ key: "character_name", value: character_name }));
						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.startCreatingCharacter"),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});
						nextQuestion = storeI18nService.t("messages.characterGenderQuestion");
						nextStep = "ask_character_gender";
					}
				} else {
					if (exists) {
						dispatch(addData({ key: "character_name", value: character_name }));
						dispatch(addData({ key: "character_id", value: character_id }));

						nextQuestion = storeI18nService.t("messages.readyToRejoinWorld", { worldName: world_name });
						nextStep = "cta_ask_join_game";
					} else {
						dispatch(addData({ key: "character_name", value: userAnswer }));
						nextQuestion = storeI18nService.t("messages.characterDoesNotExistCreateNew", { characterName: userAnswer });
						nextStep = "cta_ask_new_character_bis";
					}
				}
				break;
			}

			case "cta_ask_new_character_bis": {
				switch (userAnswer) {
					case "create_bis": {
						dispatch(addData({ key: "is_new_character", value: true }));
						nextQuestion = storeI18nService.t("messages.characterGenderQuestion");
						nextStep = "ask_character_genre";
						break;
					}
					case "restart": {
						dispatch(addData({ key: "character_name", value: "" }));
						nextQuestion = storeI18nService.t("messages.characterRestartProcess");
						nextStep = "cta_ask_new_character";
						break;
					}
				}
				break;
			}

			case "ask_character_gender": {
				dispatch(addData({ key: "character_gender", value: userAnswer }));

				nextQuestion = storeI18nService.t("messages.characterBackstoryQuestion");
				nextStep = "ask_character_description";
				break;
			}

			case "ask_character_description": {
				dispatch(addData({ key: "character_description", value: userAnswer }));

				nextQuestion = storeI18nService.t("messages.readyToCraftCharacterProfile");
				nextStep = "cta_ask_create_character";
				break;
			}

			case "cta_ask_create_character": {
				switch (userAnswer) {
					case "start_character_creation": {
						const aiResponse = await fetchAIResponse("POST", `/characters/?lang=${language}`, {
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
						nextQuestion = storeI18nService.t("messages.readyToJoinWorld", { worldName: world_name });
						nextStep = "cta_ask_join_game";
						break;
					}

					case "pause_character_creation": {
						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.changeMindGeneric"),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						nextQuestion = storeI18nService.t("messages.readyToMoveOnCharacterCreation");
						nextStep = currentStep;
						break;
					}
				}
				break;
			}

			/* --------------------------- Gameplay --------------------------- */

			case "cta_ask_join_game": {
				switch (userAnswer) {
					case "rejoin_world": {
						const aiResponse = await fetchAIResponse("POST", `/game/join?lang=${language}`, { world_name, character_name });
						const { world_id, character_id, world_summary } = aiResponse;
						dispatch(addData({ key: "world_id", value: world_id }));
						dispatch(addData({ key: "character_id", value: character_id }));

						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.storySoFar", { worldSummary: world_summary }),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						nextQuestion = storeI18nService.t("messages.shallWeBegin");
						nextStep = "cta_get_prompt";
						break;
					}
					case "pause_rejoin_world": {
						response.push({
							id: uuidv4(),
							currentStep: "filler",
							text: storeI18nService.t("messages.changeMindGeneric"),
							isUser: false,
							timestamp: getCurrentTimestamp(),
						});

						nextQuestion = storeI18nService.t("messages.readyToStartAdventure");
						nextStep = currentStep;
						break;
					}
				}
				break;
			}

			case "cta_get_prompt": {
				switch (userAnswer) {
					case "continue_story": {
						const aiResponse = await fetchAIResponse("GET", `/game/prompt?world_id=${world_id}&character_id=${character_id}&lang=${language}`);
						const { ai_prompt } = aiResponse;

						nextQuestion = ai_prompt;
						nextStep = "get_response";
						break;
					}

					case "pause_story": {
						nextQuestion = storeI18nService.t("messages.changeMindGeneric");
						nextStep = currentStep;
					}
				}
				break;
			}

			case "get_response": {
				const aiResponse = await fetchAIResponse("POST", `/game/action?lang=${language}`, { world_id, character_id, player_answer: userAnswer });
				const { immediate_events } = aiResponse;

				nextQuestion = immediate_events;
				nextStep = "cta_get_prompt";
			}
		}

		response.push({
			id: uuidv4(),
			currentStep: nextStep,
			text: nextQuestion,
			isUser: false,
			timestamp: getCurrentTimestamp(),
		});

		// Envoi en BDD
		if (!["continue_story", "pause_story"].includes(ctaValue ?? "")) {
			const prevUserAns = messages.filter((msg: any) => msg.isUser);
			const lastUserMessage = prevUserAns[prevUserAns.length - 1];

			await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/interaction?lang=${language}`, {
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
		}

		for (const message of response) {
			message["timestamp"] = getCurrentTimestamp();
			await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/interaction?lang=${language}`, {
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
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		return response;
	}
);

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
