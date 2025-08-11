// Utilitaires pour gérer les timestamps

export const formatTimestamp = (timestamp: string): string => {
	try {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	} catch (error) {
		console.warn("Invalid timestamp format:", timestamp);
		return "00:00";
	}
};

export const getCurrentTimestamp = (): string => {
	return new Date().toISOString();
};

export const isValidTimestamp = (timestamp: string): boolean => {
	const date = new Date(timestamp);
	return !isNaN(date.getTime());
};
