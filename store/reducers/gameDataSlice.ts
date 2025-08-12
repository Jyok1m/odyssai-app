import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GameData, GameDataState } from "../types/types";

const initialState: GameDataState = {
	world_id: "",
	world_name: "",
};

const gameDataSlice = createSlice({
	name: "gameData",
	initialState,
	reducers: {
		addData: (state, action: PayloadAction<GameData>) => {
			const { key, value } = action.payload;
			(state as any)[key] = value;
		},
		resetData: (state) => {
			Object.assign(state, initialState);
		},
	},
});

export const { addData, resetData } = gameDataSlice.actions;

export default gameDataSlice.reducer;
