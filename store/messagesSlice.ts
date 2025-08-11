import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, MessagesState } from "./types";
import { sendMessageToAI, resetConversation, resetCompleteStore } from "./asyncActions";
import { getCurrentTimestamp } from "./utils";

const initialState: MessagesState = {
	messages: [
		{
			id: "1",
			text: "Welcome to Odyssai! I'm your intelligent RPG assistant. How can I help you create your adventure today?",
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
			// Reset to initial state with a new welcome message
			const welcomeMessage: Message = {
				id: "welcome_" + Date.now(),
				text: "Welcome to Odyssai! I'm your intelligent RPG assistant. How can I help you create your adventure today?",
				isUser: false,
				timestamp: getCurrentTimestamp(),
			};
			state.messages = [welcomeMessage];
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
				state.messages = [action.payload];
				state.error = null;
			})
			// Handle resetCompleteStore
			.addCase(resetCompleteStore.fulfilled, (state, action) => {
				state.messages = [action.payload];
				state.isLoading = false;
				state.error = null;
			});
	},
});

export const { addMessage, setMessages, clearMessages, setLoading, setError, updateMessage, deleteMessage, resetStore } = messagesSlice.actions;

export default messagesSlice.reducer;
