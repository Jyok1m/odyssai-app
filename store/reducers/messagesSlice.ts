import "react-native-get-random-values";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, MessagesState } from "../types/types";
import { sendMessageToAI, resetConversation, resetCompleteStore } from "../asyncActions";
import { getCurrentTimestamp } from "../utils/utils";
import { v4 as uuidv4 } from "uuid";
import storeI18nService from "../services/storeI18nService";

const getInitialMessages = (): Message[] => [
	{
		id: uuidv4(),
		currentStep: "welcome",
		text: storeI18nService.t("messages.welcome"),
		isUser: false,
		timestamp: getCurrentTimestamp(),
	},
	{
		id: uuidv4(),
		currentStep: "ask_new_world",
		text: storeI18nService.t("messages.askNewWorld"),
		isUser: false,
		timestamp: getCurrentTimestamp(),
	},
];

const initialState: MessagesState = {
	messages: [], // Initialisation vide, sera peuplé dynamiquement
	isLoading: false,
	error: null,
};

const messagesSlice = createSlice({
	name: "messages",
	initialState,
	reducers: {
		loadMessages: (state, action: PayloadAction<Message[]>) => {
			state.messages = action.payload;
		},
		initializeMessages: (state) => {
			// Initialise les messages avec la langue courante
			if (state.messages.length === 0) {
				state.messages = getInitialMessages();
			}
		},
		addMessage: (state, action: PayloadAction<Message>) => {
			state.messages.push(action.payload);
		},
		setMessages: (state, action: PayloadAction<Message[]>) => {
			// Ensure messages array exists and replace content
			if (state.messages) {
				state.messages.splice(0, state.messages.length, ...action.payload);
			}
		},
		clearMessages: (state) => {
			// Ensure messages array exists and clear it
			if (state.messages) {
				state.messages.splice(0, state.messages.length);
			}
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		updateMessage: (state, action: PayloadAction<{ id: string; text: string }>) => {
			const message = state.messages.find((msg) => msg.id === action.payload.id);
			if (message) {
				message.text = action.payload.text;
			}
		},
		deleteMessage: (state, action: PayloadAction<string>) => {
			// Ensure messages array exists

			if (state.messages) {
				// Use findIndex and splice instead of filter assignment
				const index = state.messages.findIndex((msg) => msg.id === action.payload);
				if (index !== -1) {
					state.messages.splice(index, 1);
				}
			}
		},
		resetStore: (state) => {
			// Reset to initial state with welcome message and first question
			const welcomeMessage: Message = {
				id: uuidv4(),
				currentStep: "welcome",
				text: storeI18nService.t("messages.welcome"),
				isUser: false,
				timestamp: getCurrentTimestamp(),
			};
			const firstQuestion: Message = {
				id: uuidv4(),
				currentStep: "ask_new_world",
				text: storeI18nService.t("messages.askNewWorld"),
				isUser: false,
				timestamp: getCurrentTimestamp(),
			};
			// Ensure messages array exists and replace content
			if (state.messages) {
				state.messages.splice(0, state.messages.length, welcomeMessage, firstQuestion);
				state.isLoading = false;
				state.error = null;
			}
		},
	},
	extraReducers: (builder) => {
		builder
			// Handle sendMessageToAI
			.addCase(sendMessageToAI.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(sendMessageToAI.fulfilled, (state, action) => {
				state.isLoading = false;
				state.messages.push(...action.payload);
			})
			.addCase(sendMessageToAI.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.error.message || "Failed to get AI response";
			})
			// Handle resetConversation
			.addCase(resetConversation.fulfilled, (state, action) => {
				const firstQuestion: Message = {
					id: uuidv4(),
					currentStep: "ask_new_world",
					text: storeI18nService.t("messages.askNewWorld"),
					isUser: false,
					timestamp: getCurrentTimestamp(),
				};
				// Ensure messages array exists and replace content
				if (state.messages) {
					state.messages.splice(0, state.messages.length, action.payload, firstQuestion);
					state.error = null;
				}
			})
			// Handle resetCompleteStore
			.addCase(resetCompleteStore.fulfilled, (state, action) => {
				const firstQuestion: Message = {
					id: uuidv4(),
					currentStep: "ask_new_world",
					text: storeI18nService.t("messages.askNewWorld"),
					isUser: false,
					timestamp: getCurrentTimestamp(),
				};
				// Ensure messages array exists and replace content
				if (state.messages) {
					state.messages.splice(0, state.messages.length, action.payload, firstQuestion);
					state.isLoading = false;
					state.error = null;
				}
			});
	},
});

export const {
	addMessage,
	setMessages,
	clearMessages,
	setLoading,
	setError,
	updateMessage,
	deleteMessage,
	resetStore,
	loadMessages,
	initializeMessages,
} = messagesSlice.actions;

export default messagesSlice.reducer;
