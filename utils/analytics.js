// Shared-link pages (/s/…, /0/…, /1/…) have someone's URL in their address.
// Analytics never get that address: Google Analytics doesn't load there, and
// Vercel Analytics gets a fixed route plus the path with the link replaced by
// the app it opens.

export const SHARED_LINK_PATH = /^\/(s|0|1)\//

export function isSharedLinkPath(pathname) {
    return SHARED_LINK_PATH.test(pathname || '')
}

// The route and path Vercel Analytics gets on a shared-link page, or null on
// any other page. Left alone, it works the route out by finding the page's
// params in the address, and when that fails (legacy links arrive
// half-decoded, odd links 404) it sends the raw address as the route. The
// path is what it builds the page URL from before beforeSend runs.
export function sharedLinkPageview(pathname) {
    const match = (pathname || '').match(SHARED_LINK_PATH)
    if (!match) return null
    if (match[1] === 's') return { route: '/s/[data]', path: '/s/[data]' }
    return { route: '/[type]/[url]', path: `/${match[1]}/[url]` }
}

// https://linkopen.app/s/<payload> → https://linkopen.app/s/obsidian
export function redactSharedLinkUrl(url, scheme) {
    const parsed = new URL(url)
    const match = parsed.pathname.match(SHARED_LINK_PATH)
    if (!match) return url
    const label = /^[a-z][a-z0-9+.-]*$/i.test(scheme || '') ? scheme.toLowerCase() : 'unknown'
    return `${parsed.origin}/${match[1]}/${label}`
}
