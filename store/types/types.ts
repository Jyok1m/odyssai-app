export interface Message {
	id: string;
	currentStep: string;
	text: string;
	isUser: boolean;
	timestamp: string; // Utiliser string au lieu de Date pour la sérialisation
}

export interface MessagesState {
	messages: Message[];
	isLoading: boolean;
	error: string | null;
}
