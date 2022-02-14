const enabledCheckbox = document.getElementById('enabled')

const isEnabled = () => enabledCheckbox.checked

const myPort = chrome.runtime.connect({ name: 'auto-b64d-popup' })

chrome.storage.local.get('enabled', ({ enabled }) => {
	if (enabled !== undefined) {
		enabledCheckbox.checked = enabled
		myPort.postMessage({ content: 'enabledUpdated', value: enabled })
	}
})

enabledCheckbox.addEventListener('input', async () => {
	const enabled = isEnabled()
	await chrome.storage.local.set({ enabled })
	const msg = { content: 'enabledUpdated', value: enabled }
	myPort.postMessage(msg)
	const [ currTab ] = await chrome.tabs.query({ currentWindow: true, active: true })
	chrome.tabs.sendMessage(currTab.id, msg)
})
