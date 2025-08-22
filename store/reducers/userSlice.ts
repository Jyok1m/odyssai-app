import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
	user_uuid: string | null;
	username: string | null;
	isAuthenticated: boolean;
	language: string | null;
	ttsEnabled: boolean;
}

const initialState: UserState = {
	user_uuid: null,
	username: null,
	isAuthenticated: false,
	language: null,
	ttsEnabled: true,
};

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<{ user_uuid: string; username: string; language: string | null }>) => {
			state.user_uuid = action.payload.user_uuid;
			state.username = action.payload.username;
			state.isAuthenticated = true;
			state.language = action.payload.language;
			state.ttsEnabled = true;
		},
		clearUser: (state) => {
			state.user_uuid = null;
			state.username = null;
			state.isAuthenticated = false;
			state.language = null;
			state.ttsEnabled = true;
		},
		toggleTTS: (state) => {
			state.ttsEnabled = !state.ttsEnabled;
		},
	},
});

export const { setUser, clearUser, toggleTTS } = userSlice.actions;
export default userSlice.reducer;
