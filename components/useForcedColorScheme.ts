import { useColorScheme as useNativeColorScheme } from "react-native";

/**
 * Hook personnalisé qui force le thème sombre pour Odyssai
 * ou retourne le thème du système si souhaité
 */
export function useForcedColorScheme(forceDark: boolean = true): "light" | "dark" {
	const systemColorScheme = useNativeColorScheme();

	return forceDark ? "dark" : systemColorScheme ?? "dark";
}

export function useColorScheme(): "light" | "dark" {
	return useForcedColorScheme(true); // Force toujours le thème sombre
}
