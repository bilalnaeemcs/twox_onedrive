// let init_start = 1;

// import speedupVar from './speedupVar';

var speedupVar = 1;

function updateSpeed() {
    document.getElementById("current-speed").textContent = speedupVar + "x";
}

const increaseButton = document.getElementById("increase-speed-btn");
increaseButton.addEventListener("click", async () => {
    speedupVar = speedupVar + 0.25;
    chrome.tabs.executeScript({
		code: 'document.querySelector("video").playbackRate = ' + speedupVar + '; console.log("increased playback speed to " + ' + speedupVar + ' + "x");'
	});
    updateSpeed();
});


const decreaseButton = document.getElementById("decrease-speed-btn");
decreaseButton.addEventListener("click", async () => {
    speedupVar = speedupVar - 0.25;
    chrome.tabs.executeScript({
		code: 'document.querySelector("video").playbackRate = ' + speedupVar + '; console.log("increased playback speed to " + ' + speedupVar + ' + "x");'
	});
    updateSpeed();
});