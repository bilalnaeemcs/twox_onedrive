import { CONFIG } from '../config/constants.js';

export class SummaryManager {
	constructor(stateManager, speechManager) {
		this.state = stateManager;
		this.speechManager = speechManager;
	}

	async summarize() {
		const summarizeButton = document.getElementById("summarize-btn");
		try {
			const apiKey = await this.getApiKey();
			if (!apiKey) return;

			const selectedText = await this.getSelectedText();
			if (!selectedText) {
				alert('Please select some text to summarize.');
				return;
			}

			summarizeButton.innerHTML = '<i class="bi bi-hourglass"></i> Summarizing...';
			const summary = await this.callOpenAI(apiKey, selectedText);

			this.state.setCurrentSummary(summary);
			const utterance = this.speechManager.speak(summary);

			summarizeButton.innerHTML = '<i class="bi bi-volume-up"></i> Speaking...';
			utterance.onend = () => {
				summarizeButton.innerHTML = '<i class="bi bi-file-text"></i> Summarize';
			};

		} catch (error) {
			console.error('Error:', error);
			alert('Failed to summarize text. Please check your API key and try again.');
			summarizeButton.innerHTML = '<i class="bi bi-file-text"></i> Summarize';
		}
	}

	async getApiKey() {
		const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.API_KEY]);
		let apiKey = result[CONFIG.STORAGE_KEYS.API_KEY];
		if (!apiKey) {
			apiKey = prompt("Please enter your OpenAI API key:");
			if (!apiKey) {
				alert('API key is required for summarization.');
				return null;
			}
			await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.API_KEY]: apiKey });
		}
		return apiKey;
	}

	async getSelectedText() {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		const [{ result }] = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: () => window.getSelection().toString()
		});
		return result;
	}

	async callOpenAI(apiKey, text) {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: "You are a helpful assistant that creates concise summaries."
					},
					{
						role: "user",
						content: `Please summarize this text concisely: ${text}`
					}
				],
				max_tokens: 150
			})
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error?.message || 'API request failed');
		}
		return data.choices[0].message.content;
	}
}
