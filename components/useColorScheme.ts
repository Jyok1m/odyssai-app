import { useColorScheme as useNativeColorScheme } from "react-native";

/**
 * Hook personnalisé qui force le thème sombre pour Odyssai
 */
export function useColorScheme(): "dark" {
	return "dark"; // Force toujours le thème sombre pour Odyssai
}

/**
 * Hook pour obtenir le thème du système si nécessaire
 */
export function useSystemColorScheme() {
	return useNativeColorScheme();
}
