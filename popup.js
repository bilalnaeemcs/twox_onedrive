// Global variable for playback speed
var speedupVar = 1;

let speechRate = 2.5;

// Update speech rate display
function updateSpeechRate() {
	document.getElementById("speech-rate").textContent = speechRate.toFixed(1) + "x";
}


// speech rate control
document.getElementById("increase-speech-btn").addEventListener("click", () => {
	if (speechRate < 4) {  // Maximum rate limit
		speechRate += 0.1;
		updateSpeechRate();
		// If currently speaking, update the rate
		if (window.speechSynthesis.speaking) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(currentSummary);
			utterance.rate = speechRate;
			utterance.onend = function() {
				document.getElementById("summarize-btn").innerHTML =
					'<i class="bi bi-file-text"></i> Summarize';
			};
			window.speechSynthesis.speak(utterance);
		}
	}
});

document.getElementById("decrease-speech-btn").addEventListener("click", () => {
	if (speechRate > 0.2) {  // Minimum rate limit
		speechRate -= 0.1;
		updateSpeechRate();
		// If currently speaking, update the rate
		if (window.speechSynthesis.speaking) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(currentSummary);
			utterance.rate = speechRate;
			utterance.onend = function() {
				document.getElementById("summarize-btn").innerHTML =
					'<i class="bi bi-file-text"></i> Summarize';
			};
			window.speechSynthesis.speak(utterance);
		}
	}
});

let currentSummary = '';

// Initialize playback speed
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
	chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		function: () => document.querySelector("video")?.playbackRate || 1
	}).then(result => {
		if (result && result[0]) {
			speedupVar = result[0].result;
			updateSpeed();
		}
	}).catch(err => console.error(err));
});

function updateSpeed() {
	document.getElementById("current-speed").textContent = speedupVar + "x";
}

// Existing speed control buttons
const increaseButton = document.getElementById("increase-speed-btn");
increaseButton.addEventListener("click", async () => {
	speedupVar = speedupVar + 0.25;
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		function: (speed) => {
			const video = document.querySelector("video");
			if (video) video.playbackRate = speed;
		},
		args: [speedupVar]
	});
	updateSpeed();
});

const decreaseButton = document.getElementById("decrease-speed-btn");
decreaseButton.addEventListener("click", async () => {
	speedupVar = speedupVar - 0.25;
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		function: (speed) => {
			const video = document.querySelector("video");
			if (video) video.playbackRate = speed;
		},
		args: [speedupVar]
	});
	updateSpeed();
});

// Summarize button functionality
document.getElementById("summarize-btn").addEventListener("click", async () => {
	try {
		// First check if API key exists
		const result = await chrome.storage.local.get(["openaiApiKey"]);
		let apiKey = result.openaiApiKey;

		if (!apiKey) {
			// Prompt user for API key if not found
			apiKey = prompt("Please enter your OpenAI API key:");
			if (!apiKey) {
				alert('API key is required for summarization.');
				return;
			}
			// Save the new API key
			await chrome.storage.local.set({ openaiApiKey: apiKey });
		}

		// Get selected text
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		const [{ result: selectedText }] = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			function: () => window.getSelection().toString()
		});

		if (!selectedText) {
			alert('Please select some text to summarize.');
			return;
		}

		const summarizeButton = document.getElementById("summarize-btn");
		summarizeButton.innerHTML = '<i class="bi bi-hourglass"></i> Summarizing...';

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
						content: `Please summarize this text concisely: ${selectedText}`
					}
				],
				max_tokens: 150
			})
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error?.message || 'API request failed');
		}

		const summary = data.choices[0].message.content;
		currentSummary = summary; // Store the current summary

		// Create speech utterance with current speech rate
		const utterance = new SpeechSynthesisUtterance(summary);
		utterance.rate = speechRate; // Use the current speech rate
		utterance.pitch = 1.0;
		utterance.volume = 1.0;

		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(utterance);

		summarizeButton.innerHTML = '<i class="bi bi-volume-up"></i> Speaking...';

		utterance.onend = function() {
			summarizeButton.innerHTML = '<i class="bi bi-file-text"></i> Summarize';
		};

	} catch (error) {
		console.error('Error:', error);
		alert('Failed to summarize text. Please check your API key and try again.');
		document.getElementById("summarize-btn").innerHTML = '<i class="bi bi-file-text"></i> Summarize';
	}
});

// Add this for options button if you have one
document.getElementById('options-btn')?.addEventListener('click', () => {
	chrome.runtime.openOptionsPage();
});

// Cleanup on unload
window.addEventListener('unload', function() {
	window.speechSynthesis.cancel();
});
