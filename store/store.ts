import { configureStore, combineReducers } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import messagesReducer from "./reducers/messagesSlice";
import gameDataReducer from "./reducers/gameDataSlice";
import userReducer from "./reducers/userSlice";

const persistConfig = {
	key: "odyssai",
	storage: AsyncStorage,
	whitelist: ["messages", "gameData", "user"], // Persister les trois stores
	version: 1, // Ajout d'une version pour gérer les migrations futures
};

const rootReducer = combineReducers({
	messages: messagesReducer,
	gameData: gameDataReducer,
	user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
