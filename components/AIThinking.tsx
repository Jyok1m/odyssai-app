import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Animated } from "react-native";
import { TypingText } from "./TypingText";

interface AIThinkingProps {
	style?: any;
	textStyle?: any;
}

export const AIThinking: React.FC<AIThinkingProps> = ({ style, textStyle }) => {
	const [phase, setPhase] = useState<"typing" | "dots">("typing");
	const [dotsCount, setDotsCount] = useState(0);
	const [cursorOpacity] = useState(new Animated.Value(1));

	// Animation des points après le typing
	useEffect(() => {
		if (phase === "dots") {
			const interval = setInterval(() => {
				setDotsCount((prev) => (prev + 1) % 4); // 0, 1, 2, 3, puis retour à 0
			}, 400);

			return () => clearInterval(interval);
		}
	}, [phase]);

	// Animation du cursor clignotant
	useEffect(() => {
		if (phase === "dots") {
			const blinkAnimation = Animated.loop(
				Animated.sequence([
					Animated.timing(cursorOpacity, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(cursorOpacity, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
				])
			);
			blinkAnimation.start();

			return () => blinkAnimation.stop();
		}
	}, [phase, cursorOpacity]);

	const handleTypingComplete = () => {
		setPhase("dots");
	};

	const baseText = "AI is thinking";
	const dots = ".".repeat(dotsCount);

	return (
		<View style={[styles.container, style]}>
			{phase === "typing" ? (
				<TypingText text={baseText} speed={60} style={[styles.text, textStyle]} showCursor={true} cursorChar="|" onComplete={handleTypingComplete} />
			) : (
				<View style={styles.textContainer}>
					<Text style={[styles.text, textStyle]}>
						{baseText}
						{dots}
					</Text>
					<Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>|</Animated.Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
	},
	textContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	text: {
		fontSize: 14,
		fontStyle: "italic",
		color: "#9a8c98",
	},
	cursor: {
		fontSize: 14,
		color: "#9a8c98",
		marginLeft: 1,
	},
});
