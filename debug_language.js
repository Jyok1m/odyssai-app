// Script de debug pour vérifier la langue sauvegardée
// À exécuter dans la console de votre app ou via Metro

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";

console.log("🔍 === DEBUG LANGUE ===");

// Vérifier AsyncStorage
AsyncStorage.getItem("user-language").then((savedLang) => {
	console.log("📱 Langue sauvegardée dans AsyncStorage:", savedLang);
});

// Vérifier la locale du device
const locales = getLocales();
console.log("🌍 Locale du device:", locales[0]);

// Vérifier i18n
// (à importer selon votre setup)
// console.log('🔤 i18n.language:', i18n.language);
// console.log('🔤 i18n.isInitialized:', i18n.isInitialized);
