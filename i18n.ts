import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translations
import enCommon from "./locales/en/common.json";
import frCommon from "./locales/fr/common.json";

// Language detection plugin
const languageDetectorPlugin = {
	type: "languageDetector" as const,
	async: true,
	init: () => {},
	detect: async (callback: (lng: string) => void) => {
		try {
			// Get saved language from AsyncStorage
			const savedLanguage = await AsyncStorage.getItem("user-language");

			if (savedLanguage) {
				callback(savedLanguage);
				return;
			}

			// If no saved language, use device locale
			const locales = getLocales();
			const deviceLocale = locales[0]?.languageCode || "en";

			// Default to supported languages
			const supportedLanguages = ["en", "fr"];
			const finalLanguage = supportedLanguages.includes(deviceLocale) ? deviceLocale : "en";

			callback(finalLanguage);
		} catch (error) {
			console.log("Error detecting language:", error);
			callback("en"); // Fallback to English
		}
	},
	cacheUserLanguage: async (lng: string) => {
		try {
			await AsyncStorage.setItem("user-language", lng);
		} catch (error) {
			console.log("Error saving language:", error);
		}
	},
};

// Initialize i18next
i18n
	.use(languageDetectorPlugin as any)
	.use(initReactI18next)
	.init({
		compatibilityJSON: "v4", // Required for React Native
		fallbackLng: "en",
		// debug: __DEV__, // Enable debug mode in development

		resources: {
			en: {
				common: enCommon,
			},
			fr: {
				common: frCommon,
			},
		},

		defaultNS: "common",
		ns: ["common"],

		interpolation: {
			escapeValue: false, // React Native doesn't require HTML escaping
		},

		react: {
			useSuspense: false, // Disable suspense for React Native
		},
	});

export default i18n;
