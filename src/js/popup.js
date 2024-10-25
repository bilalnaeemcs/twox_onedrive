//// Constants
//const CONFIG = {
//	SPEECH: {
//		MIN_RATE: 0.2,
//		MAX_RATE: 4.0,
//		DEFAULT_RATE: 2.5,
//		INCREMENT: 0.1
//	},
//	VIDEO: {
//		MIN_SPEED: 0.25,
//		MAX_SPEED: 5.0,
//		DEFAULT_SPEED: 1.0,
//		INCREMENT: 0.25
//	},
//	STORAGE_KEYS: {
//		VIDEO_SPEED: 'videoPlaybackSpeed',
//		API_KEY: 'openaiApiKey'
//	}
//};
//
//// State management
//class StateManager {
//	constructor() {
//		this.speedupVar = CONFIG.VIDEO.DEFAULT_SPEED;
//		this.speechRate = CONFIG.SPEECH.DEFAULT_RATE;
//		this.currentSummary = '';
//	}
//
//	async initializeState() {
//		const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.VIDEO_SPEED);
//		if (result[CONFIG.STORAGE_KEYS.VIDEO_SPEED]) {
//			this.speedupVar = result[CONFIG.STORAGE_KEYS.VIDEO_SPEED];
//			await this.applySpeedToCurrentVideo();
//		}
//		this.updateSpeedDisplay();
//		this.updateSpeechRateDisplay();
//	}
//
//	async applySpeedToCurrentVideo() {
//		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//		await chrome.scripting.executeScript({
//			target: { tabId: tab.id },
//			function: (speed) => {
//				const video = document.querySelector("video");
//				if (video) video.playbackRate = speed;
//			},
//			args: [this.speedupVar]
//		});
//	}
//
//	updateSpeedDisplay() {
//		document.getElementById("current-speed").textContent = this.speedupVar + "x";
//	}
//
//	updateSpeechRateDisplay() {
//		document.getElementById("speech-rate").textContent = this.speechRate.toFixed(1) + "x";
//	}
//}
//
//// Speech synthesis manager
//class SpeechManager {
//	constructor(stateManager) {
//		this.state = stateManager;
//	}
//
//	speak(text) {
//		window.speechSynthesis.cancel();
//		const utterance = new SpeechSynthesisUtterance(text);
//		utterance.rate = this.state.speechRate;
//		utterance.pitch = 1.0;
//		utterance.volume = 1.0;
//		window.speechSynthesis.speak(utterance);
//		return utterance;
//	}
//
//	adjustRate(increment) {
//		const newRate = this.state.speechRate + increment;
//		if (newRate >= CONFIG.SPEECH.MIN_RATE && newRate <= CONFIG.SPEECH.MAX_RATE) {
//			this.state.speechRate = newRate;
//			this.state.updateSpeechRateDisplay();
//			if (window.speechSynthesis.speaking && this.state.currentSummary) {
//				this.speak(this.state.currentSummary);
//			}
//		}
//	}
//}
//
//// Video speed manager
//class VideoManager {
//	constructor(stateManager) {
//		this.state = stateManager;
//	}
//
//	async adjustSpeed(increment) {
//		const newSpeed = this.state.speedupVar + increment;
//		if (newSpeed > 0) {
//			this.state.speedupVar = newSpeed;
//			await chrome.storage.local.set({
//				[CONFIG.STORAGE_KEYS.VIDEO_SPEED]: this.state.speedupVar
//			});
//			await this.injectSpeedHandler();
//			this.state.updateSpeedDisplay();
//		}
//	}
//
//	async injectSpeedHandler() {
//		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//		await chrome.scripting.executeScript({
//			target: { tabId: tab.id },
//			function: (speed) => {
//				// Apply to current video
//				const video = document.querySelector("video");
//				if (video) {
//					video.playbackRate = speed;
//
//					// Handle dynamic video loading
//					const observer = new MutationObserver((mutations) => {
//						const videos = document.querySelectorAll('video');
//						videos.forEach(v => v.playbackRate = speed);
//					});
//
//					// Start observing only if not already observing
//					if (!video.dataset.speedObserver) {
//						observer.observe(document.body, {
//							childList: true,
//							subtree: true
//						});
//						video.dataset.speedObserver = 'true';
//					}
//				}
//			},
//			args: [this.state.speedupVar]
//		});
//	}
//}
//// Summarization manager
//class SummaryManager {
//	constructor(stateManager, speechManager) {
//		this.state = stateManager;
//		this.speechManager = speechManager;
//	}
//
//	async summarize() {
//		const summarizeButton = document.getElementById("summarize-btn");
//		try {
//			const apiKey = await this.getApiKey();
//			if (!apiKey) return;
//
//			const selectedText = await this.getSelectedText();
//			if (!selectedText) {
//				alert('Please select some text to summarize.');
//				return;
//			}
//
//			summarizeButton.innerHTML = '<i class="bi bi-hourglass"></i> Summarizing...';
//			const summary = await this.callOpenAI(apiKey, selectedText);
//
//			this.state.currentSummary = summary;
//			const utterance = this.speechManager.speak(summary);
//
//			summarizeButton.innerHTML = '<i class="bi bi-volume-up"></i> Speaking...';
//			utterance.onend = () => {
//				summarizeButton.innerHTML = '<i class="bi bi-file-text"></i> Summarize';
//			};
//
//		} catch (error) {
//			console.error('Error:', error);
//			alert('Failed to summarize text. Please check your API key and try again.');
//			summarizeButton.innerHTML = '<i class="bi bi-file-text"></i> Summarize';
//		}
//	}
//
//	async getApiKey() {
//		const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.API_KEY]);
//		let apiKey = result[CONFIG.STORAGE_KEYS.API_KEY];
//		if (!apiKey) {
//			apiKey = prompt("Please enter your OpenAI API key:");
//			if (!apiKey) {
//				alert('API key is required for summarization.');
//				return null;
//			}
//			await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.API_KEY]: apiKey });
//		}
//		return apiKey;
//	}
//
//	async getSelectedText() {
//		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//		const [{ result }] = await chrome.scripting.executeScript({
//			target: { tabId: tab.id },
//			function: () => window.getSelection().toString()
//		});
//		return result;
//	}
//
//	async callOpenAI(apiKey, text) {
//		const response = await fetch('https://api.openai.com/v1/chat/completions', {
//			method: 'POST',
//			headers: {
//				'Content-Type': 'application/json',
//				'Authorization': `Bearer ${apiKey}`
//			},
//			body: JSON.stringify({
//				model: "gpt-4o-mini",
//				messages: [
//					{
//						role: "system",
//						content: "You are a helpful assistant that creates concise summaries."
//					},
//					{
//						role: "user",
//						content: `Please summarize this text concisely: ${text}`
//					}
//				],
//				max_tokens: 150
//			})
//		});
//
//		const data = await response.json();
//		if (!response.ok) {
//			throw new Error(data.error?.message || 'API request failed');
//		}
//		return data.choices[0].message.content;
//	}
//}
//
//// Main initialization
//async function initialize() {
//	const state = new StateManager();
//	const speech = new SpeechManager(state);
//	const video = new VideoManager(state);
//	const summary = new SummaryManager(state, speech);
//
//	await state.initializeState();
//
//	// Event listeners
//	document.getElementById("increase-speed-btn").addEventListener("click", () =>
//		video.adjustSpeed(CONFIG.VIDEO.INCREMENT));
//	document.getElementById("decrease-speed-btn").addEventListener("click", () =>
//		video.adjustSpeed(-CONFIG.VIDEO.INCREMENT));
//
//	document.getElementById("increase-speech-btn").addEventListener("click", () =>
//		speech.adjustRate(CONFIG.SPEECH.INCREMENT));
//	document.getElementById("decrease-speech-btn").addEventListener("click", () =>
//		speech.adjustRate(-CONFIG.SPEECH.INCREMENT));
//
//	document.getElementById("summarize-btn").addEventListener("click", () =>
//		summary.summarize());
//
//	document.getElementById('options-btn')?.addEventListener('click', () =>
//		chrome.runtime.openOptionsPage());
//
//	// Cleanup
//	window.addEventListener('unload', () => window.speechSynthesis.cancel());
//}
//
//// Start the application
//initialize().catch(console.error);
//

import { CONFIG } from './config/constants.js';
import { SpeechManager } from './managers/SpeechManager.js';
import { VideoManager } from './managers/VideoManager.js';
import { SummaryManager } from './managers/SummaryManager.js';
import { StateManager } from './managers/StateManager.js';


// Main initialization
async function initialize() {
	const state = new StateManager();
	const speech = new SpeechManager(state);
	const video = new VideoManager(state);
	const summary = new SummaryManager(state, speech);

	await state.initializeState();

	// Event listeners
	setupEventListeners(video, speech, summary);
}

function setupEventListeners(video, speech, summary) {
	document.getElementById("increase-speed-btn")
		.addEventListener("click", () => video.adjustSpeed(CONFIG.VIDEO.INCREMENT));

	document.getElementById("decrease-speed-btn")
		.addEventListener("click", () => video.adjustSpeed(-CONFIG.VIDEO.INCREMENT));


	document.getElementById("increase-speech-btn").addEventListener("click", () =>
		speech.adjustRate(CONFIG.SPEECH.INCREMENT));
	document.getElementById("decrease-speech-btn").addEventListener("click", () =>
		speech.adjustRate(-CONFIG.SPEECH.INCREMENT));

	document.getElementById("summarize-btn").addEventListener("click", () =>
		summary.summarize());

	document.getElementById('options-btn')?.addEventListener('click', () =>
		chrome.runtime.openOptionsPage());

	// Cleanup
	window.addEventListener('unload', () => window.speechSynthesis.cancel());
}

// Start the application
initialize().catch(console.error);
