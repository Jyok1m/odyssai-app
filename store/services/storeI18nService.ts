import i18n from "../../i18n";

/**
 * Service centralisé pour l'internationalisation dans le store Redux
 * Permet d'obtenir des traductions en dehors des composants React
 */
class StoreI18nService {
	private static instance: StoreI18nService;

	private constructor() {}

	static getInstance(): StoreI18nService {
		if (!StoreI18nService.instance) {
			StoreI18nService.instance = new StoreI18nService();
		}
		return StoreI18nService.instance;
	}

	/**
	 * Traduit une clé avec des options
	 */
	translate(key: string, options?: any): string {
		const result = i18n.t(key, options);
		return typeof result === "string" ? result : String(result);
	}

	/**
	 * Raccourci pour translate
	 */
	t(key: string, options?: any): string {
		return this.translate(key, options);
	}

	/**
	 * Obtient la langue courante
	 */
	getCurrentLanguage(): string {
		return i18n.language;
	}

	/**
	 * Messages par défaut traduisibles
	 */
	getDefaultMessages() {
		return [
			{
				key: "welcome",
				textKey: "messages.welcome",
			},
			{
				key: "cta_ask_new_world",
				textKey: "messages.askInitQuestion",
			},
		];
	}

	/**
	 * Génère les messages par défaut avec traductions
	 */
	generateDefaultMessages(generateId: () => string, getCurrentTimestamp: () => string) {
		const defaultMessages = this.getDefaultMessages();

		return defaultMessages.map((msgTemplate, index) => ({
			id: generateId(),
			currentStep: msgTemplate.key,
			text: this.translate(msgTemplate.textKey),
			isUser: false,
			timestamp: getCurrentTimestamp(),
		}));
	}
}

export default StoreI18nService.getInstance();
