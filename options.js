// Save options
document.getElementById('save').addEventListener('click', async () => {
	const apiKey = document.getElementById('apiKey').value;
	const status = document.getElementById('status');

	try {
		await chrome.storage.local.set({ openaiApiKey: apiKey });
		status.textContent = 'API key saved successfully!';
		status.style.display = 'block';
		setTimeout(() => {
			status.style.display = 'none';
		}, 2000);
	} catch (error) {
		status.textContent = 'Error saving API key.';
		status.className = 'alert alert-danger mt-3';
		status.style.display = 'block';
	}
});

// Load saved options
document.addEventListener('DOMContentLoaded', async () => {
	const result = await chrome.storage.local.get('openaiApiKey');
	if (result.openaiApiKey) {
		document.getElementById('apiKey').value = result.openaiApiKey;
	}
});
