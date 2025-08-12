import { configureStore } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import messagesReducer from "./reducers/messagesSlice";

const persistConfig = {
	key: "odyssai",
	storage: AsyncStorage,
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
