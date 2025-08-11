import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";

// Sélecteur de base pour l'état des messages
export const selectMessagesState = (state: RootState) => state.messages;

// Sélecteurs spécifiques
export const selectMessages = createSelector([selectMessagesState], (messagesState) => messagesState.messages);

export const selectIsLoading = createSelector([selectMessagesState], (messagesState) => messagesState.isLoading);

export const selectError = createSelector([selectMessagesState], (messagesState) => messagesState.error);

// Sélecteur pour obtenir le nombre de messages
export const selectMessagesCount = createSelector([selectMessages], (messages) => messages.length);

// Sélecteur pour obtenir les messages de l'utilisateur uniquement
export const selectUserMessages = createSelector([selectMessages], (messages) => messages.filter((message) => message.isUser));

// Sélecteur pour obtenir les messages du bot uniquement
export const selectBotMessages = createSelector([selectMessages], (messages) => messages.filter((message) => !message.isUser));

// Sélecteur pour obtenir le dernier message
export const selectLastMessage = createSelector([selectMessages], (messages) => messages[messages.length - 1] || null);
