import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useI18n = () => {
	const { t: originalT, i18n } = useTranslation();

	// Enhanced translation function with better TypeScript support
	const t = (key: string, options?: any): string => {
		const result = originalT(key, options);
		return typeof result === "string" ? result : String(result);
	};

	const changeLanguage = async (language: string) => {
		try {
			await i18n.changeLanguage(language);
			await AsyncStorage.setItem("user-language", language);
		} catch (error) {
			console.error("Error changing language:", error);
		}
	};

	const getCurrentLanguage = () => i18n.language;

	const getAvailableLanguages = () => ["en", "fr"];

	return {
		t,
		changeLanguage,
		currentLanguage: getCurrentLanguage(),
		availableLanguages: getAvailableLanguages(),
		isRTL: i18n.dir() === "rtl",
	};
}; // Type-safe translation function
export type TranslationKey =
	| "app.name"
	| "app.tagline"
	| "auth.signIn"
	| "auth.signUp"
	| "auth.username"
	| "auth.password"
	| "auth.loading"
	| "auth.signInSubtitle"
	| "auth.signUpSubtitle"
	| "auth.alreadyHaveAccount"
	| "auth.dontHaveAccount"
	| "auth.errors.emptyFields"
	| "auth.errors.authFailed"
	| "chat.placeholder"
	| "chat.send"
	| "chat.thinking"
	| "chat.newConversation"
	| "chat.clearHistory"
	| "menu.profile"
	| "menu.settings"
	| "menu.language"
	| "menu.logout"
	| "menu.reset"
	| "menu.gameData"
	| "modals.logout.title"
	| "modals.logout.message"
	| "modals.logout.confirm"
	| "modals.logout.cancel"
	| "modals.reset.title"
	| "modals.reset.message"
	| "modals.reset.confirm"
	| "modals.reset.cancel"
	| "modals.gameData.title"
	| "modals.gameData.close"
	| "common.ok"
	| "common.cancel"
	| "common.confirm"
	| "common.close"
	| "common.save"
	| "common.edit"
	| "common.delete"
	| "common.error"
	| "common.success"
	| "common.loading"
	| "common.retry";
