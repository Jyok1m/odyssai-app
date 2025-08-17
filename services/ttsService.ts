import i18n from "../i18n";

export interface TTSOptions {
	text: string;
	languageCode?: string;
	voiceName?: string;
	gender?: string;
	audioEncoding?: string;
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

	/**
	 * Obtient le code de langue pour TTS basé sur la langue courante de l'app
	 */
	private getLanguageCode(): string {
		const currentLanguage = i18n.language;

		// Map les codes de langue i18n vers les codes TTS Google Cloud
		const languageMap: { [key: string]: string } = {
			en: "en-US",
			fr: "fr-FR",
			"en-US": "en-US",
			"fr-FR": "fr-FR",
		};

		const mappedLanguage = languageMap[currentLanguage] || "en-US";

		return mappedLanguage;
	}

	/**
	 * Obtient la meilleure voix par défaut pour la langue courante
	 */
	private getDefaultVoice(): string | undefined {
		const currentLanguage = i18n.language;

		// Voix par défaut recommandées pour chaque langue
		const voiceMap: { [key: string]: string } = {
			en: "en-US-Wavenet-D", // Voix masculine naturelle
			"en-US": "en-US-Wavenet-D",
			fr: "fr-FR-Wavenet-B", // Voix masculine naturelle française
			"fr-FR": "fr-FR-Wavenet-B",
		};

		const selectedVoice = voiceMap[currentLanguage];

		return selectedVoice;
	}

	/**
	 * Synthétise le texte avec Google Cloud TTS dans la langue courante de l'app
	 */
	async synthesizeSpeech(options: TTSOptions): Promise<string> {
		try {
			const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

			if (!API_KEY) {
				throw new Error("Google Cloud API key not found. Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in your .env file");
			}

			// Utilise automatiquement la langue courante de l'app
			const languageCode = options.languageCode || this.getLanguageCode();
			const defaultVoice = this.getDefaultVoice();

			const request: GoogleTTSRequest = {
				input: {
					text: options.text,
				},
				voice: {
					languageCode: languageCode,
					name: options.voiceName || defaultVoice,
					ssmlGender: options.gender || "NEUTRAL",
				},
				audioConfig: {
					audioEncoding: options.audioEncoding || "MP3",
					speakingRate: options.speakingRate || 1.0,
					pitch: options.pitch || 0.0,
				},
			};

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

			const audioDataUri = `data:audio/mp3;base64,${result.audioContent}`;
			return audioDataUri;
		} catch (error) {
			console.error("TTS synthesis error:", error);
			throw error;
		}
	}

	/**
	 * Méthode de compatibilité pour speak (utilise Google Cloud TTS)
	 */
	async speak(options: TTSOptions): Promise<string> {
		return this.synthesizeSpeech(options);
	}
}

export default TTSService.getInstance();
