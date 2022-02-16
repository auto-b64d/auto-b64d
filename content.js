const pageType =
	/arca\.live/.test(location.href)
	 ? 'arcaLive'
	 : /youtu.*G30Zb1uX5sk/.test(location.href)
	  ? 'yt'
	  : 'unknown'
const tagMaker = {
	arcaLive: link => `<a href='${link}'>${link}</a>`,
	yt: link => `<a class='yt-simple-endpoint yt-formatted-string' spellcheck='false' href='${link}'>${link}</a>`,
}

const replaceAllB64 = str => str.replace(
	/(?<!\.)\baHR0c[a-zA-Z0-9+/]*={0,2}/g,
	matched => {
		try {
			const link = atob(matched)
			return tagMaker[pageType](link)
		} catch {
			return matched
		}
	}
)
const replaceAllB64In = element => {
	element.innerHTML = replaceAllB64(element.innerHTML)
}
if (pageType === 'yt') {
	const findElement = (target, checker) =>
		new Promise(resolve => {
			const observer = new MutationObserver(mutations => {
				const filtered = mutations.filter(mutation => mutation.addedNodes.length !== 0)
				if (filtered.length === 0) return
				const found = filtered.find(checker)
				if (found === undefined) return
				observer.disconnect()
				resolve(found)
			})
			observer.observe(target, { childList: true, subtree: true })
		})
	;(async () => {
		const { target: comments } = await findElement(document.body, mutation => mutation.target.id === 'contents')
		new MutationObserver(mutations => {
			const observeOptions = { childList: true, subtree: true }
			for (const mutation of mutations) {
				for (const comment of [ ...mutation.addedNodes ].filter(node => node.nodeName === 'YTD-COMMENT-THREAD-RENDERER')) {
					const content = comment.querySelector('#content-text')
					replaceAllB64In(content)
					const contentObserver = new MutationObserver(mutations => {
						for (const mutation of mutations) {
							contentObserver.disconnect()
							mutation.target.innerHTML = replaceAllB64([ ...mutation.addedNodes ].filter(node => (node.innerHTML ?? node.data) !== '\n').map(node => node.outerHTML ?? node.data).join('\n'))
							contentObserver.observe(content, observeOptions)
						}
					})
					contentObserver.observe(content, observeOptions)
				}
			}
		}).observe(comments, { childList: true })
	})()
} else if (pageType === 'arcaLive') {
	replaceAllB64In(document.querySelector('.article-content'))
	replaceAllB64In(document.getElementById('comment').children[1])
}
