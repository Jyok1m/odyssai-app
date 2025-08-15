import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GameData, GameDataState } from "../types/types";

const initialState: GameDataState = {
	// World
	is_new_world: true,
	world_id: "",
	world_name: "",
	world_genre: "",
	story_directives: "",
	synopsis: "",

	// Character
	is_new_character: true,
	character_id: "",
	character_name: "",
	character_gender: "",
	character_description: "",
};

const gameDataSlice = createSlice({
	name: "gameData",
	initialState,
	reducers: {
		addData: (state, action: PayloadAction<GameData>) => {
			const { key, value } = action.payload;
			// Use proper typing instead of any
			if (key in state) {
				(state as Record<string, any>)[key] = value;
			}
		},
		resetData: (state) => {
			// Use proper reset instead of returning new state
			Object.assign(state, initialState);
		},
	},
});

export const { addData, resetData } = gameDataSlice.actions;

export default gameDataSlice.reducer;
