import { useState, useRef, useCallback, useEffect } from "react";
import { useAudioPlayer } from "expo-audio";
import { Alert } from "react-native";
import TTSService, { TTSOptions } from "../services/ttsService";

interface TTSQueueItem {
	id: string;
	text: string;
	options?: Partial<TTSOptions>;
	audioUri?: string;
}

interface UseTTSReturn {
	isLoading: boolean;
	isPlaying: boolean;
	currentItem: TTSQueueItem | null;
	queue: TTSQueueItem[];
	queueMessage: (id: string, text: string, options?: Partial<TTSOptions>) => Promise<void>;
	playMessage: (id: string, text?: string) => Promise<void>;
	stopCurrentPlayback: () => void;
	clearQueue: () => void;
	skipToNext: () => void;
}

export const useTTS = (): UseTTSReturn => {
	const [isLoading, setIsLoading] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentItem, setCurrentItem] = useState<TTSQueueItem | null>(null);
	const [queue, setQueue] = useState<TTSQueueItem[]>([]);
	const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());

	const audioPlayer = useAudioPlayer();
	const isProcessingQueue = useRef(false);

	// Default TTS options
	const defaultOptions: Partial<TTSOptions> = {
		languageCode: "en-US",
		voiceName: "en-US-Wavenet-D",
		audioEncoding: "MP3",
		speakingRate: 1.0,
		pitch: 0.0,
	};

	// Process the queue
	const processQueue = useCallback(async () => {
		if (isProcessingQueue.current || queue.length === 0 || currentItem !== null) {
			return;
		}

		isProcessingQueue.current = true;
		const nextItem = queue[0];

		try {
			setCurrentItem(nextItem);

			// Check if audio is already cached
			let audioUri = audioCache.get(nextItem.id);

			if (!audioUri) {
				setIsLoading(true);

				const options: TTSOptions = {
					text: nextItem.text,
					...defaultOptions,
					...nextItem.options,
				};

				audioUri = await TTSService.synthesizeSpeech(options);

				// Cache the audio
				setAudioCache((prev) => new Map(prev).set(nextItem.id, audioUri!));
				setQueue((prev) => prev.map((item) => (item.id === nextItem.id ? { ...item, audioUri } : item)));
			}

			setIsLoading(false);

			// Play the audio
			setIsPlaying(true);

			audioPlayer.replace(audioUri);
			audioPlayer.play();
		} catch (error) {
			Alert.alert("TTS Error", "Failed to generate or play audio");
			setIsLoading(false);
			setIsPlaying(false);

			// Remove failed item from queue and continue
			setQueue((prev) => prev.slice(1));
			setCurrentItem(null);
			isProcessingQueue.current = false;
		}
	}, [queue, currentItem, audioCache, audioPlayer]);

	// Handle audio player status changes
	useEffect(() => {
		const subscription = audioPlayer.addListener("playbackStatusUpdate", (status) => {
			if (status.isLoaded) {
				if (status.didJustFinish) {
					setIsPlaying(false);
					setCurrentItem(null);

					// Remove completed item from queue
					setQueue((prev) => {
						const newQueue = prev.slice(1);
						return newQueue;
					});

					// Reset processing flag to allow next item
					isProcessingQueue.current = false;
				}
			}
		});

		return () => subscription?.remove();
	}, [audioPlayer]);

	// Process queue when conditions change
	useEffect(() => {
		processQueue();
	}, [processQueue]);

	// Queue a new message for TTS
	const queueMessage = useCallback(
		async (id: string, text: string, options?: Partial<TTSOptions>) => {
			const newItem: TTSQueueItem = {
				id,
				text: text.trim(),
				options,
			};

			setQueue((prev) => {
				const newQueue = [...prev, newItem];
				return newQueue;
			});
		},
		[queue.length]
	);

	// Play a specific message (replay functionality)
	const playMessage = useCallback(
		async (id: string, text?: string) => {
			try {
				// Check if message is already in cache
				const cachedAudioUri = audioCache.get(id);

				if (cachedAudioUri) {
					// Stop current playback
					if (isPlaying) {
						audioPlayer.pause();
						setIsPlaying(false);
						setCurrentItem(null);
					}

					// Play immediately
					setCurrentItem({ id, text: text || "", audioUri: cachedAudioUri });
					setIsPlaying(true);

					await audioPlayer.replace(cachedAudioUri);
					audioPlayer.play();
				} else if (text) {
					// If not cached but we have text, generate and play
					await queueMessage(id, text);
				} else {
					Alert.alert("Replay Error", "Audio not available for replay");
				}
			} catch (error) {
				Alert.alert("Replay Error", "Failed to replay audio");
			}
		},
		[audioCache, audioPlayer, queueMessage, isPlaying]
	);

	// Stop current playback
	const stopCurrentPlayback = useCallback(() => {
		if (isPlaying) {
			audioPlayer.pause();
			setIsPlaying(false);
			setCurrentItem(null);
		}
	}, [isPlaying, audioPlayer]);

	// Clear the entire queue
	const clearQueue = useCallback(() => {
		stopCurrentPlayback();
		setQueue([]);
		setCurrentItem(null);
	}, [stopCurrentPlayback]);

	// Skip to next item in queue
	const skipToNext = useCallback(() => {
		if (queue.length > 0) {
			stopCurrentPlayback();
			setQueue((prev) => prev.slice(1));
		}
	}, [queue.length, stopCurrentPlayback]);

	return {
		isLoading,
		isPlaying,
		currentItem,
		queue,
		queueMessage,
		playMessage,
		stopCurrentPlayback,
		clearQueue,
		skipToNext,
	};
};
