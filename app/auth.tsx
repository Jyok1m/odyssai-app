import React, { useState } from "react";
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Text, View, Button, Pressable } from "@/components/Themed";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppDispatch } from "@/store/hooks/typedHooks";
import { setUser } from "@/store/reducers/userSlice";

export default function AuthScreen() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const dispatch = useAppDispatch();

	const handleAuth = async () => {
		if (!username.trim() || !password.trim()) {
			Alert.alert("Error", "Please enter a username and password");
			return;
		}

		setIsLoading(true);

		try {
			// TODO: Remplacer par les vraies requêtes d'authentification
			const endpoint = isSignUp ? "/signup" : "/signin";

			// Simulation d'une réponse d'authentification réussie
			// À remplacer par une vraie requête fetch
			const mockResponse = {
				username: username,
				user_uuid: `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			};

			// Stocker les données utilisateur dans le store
			dispatch(
				setUser({
					username: mockResponse.username,
					user_uuid: mockResponse.user_uuid,
				})
			);

			// Rediriger vers le chat
			router.replace("/chat");
		} catch (error) {
			Alert.alert("Error", "Authentication failed");
		} finally {
			setIsLoading(false);
		}
	};

	const toggleAuthMode = () => {
		setIsSignUp(!isSignUp);
		setUsername("");
		setPassword("");
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<View style={styles.headerSection}>
				<MaterialCommunityIcons name="book-open-variant" size={60} color="#9a8c98" style={styles.icon} />
				<Text style={styles.appTitle}>Odyssai</Text>
				<Text style={styles.authTitle}>{isSignUp ? "Create Account" : "Sign In"}</Text>
				<Text style={styles.subtitle}>{isSignUp ? "Join the adventure and create your account" : "Sign in to continue your adventure"}</Text>
			</View>

			<View style={styles.formSection}>
				<View style={styles.inputContainer}>
					<MaterialCommunityIcons name="account" size={20} color="#9a8c98" style={styles.inputIcon} />
					<TextInput
						style={styles.input}
						placeholder="Username"
						placeholderTextColor="#9a8c98"
						value={username}
						onChangeText={setUsername}
						autoCapitalize="none"
						autoCorrect={false}
					/>
				</View>

				<View style={styles.inputContainer}>
					<MaterialCommunityIcons name="lock" size={20} color="#9a8c98" style={styles.inputIcon} />
					<TextInput
						style={styles.input}
						placeholder="Password"
						placeholderTextColor="#9a8c98"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						autoCapitalize="none"
						autoCorrect={false}
					/>
				</View>

				<Pressable style={[styles.authButton, isLoading && styles.disabledButton]} onPress={handleAuth} disabled={isLoading}>
					<Text style={styles.authButtonText}>{isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}</Text>
				</Pressable>
			</View>

			<View style={styles.switchSection}>
				<Text style={styles.switchText}>{isSignUp ? "Already have an account?" : "Don't have an account?"}</Text>
				<Pressable onPress={toggleAuthMode} style={styles.switchLinkContainer}>
					<Text style={styles.switchLink}>{isSignUp ? "Sign In" : "Sign Up"}</Text>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
		paddingVertical: 60,
		justifyContent: "center",
		backgroundColor: "#22223b",
	},
	headerSection: {
		alignItems: "center",
		marginBottom: 40,
	},
	icon: {
		marginBottom: 16,
	},
	appTitle: {
		fontSize: 36,
		fontWeight: "bold",
		marginBottom: 16,
		letterSpacing: 1,
		color: "#f2e9e4",
	},
	authTitle: {
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 8,
		color: "#f2e9e4",
	},
	subtitle: {
		fontSize: 16,
		fontWeight: "300",
		textAlign: "center",
		opacity: 0.7,
		lineHeight: 22,
		color: "#c9ada7",
	},
	formSection: {
		marginBottom: 40,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#4a4e69",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#9a8c98",
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: "#f2e9e4",
	},
	authButton: {
		backgroundColor: "#9a8c98",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 8,
	},
	disabledButton: {
		opacity: 0.6,
	},
	authButtonText: {
		color: "#22223b",
		fontSize: 16,
		fontWeight: "600",
	},
	switchSection: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		columnGap: 8,
	},
	switchText: {
		fontSize: 14,
		color: "#c9ada7",
	},
	switchLinkContainer: {
		backgroundColor: "transparent",
	},
	switchLink: {
		fontSize: 14,
		color: "#9a8c98",
		fontWeight: "600",
		textDecorationLine: "underline",
	},
});
