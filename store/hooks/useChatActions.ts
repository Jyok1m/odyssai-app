import { useCallback } from "react";
import { useAppDispatch } from "../hooks/typedHooks";
import { addMessage, clearMessages } from "../reducers/messagesSlice";
import { resetData } from "../reducers/gameDataSlice";
import { resetCompleteStore, sendMessageToAI } from "../asyncActions";
import { getCurrentTimestamp } from "../utils/utils";
import { Message } from "../types/types";

export const useChatActions = () => {
	const dispatch = useAppDispatch();

	const sendMessage = useCallback(
		(text: string, currentStep = "N/A", ctaValue?: string) => {
			const newMessage: Message = {
				id: Date.now().toString(),
				currentStep: currentStep,
				text,
				isUser: true,
				timestamp: getCurrentTimestamp(),
				ctaValue,
			};

			if (!["continue_story", "pause_story"].includes(ctaValue || "")) {
				dispatch(addMessage(newMessage));
			}
			dispatch(sendMessageToAI({ text, ctaValue }));
		},
		[dispatch]
	);

	const resetChat = useCallback(() => {
		dispatch(resetData()); // Reset gameData first
		dispatch(resetCompleteStore()); // Then reset messages
	}, [dispatch]);

	const clearAllMessages = useCallback(() => {
		dispatch(clearMessages());
	}, [dispatch]);

	return {
		sendMessage,
		resetChat,
		clearAllMessages,
	};
};
