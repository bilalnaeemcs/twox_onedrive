import { CONFIG } from '../config/constants.js';

export class StateManager {
	constructor() {
		this.speedupVar = CONFIG.VIDEO.DEFAULT_SPEED;
		this.speechRate = CONFIG.SPEECH.DEFAULT_RATE;
		this.currentSummary = '';
	}

	async initializeState() {
		const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.VIDEO_SPEED);
		if (result[CONFIG.STORAGE_KEYS.VIDEO_SPEED]) {
			this.speedupVar = result[CONFIG.STORAGE_KEYS.VIDEO_SPEED];
			await this.applySpeedToCurrentVideo();
		}
		this.updateSpeedDisplay();
		this.updateSpeechRateDisplay();
	}

	async applySpeedToCurrentVideo() {
		console.log("updated speed to ");
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		console.log("updated speed to " + this.speedupVar);
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: (speed) => {
				console.log("updated speed to " + speed);
				const video = document.querySelector("video");
				if (video) video.playbackRate = speed;
			},
			args: [this.speedupVar]
		});
	}

	getVideoSpeed() {
		return this.speedupVar;
	}

	async setVideoSpeed(newSpeed) {
		this.speedupVar = newSpeed;
		this.updateSpeedDisplay(); // Update UI display
		await this.applySpeedToCurrentVideo();
	}

	getSpeechRate() {
		return this.speechRate
	}

	setSpeechRate(newRate) {
		this.speechRate = newRate;
		this.updateSpeechRateDisplay();
	}

	getCurrentSummary() {
		return this.currentSummary;
	}

	setCurrentSummary(summary) {
		this.currentSummary = summary
	}

	updateSpeedDisplay() {
		document.getElementById("current-speed").textContent = this.speedupVar + "x";
	}

	updateSpeechRateDisplay() {
		document.getElementById("speech-rate").textContent = this.speechRate.toFixed(1) + "x";
	}
}
