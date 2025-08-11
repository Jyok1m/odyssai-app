import { useCallback } from "react";
import { useAppDispatch } from "./hooks";
import { addMessage, clearMessages } from "./messagesSlice";
import { resetCompleteStore, sendMessageToAI } from "./asyncActions";
import { getCurrentTimestamp } from "./utils";
import { Message } from "./types";

export const useChatActions = () => {
	const dispatch = useAppDispatch();

	const sendMessage = useCallback(
		(text: string) => {
			const newMessage: Message = {
				id: Date.now().toString(),
				text,
				isUser: true,
				timestamp: getCurrentTimestamp(),
			};

			dispatch(addMessage(newMessage));
			dispatch(sendMessageToAI(text));
		},
		[dispatch]
	);

	const resetChat = useCallback(() => {
		dispatch(resetCompleteStore());
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
