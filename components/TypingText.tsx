import React, { useState, useEffect } from "react";
import { Text, StyleSheet } from "react-native";

interface TypingTextProps {
	text: string;
	speed?: number;
	style?: any;
	showCursor?: boolean;
	cursorChar?: string;
	onComplete?: () => void;
}

export const TypingText: React.FC<TypingTextProps> = ({ text, speed = 100, style, showCursor = true, cursorChar = "|", onComplete }) => {
	const [displayText, setDisplayText] = useState("");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showCursorState, setShowCursorState] = useState(true);

	useEffect(() => {
		if (currentIndex < text.length) {
			const timeout = setTimeout(() => {
				setDisplayText(text.slice(0, currentIndex + 1));
				setCurrentIndex(currentIndex + 1);
			}, speed);

			return () => clearTimeout(timeout);
		} else {
			onComplete?.();
		}
	}, [currentIndex, text, speed, onComplete]);

	// Cursor blinking effect
	useEffect(() => {
		if (showCursor) {
			const interval = setInterval(() => {
				setShowCursorState((prev) => !prev);
			}, 500);

			return () => clearInterval(interval);
		}
	}, [showCursor]);

	// Reset when text changes
	useEffect(() => {
		setDisplayText("");
		setCurrentIndex(0);
	}, [text]);

	return (
		<Text style={style}>
			{displayText}
			{showCursor && showCursorState && cursorChar}
		</Text>
	);
};
