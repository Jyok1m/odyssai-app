import i18n from "../i18n";

export interface TTSOptions {
	text: string;
	languageCode?: string;
	voiceName?: string;
	gender?: string; // "MALE" | "FEMALE"
	audioEncoding?: string; // "MP3" | "OGG_OPUS" | "LINEAR16"
	speakingRate?: number; // fallback si pas de SSML
	pitch?: number; // fallback si pas de SSML

	// --- Diction dynamique ---
	useSSML?: boolean;
	style?: "enchanted" | "neutral" | "urgent";
	googleStyle?: "lively" | "calm" | "empathetic" | "firm" | "apologetic";
	phonemes?: Array<{ word: string; ipa: string }>;
	commaPauseMs?: number;
	sentencePauseMs?: number;
	volumeGainDb?: number;
	sampleRateHertz?: number;
	effectsProfileId?: string[];
	deviceProfile?: "headphone" | "small_speaker" | "car" | "phone";
}

interface GoogleTTSRequest {
	input: {
		text?: string;
		ssml?: string;
	};
	voice: {
		languageCode: string;
		name?: string;
		ssmlGender?: string;
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

	private profileForDevice(p?: TTSOptions["deviceProfile"]): string[] | undefined {
		switch (p) {
			case "small_speaker":
				return ["small-bluetooth-speaker-class-device"];
			case "car":
				return ["car-speaker-class-device"];
			case "phone":
				return ["handset-class-device"];
			case "headphone":
			default:
				return ["headphone-class-device"];
		}
	}

	private getLanguageCode(): string {
		const currentLanguage = i18n.language;
		const languageMap: { [key: string]: string } = {
			en: "en-GB",
			fr: "fr-FR",
			"en-US": "en-GB",
			"fr-FR": "fr-FR",
		};
		return languageMap[currentLanguage] || "en-GB";
	}

	private getDefaultVoice(): string | undefined {
		const currentLanguage = i18n.language;
		const voiceMap: { [key: string]: string } = {
			en: "en-GB-Chirp3-HD-Leda",
			"en-GB": "en-GB-Chirp3-HD-Leda",
			fr: "fr-FR-Chirp3-HD-Charon",
			"fr-FR": "fr-FR-Chirp3-HD-Charon",
		};
		return voiceMap[currentLanguage];
	}

	// --------- Compat & détection capacités voix ---------
	private isStudioVoice(name?: string) {
		return !!name && /-Studio-/.test(name);
	}
	private isNeural2FJ(name?: string) {
		return !!name && /^en-US-Neural2-[FJ]\b/.test(name);
	}
	private supportsSSML(name?: string) {
		return !name || !/Chirp/i.test(name);
	} // Chirp => pas de SSML

	private inferGenderFromVoiceName(name?: string): "FEMALE" | "MALE" | undefined {
		if (!name) return undefined;
		if (/(?:-O\b|-F\b|Hestia|Leda|A\b|E\b)/.test(name)) return "FEMALE";
		if (/(?:-Q\b|-J\b|Orpheus|Charon|D\b|G\b)/.test(name)) return "MALE";
		return undefined;
	}

	// ------------------------- SSML helpers -------------------------
	private escapeSSML(s: string) {
		// Note: on n'échappe pas les apostrophes (') car cela peut causer des pauses non désirées en français
		// Les apostrophes sont généralement bien gérées directement par les moteurs TTS
		return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	private stripSSML(ssml: string): string {
		// Remplacement simple des <break> par ponctuation, puis suppression des balises
		let t = ssml.replace(/<break[^>]*time="(\d+)ms"[^>]*\/>/gi, (_m, ms) => (Number(ms) >= 250 ? " … " : ", "));
		t = t.replace(/<[^>]+>/g, ""); // supprime toutes balises SSML
		return t.replace(/\s{2,}/g, " ").trim();
	}

	private jitter(base: number, pct: number) {
		const delta = base * pct;
		return base + (Math.random() * 2 - 1) * delta;
	}

	private buildOdyssaiSSML(text: string, opt: TTSOptions, voiceName?: string) {
		const t = this.escapeSSML(text.trim());
		const paras = t
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter(Boolean);

		const commaMs = opt.commaPauseMs ?? 140;
		const sentMs = opt.sentencePauseMs ?? 300;

		let rate = 1.0,
			pitchSt = 0;
		switch (opt.style) {
			case "enchanted":
				rate = 0.98;
				pitchSt = +1;
				break;
			case "urgent":
				rate = 1.08;
				pitchSt = 0;
				break;
			case "neutral":
			default:
				rate = 1.0;
				pitchSt = 0;
				break;
		}
		rate = this.jitter(rate, 0.03);
		const isStudio = this.isStudioVoice(voiceName);
		const pitchAttr = isStudio ? "" : ` pitch="${pitchSt >= 0 ? `+${pitchSt}` : `${pitchSt}`}st"`;
		const allowGoogleStyle = this.isNeural2FJ(voiceName);

		// Phonèmes
		const applyPhonemes = (s: string) => {
			if (!opt.phonemes?.length) return s;
			let out = s;
			for (const { word, ipa } of opt.phonemes) {
				const re = new RegExp(`\\b${word}\\b`, "gi");
				out = out.replace(re, `<phoneme alphabet="ipa" ph="${ipa}">${word}</phoneme>`);
			}
			return out;
		};

		// Pauses
		const punctuBreaks = (s: string) => s.replace(/,\s+/g, `,<break time="${commaMs}ms"/> `).replace(/([.!?])\s+/g, `$1<break time="${sentMs}ms"/> `);

		const body = paras
			.map((p, idx) => {
				let seg = punctuBreaks(applyPhonemes(this.escapeSSML(p)));
				const lead = idx === 0 ? `<break time="${Math.max(0, sentMs - 80)}ms"/>` : `<break time="${Math.max(120, sentMs)}ms"/>`;
				return `<p>${lead}<s>${seg}</s></p>`;
			})
			.join("");

		const rateStr = rate.toFixed(2);
		const styleOpen = allowGoogleStyle && opt.googleStyle ? `<google:style name="${opt.googleStyle}">` : "";
		const styleClose = allowGoogleStyle && opt.googleStyle ? `</google:style>` : "";

		return `<speak>${styleOpen}<prosody rate="${rateStr}"${pitchAttr}>${body}</prosody>${styleClose}</speak>`;
	}

	// ------------------- Synthèse principale -------------------
	async synthesizeSpeech(options: TTSOptions): Promise<string> {
		const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;
		if (!API_KEY) throw new Error("Google Cloud API key not found. Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in your .env file");

		const languageCode = options.languageCode || this.getLanguageCode();
		const defaultVoice = this.getDefaultVoice();
		const voiceName = options.voiceName || defaultVoice;

		// Genre: pas de NEUTRAL; déduction par nom de voix si possible
		const inferred = this.inferGenderFromVoiceName(voiceName);
		const chosenGender = options.gender && options.gender !== "NEUTRAL" ? options.gender : inferred || "FEMALE";

		// SSML support ?
		const canSSML = this.supportsSSML(voiceName);
		const wantSSML = !!options.useSSML && canSSML;

		// Construit SSML si possible, sinon texte “nettoyé”
		const ssml = wantSSML ? this.buildOdyssaiSSML(options.text, options, voiceName) : undefined;
		const plainText = wantSSML ? undefined : this.stripSSML(options.text);

		const effects = options.effectsProfileId || this.profileForDevice(options.deviceProfile);

		const request: GoogleTTSRequest = {
			input: ssml ? { ssml } : { text: plainText || options.text },
			voice: {
				languageCode,
				name: voiceName,
				...(chosenGender ? { ssmlGender: chosenGender } : {}),
			},
			audioConfig: {
				audioEncoding: options.audioEncoding || "MP3",
				speakingRate: wantSSML ? undefined : options.speakingRate ?? 1.0,
				pitch: wantSSML ? undefined : options.pitch ?? 0.0,
				volumeGainDb: options.volumeGainDb ?? 0.0,
				sampleRateHertz: options.sampleRateHertz,
				effectsProfileId: effects,
			},
		};

		const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(request),
		});

		if (!res.ok) {
			const errorText = await res.text();
			console.error("TTS API Error:", errorText);

			// Retry si SSML non supporté -> repasser en texte simple
			if (/does not support SSML input/i.test(errorText) && ssml) {
				const noSSMLReq: GoogleTTSRequest = {
					...request,
					input: { text: this.stripSSML(options.text) },
					audioConfig: {
						...request.audioConfig,
						speakingRate: options.speakingRate ?? 1.0,
						pitch: options.pitch ?? 0.0,
					},
				};
				const res2 = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(noSSMLReq),
				});
				if (!res2.ok) {
					const e2 = await res2.text();
					throw new Error(`TTS request failed: ${res2.status} ${e2}`);
				}
				const alt: GoogleTTSResponse = await res2.json();
				if (!alt.audioContent) throw new Error("No audio content received from Google Cloud TTS");
				return `data:audio/mp3;base64,${alt.audioContent}`;
			}

			// Retry pitch interdit sur Studio
			if (/prosody.*pitch/i.test(errorText) && ssml && this.isStudioVoice(voiceName)) {
				const ssmlNoPitch = this.buildOdyssaiSSML(options.text, { ...options }, voiceName); // déjà sans pitch pour Studio
				const req2: GoogleTTSRequest = { ...request, input: { ssml: ssmlNoPitch } };
				const res2 = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(req2),
				});
				if (!res2.ok) {
					const e2 = await res2.text();
					throw new Error(`TTS request failed: ${res2.status} ${e2}`);
				}
				const ok: GoogleTTSResponse = await res2.json();
				if (!ok.audioContent) throw new Error("No audio content received from Google Cloud TTS");
				return `data:audio/mp3;base64,${ok.audioContent}`;
			}

			// Retry genre neutre non supporté -> forcer FEMALE
			if (/Gender neutral voices are not supported/i.test(errorText)) {
				const forced: GoogleTTSRequest = {
					...request,
					voice: { ...request.voice, ssmlGender: inferred || "FEMALE" },
				};
				const res2 = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(forced),
				});
				if (!res2.ok) {
					const e2 = await res2.text();
					throw new Error(`TTS request failed: ${res2.status} ${e2}`);
				}
				const ok: GoogleTTSResponse = await res2.json();
				if (!ok.audioContent) throw new Error("No audio content received from Google Cloud TTS");
				return `data:audio/mp3;base64,${ok.audioContent}`;
			}

			throw new Error(`TTS request failed: ${res.status} ${errorText}`);
		}

		const result: GoogleTTSResponse = await res.json();
		if (!result.audioContent) throw new Error("No audio content received from Google Cloud TTS");
		return `data:audio/mp3;base64,${result.audioContent}`;
	}

	async speak(options: TTSOptions): Promise<string> {
		return this.synthesizeSpeech(options);
	}
}

export default TTSService.getInstance();
