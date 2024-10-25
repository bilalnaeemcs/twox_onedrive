import { CONFIG } from '../config/constants.js';

export class VideoManager {
	constructor(stateManager) {
		this.state = stateManager;
	}

	async adjustSpeed(increment) {
		const newSpeed = this.state.getVideoSpeed() + increment;
		if (newSpeed >= CONFIG.VIDEO.MIN_SPEED && newSpeed <= CONFIG.VIDEO.MAX_SPEED) {
			await this.state.setVideoSpeed(newSpeed);
			await chrome.storage.local.set({
				[CONFIG.STORAGE_KEYS.VIDEO_SPEED]: newSpeed
			});
			//await this.injectSpeedHandler();
			//this.state.updateSpeedDisplay();
		}
	}

	//async injectSpeedHandler() {
	//	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	//	await chrome.scripting.executeScript({
	//		target: { tabId: tab.id },
	//		function: (speed) => {
	//			const video = document.querySelector("video");
	//			if (video) {
	//				video.playbackRate = speed;
	//
	//				const observer = new MutationObserver((mutations) => {
	//					const videos = document.querySelectorAll('video');
	//					videos.forEach(v => v.playbackRate = speed);
	//				});
	//
	//				// Start observing only if not already observing
	//				if (!video.dataset.speedObserver) {
	//					observer.observe(document.body, {
	//						childList: true,
	//						subtree: true
	//					});
	//					video.dataset.speedObserver = 'true';
	//				}
	//			}
	//		},
	//		args: [this.state.getVideoSpeed()]
	//	});
	//}
}
