import { CONFIG } from '../config/constants.js';

export class OptionsManager {
	constructor() {
		this.setupEventListeners();
		this.loadSavedOptions();
	}

	async saveApiKey(apiKey) {
		try {
			await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.API_KEY]: apiKey });
			this.showStatus('API key saved successfully!', 'success');
		} catch (error) {
			this.showStatus('Error saving API key.', 'danger');
		}
	}

	showStatus(message, type = 'success') {
		const status = document.getElementById('status');
		status.textContent = message;
		status.className = `alert alert-${type} mt-3`;
		status.style.display = 'block';

		if (type === 'success') {
			setTimeout(() => {
				status.style.display = 'none';
			}, 2000);
		}
	}

	async loadSavedOptions() {
		const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.API_KEY);
		if (result[CONFIG.STORAGE_KEYS.API_KEY]) {
			document.getElementById('apiKey').value = result[CONFIG.STORAGE_KEYS.API_KEY];
		}
	}

	setupEventListeners() {
		document.getElementById('save').addEventListener('click', async () => {
			const apiKey = document.getElementById('apiKey').value;
			await this.saveApiKey(apiKey);
		});
	}
}
