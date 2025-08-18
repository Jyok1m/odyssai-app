import { toast, ToastOptions } from "@backpackapp-io/react-native-toast";

export function useToast() {
	const success = (message: string, options?: ToastOptions) => {
		toast.success(message, {
			duration: 3000,
			styles: {
				indicator: { backgroundColor: "#c9ada7" },
			},
			...options,
		});
	};

	const error = (message: string, options?: ToastOptions) => {
		toast.error(message, {
			duration: 3000,
			styles: {
				indicator: { backgroundColor: "rgb(231, 76, 60)" },
			},
			...options,
		});
	};

	return { success, error };
}
