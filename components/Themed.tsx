/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import React from "react";
import {
	Text as DefaultText,
	View as DefaultView,
	Pressable as DefaultPressable,
	TextInput as DefaultTextInput,
	ScrollView as DefaultScrollView,
	SafeAreaView as DefaultSafeAreaView,
	TouchableOpacity as DefaultTouchableOpacity,
	PressableProps as DefaultPressableProps,
	TextInputProps as DefaultTextInputProps,
	ScrollViewProps as DefaultScrollViewProps,
	TouchableOpacityProps as DefaultTouchableOpacityProps,
} from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "./useColorScheme";

type ThemeProps = {
	lightColor?: string;
	darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];
export type PressableProps = ThemeProps & DefaultPressableProps;
export type TextInputProps = ThemeProps &
	DefaultTextInputProps & {
		placeholderTextColor?: string;
	};
export type ScrollViewProps = ThemeProps & DefaultScrollViewProps;
export type SafeAreaViewProps = ThemeProps & React.ComponentProps<typeof DefaultSafeAreaView>;
export type TouchableOpacityProps = ThemeProps & DefaultTouchableOpacityProps;

export function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light & keyof typeof Colors.dark) {
	const theme = useColorScheme() ?? "light";
	const colorFromProps = props[theme];

	if (colorFromProps) {
		return colorFromProps;
	} else {
		return Colors[theme][colorName];
	}
}

export function Text(props: TextProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

	return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "background");

	return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function Pressable(props: PressableProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "card");

	return (
		<DefaultPressable
			style={(state) => [{ backgroundColor, opacity: state.pressed ? 0.8 : 1 }, typeof style === "function" ? style(state) : style]}
			{...otherProps}
		/>
	);
}

export function TextInput(props: TextInputProps) {
	const { style, lightColor, darkColor, placeholderTextColor, ...otherProps } = props;
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
	const backgroundColor = useThemeColor({}, "card");
	const borderColor = useThemeColor({}, "border");
	const defaultPlaceholderColor = useThemeColor({}, "accent");

	return (
		<DefaultTextInput
			style={[
				{
					color,
					backgroundColor,
					borderColor,
					borderWidth: 1,
					borderRadius: 8,
					padding: 12,
				},
				style,
			]}
			placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
			{...otherProps}
		/>
	);
}

export function ScrollView(props: ScrollViewProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "background");

	return <DefaultScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function SafeAreaView(props: SafeAreaViewProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "background");

	return <DefaultSafeAreaView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function TouchableOpacity(props: TouchableOpacityProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "primary");

	return <DefaultTouchableOpacity style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function Card(props: ViewProps) {
	const { style, lightColor, darkColor, ...otherProps } = props;
	const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "card");
	const borderColor = useThemeColor({}, "border");

	return (
		<DefaultView
			style={[
				{
					backgroundColor,
					borderColor,
					borderWidth: 1,
					borderRadius: 12,
					padding: 16,
					shadowColor: "#000",
					shadowOffset: {
						width: 0,
						height: 2,
					},
					shadowOpacity: 0.1,
					shadowRadius: 3.84,
					elevation: 5,
				},
				style,
			]}
			{...otherProps}
		/>
	);
}

export function Button(props: PressableProps & { title?: string; variant?: "primary" | "secondary" }) {
	const { style, lightColor, darkColor, title, variant = "primary", children, ...otherProps } = props;

	const backgroundColor =
		variant === "primary"
			? useThemeColor({ light: lightColor, dark: darkColor }, "primary")
			: useThemeColor({ light: lightColor, dark: darkColor }, "secondary");

	const textColor = variant === "primary" ? useThemeColor({}, "background") : useThemeColor({}, "text");

	return (
		<DefaultPressable
			style={(state) => [
				{
					backgroundColor,
					paddingHorizontal: 24,
					paddingVertical: 12,
					borderRadius: 8,
					alignItems: "center",
					justifyContent: "center",
					opacity: state.pressed ? 0.8 : 1,
				},
				typeof style === "function" ? style(state) : style,
			]}
			{...otherProps}
		>
			{title ? <DefaultText style={{ color: textColor, fontWeight: "600" }}>{title}</DefaultText> : children}
		</DefaultPressable>
	);
}
