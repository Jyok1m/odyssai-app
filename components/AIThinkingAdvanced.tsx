import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Animated } from "react-native";
import { TypingText } from "./TypingText";

interface AIThinkingAdvancedProps {
	style?: any;
	textStyle?: any;
}

const thinkingPhrases = ["AI is thinking", "Generating response", "Processing your request", "Crafting your adventure", "Weaving magic into words"];

export const AIThinkingAdvanced: React.FC<AIThinkingAdvancedProps> = ({ style, textStyle }) => {
	const [currentPhrase, setCurrentPhrase] = useState(0);
	const [phase, setPhase] = useState<"typing" | "dots">("typing");
	const [dotsCount, setDotsCount] = useState(0);
	const [cycleCount, setCycleCount] = useState(0);
	const [cursorOpacity] = useState(new Animated.Value(1));

	// Change phrase every few seconds
	useEffect(() => {
		if (phase === "dots" && cycleCount > 0 && cycleCount % 8 === 0) {
			// Change phrase every 8 dot cycles
			setCurrentPhrase((prev) => (prev + 1) % thinkingPhrases.length);
			setPhase("typing");
			setDotsCount(0);
		}
	}, [cycleCount, phase]);

	// Animation des points après le typing
	useEffect(() => {
		if (phase === "dots") {
			const interval = setInterval(() => {
				setDotsCount((prev) => {
					const newCount = (prev + 1) % 4;
					if (newCount === 0) {
						setCycleCount((c) => c + 1);
					}
					return newCount;
				});
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

	const currentText = thinkingPhrases[currentPhrase];
	const dots = ".".repeat(dotsCount);

	return (
		<View style={[styles.container, style]}>
			{phase === "typing" ? (
				<TypingText
					text={currentText}
					speed={50}
					style={[styles.text, textStyle]}
					showCursor={true}
					cursorChar="|"
					onComplete={handleTypingComplete}
				/>
			) : (
				<View style={styles.textContainer}>
					<Text style={[styles.text, textStyle]}>
						{currentText}
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
		minHeight: 20,
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
