import { useCallback } from "react";
import { useAppDispatch, getCurrentTimestamp } from "./messagesSlice";
import { addMessage, clearMessages } from "./messagesSlice";
import { resetCompleteStore, sendMessageToAI } from "./asyncActions";
import { Message } from "./types";

export const useChatActions = () => {
	const dispatch = useAppDispatch();

	const sendMessage = useCallback(
		(text: string, msg_type?: string) => {
			const newMessage: Message = {
				id: Date.now().toString(),
				step_type: msg_type ?? "user_message",
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
