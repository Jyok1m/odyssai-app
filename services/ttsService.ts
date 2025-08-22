import i18n from "../i18n";

export interface TTSOptions {
	text: string;
	languageCode?: string;
	voiceName?: string;
	gender?: string; // "MALE" | "FEMALE" | "NEUTRAL"
	audioEncoding?: string; // "MP3" | "OGG_OPUS" | "LINEAR16"
	speakingRate?: number; // fallback si pas de SSML
	pitch?: number; // fallback si pas de SSML

	// --- Ajouts pour diction dynamique/envoûtante ---
	useSSML?: boolean; // bascule en SSML
	style?: "enchanted" | "neutral" | "urgent"; // presets prosodie Odyssai
	googleStyle?: "lively" | "calm" | "empathetic" | "firm" | "apologetic"; // si voix compatible
	phonemes?: Array<{ word: string; ipa: string }>; // prononciations personnalisées
	commaPauseMs?: number; // pause après virgules (par défaut 120ms)
	sentencePauseMs?: number; // pause fin de phrase (par défaut 280ms)
	volumeGainDb?: number; // -96.0 à +16.0
	sampleRateHertz?: number; // ex: 22050, 24000, 44100
	effectsProfileId?: string[]; // ex: ["headphone-class-device"]
}

interface GoogleTTSRequest {
	input: {
		text?: string;
		ssml?: string;
	};
	voice: {
		languageCode: string;
		name?: string;
		ssmlGender: string;
	};
	audioConfig: {
		audioEncoding: string;
		speakingRate?: number;
		pitch?: number;
		volumeGainDb?: number;
		sampleRateHertz?: number;
		effectsProfileId?: string[];
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
			en: "en-GB",
			fr: "fr-FR",
			"en-US": "en-GB",
			"fr-FR": "fr-FR",
		};

		const mappedLanguage = languageMap[currentLanguage] || "en-GB";

		return mappedLanguage;
	}

	/**
	 * Obtient la meilleure voix par défaut pour la langue courante
	 */
	private getDefaultVoice(): string | undefined {
		const currentLanguage = i18n.language;

		// Voix par défaut recommandées pour chaque langue
		const voiceMap: { [key: string]: string } = {
			en: "en-GB-Chirp3-HD-Leda",
			"en-GB": "en-GB-Chirp3-HD-Leda",
			fr: "fr-FR-Chirp3-HD-Charon",
			"fr-FR": "fr-FR-Chirp3-HD-Charon",
		};

		const selectedVoice = voiceMap[currentLanguage];

		return selectedVoice;
	}

	// ========================== Helpers SSML ==========================

	private escapeSSML(s: string) {
		return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	}

	private buildOdyssaiSSML(text: string, opt: TTSOptions): string {
		const t = this.escapeSSML(text.trim());

		// Pauses
		const comma = (opt.commaPauseMs ?? 140) + "ms";
		const sent = (opt.sentencePauseMs ?? 300) + "ms";

		let withBreaks = t.replace(/,\s+/g, `,<break time="${comma}"/> `).replace(/([.!?])\s+/g, `$1<break time="${sent}"/> `);

		// Phonèmes
		if (opt.phonemes?.length) {
			for (const { word, ipa } of opt.phonemes) {
				const re = new RegExp(`\\b${word}\\b`, "gi");
				withBreaks = withBreaks.replace(re, `<phoneme alphabet="ipa" ph="${ipa}">${word}</phoneme>`);
			}
		}

		// Prosodie par preset
		let rate = "1.0";
		let pitch = "0st";
		switch (opt.style) {
			case "enchanted":
				rate = "0.98";
				pitch = "+1st";
				break;
			case "urgent":
				rate = "1.08";
				pitch = "+0st";
				break;
			case "neutral":
			default:
				rate = "1.0";
				pitch = "0st";
		}

		// Encapsulage optionnel style Google (si demandé)
		const styleOpen = opt.googleStyle ? `<google:style name="${opt.googleStyle}">` : "";
		const styleClose = opt.googleStyle ? `</google:style>` : "";

		return `<speak>${styleOpen}<prosody rate="${rate}" pitch="${pitch}">${withBreaks}</prosody>${styleClose}</speak>`;
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
			const voiceName = options.voiceName || defaultVoice;

			// Bascule SSML si demandé
			const useSSML = !!options.useSSML;
			const ssml = useSSML ? this.buildOdyssaiSSML(options.text, options) : undefined;

			const request: GoogleTTSRequest = {
				input: ssml ? { ssml } : { text: options.text },
				voice: {
					languageCode: languageCode,
					name: voiceName,
					ssmlGender: options.gender || "NEUTRAL",
				},
				audioConfig: {
					audioEncoding: options.audioEncoding || "MP3",
					// Si SSML est fourni, speakingRate/pitch peuvent être omis (gérés par <prosody>)
					speakingRate: useSSML ? undefined : options.speakingRate || 1.0,
					pitch: useSSML ? undefined : options.pitch || 0.0,
					volumeGainDb: options.volumeGainDb ?? 0.0,
					sampleRateHertz: options.sampleRateHertz,
					effectsProfileId: options.effectsProfileId,
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
