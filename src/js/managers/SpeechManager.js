import { CONFIG } from '../config/constants.js';

export class SpeechManager {
	constructor(stateManager) {
		this.state = stateManager;
	}

	speak(text) {
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.rate = this.state.getSpeechRate();
		utterance.pitch = 1.0;
		utterance.volume = 1.0;
		window.speechSynthesis.speak(utterance);
		return utterance;
	}

	adjustRate(increment) {
		const newRate = this.state.getSpeechRate() + increment;
		if (newRate >= CONFIG.SPEECH.MIN_RATE && newRate <= CONFIG.SPEECH.MAX_RATE) {
			this.state.setSpeechRate(newRate);
			this.state.updateSpeechRateDisplay();

			if (window.speechSynthesis.speaking && this.state.getCurrentSummary()) {
				this.speak(this.state.getCurrentSummary());
			}
		}
	}

	stop() {
		window.speechSynthesis.cancel();
	}
}
