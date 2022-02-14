let enabled = true

chrome.runtime.onConnect.addListener(port => {
	if (port.name === 'auto-b64d-content') {
		port.postMessage({ content: 'connected', value: enabled })
	} else if (port.name === 'auto-b64d-popup') {
		port.onMessage.addListener(msg => {
			if (msg.content === 'enabledUpdated') {
				enabled = msg.value
			}
		})
	}
})
chrome.tabs.onActivated.addListener(async info => {
	chrome.tabs.sendMessage(info.tabId, { content: 'enabledUpdated', value: enabled })
})
