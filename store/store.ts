import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { storage } from "./storage";
import messagesReducer from "./messagesSlice";

const persistConfig = {
	key: "odyssai",
	storage,
	whitelist: ["messages"], // Seuls les messages seront persistés
};

const persistedReducer = persistReducer(persistConfig, messagesReducer);

export const store = configureStore({
	reducer: {
		messages: persistedReducer,
	},
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
