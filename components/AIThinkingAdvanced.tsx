import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Animated } from "react-native";
import { TypingText } from "./TypingText";

interface AIThinkingAdvancedProps {
	style?: any;
	textStyle?: any;
}

const thinkingPhrases = [
	"AI is having an existential crisis",
	"Consulting the digital crystal ball",
	"Asking the magic 8-ball for wisdom",
	"Bribing the creativity demons",
	"Stealing ideas from Shakespeare's ghost",
	"Teaching monkeys to type masterpieces",
	"Negotiating with the plot bunnies",
	"Brewing some literary magic",
	"Summoning the muse from her coffee break",
	"Untangling the spaghetti code of imagination",
	"Loading inspiration from the cloud",
	"Debugging the narrative matrix",
	"Charging the imagination batteries",
	"Downloading creativity from the internet",
	"Convincing the pixels to form words",
];

export const AIThinkingAdvanced: React.FC<AIThinkingAdvancedProps> = ({ style, textStyle }) => {
	const [currentPhrase, setCurrentPhrase] = useState(0);
	const [phase, setPhase] = useState<"typing" | "dots">("typing");
	const [dotsCount, setDotsCount] = useState(0);
	const [cycleCount, setCycleCount] = useState(0);
	const [cursorOpacity] = useState(new Animated.Value(1));

	// Change phrase every few seconds
	useEffect(() => {
		if (phase === "dots" && cycleCount > 0 && cycleCount % 15 === 0) {
			// Change phrase every 15 dot cycles (instead of 8) - slower change
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
			}, 600); // Slower dots animation (600ms instead of 400ms)

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
					speed={80}
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
