import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { Message, MessagesState } from "./types";
import { sendMessageToAI, resetConversation, resetCompleteStore } from "./asyncActions";
import { formatTimestamp, getCurrentTimestamp } from "./utils";

// Types Redux
export type RootState = {
	messages: MessagesState;
};

export type AppDispatch = any;

// Hooks Redux typés
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const initialState: MessagesState = {
	messages: [
		{
			id: "1",
			step_type: "welcome",
			text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
			isUser: false,
			timestamp: getCurrentTimestamp(),
		},
		{
			id: "2",
			step_type: "ask_new_world",
			text: "Do you want to create a new world? Respond by typing 'yes' or 'no'.",
			isUser: false,
			timestamp: getCurrentTimestamp(),
		},
	],
	isLoading: false,
	error: null,
};

const messagesSlice = createSlice({
	name: "messages",
	initialState,
	reducers: {
		addMessage: (state, action: PayloadAction<Message>) => {
			state.messages.push(action.payload);
		},
		setMessages: (state, action: PayloadAction<Message[]>) => {
			state.messages = action.payload;
		},
		clearMessages: (state) => {
			state.messages = [];
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
			state.messages = state.messages.filter((msg) => msg.id !== action.payload);
		},
		resetStore: (state) => {
			// Reset to initial state with welcome message and first question
			const welcomeMessage: Message = {
				id: "welcome_" + Date.now(),
				step_type: "welcome",
				text: "Welcome to Odyssai. Start by answering a few questions and let's get started!",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			};
			const firstQuestion: Message = {
				id: "question_" + Date.now(),
				step_type: "ask_new_world",
				text: "Do you want to create a new world? Respond by typing 'yes' or 'no'.",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			};
			state.messages = [welcomeMessage, firstQuestion];
			state.isLoading = false;
			state.error = null;
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
				state.messages.push(action.payload);
			})
			.addCase(sendMessageToAI.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.error.message || "Failed to get AI response";
			})
			// Handle resetConversation
			.addCase(resetConversation.fulfilled, (state, action) => {
				const firstQuestion: Message = {
					id: "question_" + Date.now(),
					step_type: "ask_new_world",
					text: "Do you want to create a new world? Respond by typing 'yes' or 'no'.",
					isUser: false,
					timestamp: getCurrentTimestamp(),
				};
				state.messages = [action.payload, firstQuestion];
				state.error = null;
			})
			// Handle resetCompleteStore
			.addCase(resetCompleteStore.fulfilled, (state, action) => {
				const firstQuestion: Message = {
					id: "question_" + Date.now(),
					step_type: "ask_new_world",
					text: "Do you want to create a new world? Respond by typing 'yes' or 'no'.",
					isUser: false,
					timestamp: getCurrentTimestamp(),
				};
				state.messages = [action.payload, firstQuestion];
				state.isLoading = false;
				state.error = null;
			});
	},
});

export const { addMessage, setMessages, clearMessages, setLoading, setError, updateMessage, deleteMessage, resetStore } = messagesSlice.actions;

export default messagesSlice.reducer;
