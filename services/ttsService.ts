export interface TTSOptions {
	text: string;
	languageCode?: string;
	voiceName?: string;
	gender?: "MALE" | "FEMALE" | "NEUTRAL";
	audioEncoding?: "LINEAR16" | "MP3" | "OGG_OPUS";
	speakingRate?: number;
	pitch?: number;
}

interface GoogleTTSRequest {
	input: {
		text: string;
	};
	voice: {
		languageCode: string;
		name?: string;
		ssmlGender: string;
	};
	audioConfig: {
		audioEncoding: string;
		speakingRate: number;
		pitch: number;
	};
}

interface GoogleTTSResponse {
	audioContent: string;
}

class TTSService {
	private static instance: TTSService;

	private constructor() {}

	static getInstance(): TTSService {
		if (!TTSService.instance) {
			TTSService.instance = new TTSService();
		}
		return TTSService.instance;
	}

	async synthesizeSpeech(options: TTSOptions): Promise<string> {
		try {
			// Use the Google Cloud API key directly
			const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

			if (!API_KEY) {
				throw new Error("Google Cloud API key not found. Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in your .env file");
			}

			const request: GoogleTTSRequest = {
				input: {
					text: options.text,
				},
				voice: {
					languageCode: options.languageCode || "en-US",
					name: options.voiceName,
					ssmlGender: options.gender || "NEUTRAL",
				},
				audioConfig: {
					audioEncoding: options.audioEncoding || "MP3",
					speakingRate: options.speakingRate || 1.0,
					pitch: options.pitch || 0.0,
				},
			};

			console.log("Sending TTS request to Google Cloud API");
			const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("TTS API Error:", errorText);
				throw new Error(`TTS request failed: ${response.status} ${errorText}`);
			}

			const result: GoogleTTSResponse = await response.json();

			if (!result.audioContent) {
				throw new Error("No audio content received from Google Cloud TTS");
			}

			// Convert base64 audio to data URI
			const audioDataUri = `data:audio/mp3;base64,${result.audioContent}`;
			console.log("TTS audio generated successfully");
			return audioDataUri;
		} catch (error) {
			console.error("TTS synthesis error:", error);
			throw error;
		}
	}
}

export default TTSService.getInstance();
