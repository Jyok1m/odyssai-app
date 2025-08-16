import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
	user_uuid: string | null;
	username: string | null;
	isAuthenticated: boolean;
}

const initialState: UserState = {
	user_uuid: null,
	username: null,
	isAuthenticated: false,
};

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<{ user_uuid: string; username: string }>) => {
			state.user_uuid = action.payload.user_uuid;
			state.username = action.payload.username;
			state.isAuthenticated = true;
		},
		clearUser: (state) => {
			state.user_uuid = null;
			state.username = null;
			state.isAuthenticated = false;
		},
	},
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
