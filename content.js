const pageType =
	/arca\.live/.test(location.href)
	 ? 'arcaLive'
	 : /youtu.*G30Zb1uX5sk/.test(location.href)
	  ? 'yt'
	  : 'unknown'
const tagMaker = {
	arcaLive: (matched, link) => `<a href='${link}'><!--${matched}-->${link}</a>`,
	yt: (matched, link) => `<a class='yt-simple-endpoint yt-formatted-string' spellcheck='false' href='${link}'><!--${matched}-->${link}</a>`,
}
let enabled = true
let elementsNeedToUpdate = []

const replaceAllB64In = element => {
	if (!/[A-Z]/.test(element.innerHTML)) return
	element.innerHTML = element.innerHTML.replace(
		base64Regex,
		matched => {
			if (!/[A-Z]/.test(matched)) return matched
			const link = atob(matched)
			if (!/^https?:\/\/\w+(?:\.\w+)+\/.*$/.test(link)) return matched
			return tagMaker[pageType](matched, link)
		}
	)
}
const revertReplacedIn = element => {
	element.innerHTML = element.innerHTML.replace(
		/<a(?: \w+="[^"]+")+><!--(.+(?!->))-->.+<\/a>/g,
		(_, $1) => $1
	)
}
const setElementsNeedToUpdate = () => {
	if (pageType === 'arcaLive') {
		const articleContent = document.querySelector('.article-content')
		elementsNeedToUpdate.push(articleContent)
		const comments = document.getElementById('comment').children[1]
		elementsNeedToUpdate.push(comments)
	} else if (pageType === 'yt') {
		const bodyObserver = new MutationObserver(mutations => {
			const found = mutations.find(mutation => mutation.target.id === 'sections' && mutation.removedNodes.length === 0)
			if (found !== undefined) {
				bodyObserver.disconnect()
				const comments = found.target.querySelector('#contents')
				new MutationObserver(mutations => {
					for (const mutation of mutations.filter(mutation => mutation.addedNodes.length !== 0)) {
						for (const comment of [ ...mutation.addedNodes ].filter(node => node.nodeName === 'YTD-COMMENT-THREAD-RENDERER')) {
							const content = comment.querySelector('#content-text')
							elementsNeedToUpdate.push(content)
							if (enabled) replaceAllB64In(content)
						}
					}
				}).observe(comments, { childList: true })
			}
		})
		bodyObserver.observe(document.body, { childList: true, subtree: true })
	}
}
const updateInPage = () => {
	for (const element of elementsNeedToUpdate) {
		if (enabled) replaceAllB64In(element)
		else revertReplacedIn(element)
	}
}
const myPort = chrome.runtime.connect({ name: 'auto-b64d-content' })

const base64Regex = /(?<!\.)\b[a-zA-Z0-9+/]{20,}={0,2}/g

const testBase64 = str => /[A-Z]/.test(str) && base64Regex.test(str)

chrome.runtime.onMessage.addListener(msg => {
	if (msg.content === 'enabledUpdated') {
		enabled = msg.value
		updateInPage()
	}
})
myPort.onMessage.addListener(msg => {
	if (msg.content === 'connected') {
		setElementsNeedToUpdate()
		enabled = msg.value
		updateInPage()
	}
})
