// Rules for where a shared link may send people.
//
// Links to websites (http/https) never auto-redirect: LinkOpen exists for
// app links, and an auto-forwarding https shortener is exactly what phishing
// campaigns look for. Those always get a confirmation page instead.

const BLOCKED_SCHEMES = ['javascript', 'data', 'vbscript']

// Read the scheme the way browsers do: they ignore control characters and spaces
// at either end and drop tabs and newlines anywhere. trim() differs both ways,
// which let "\x01javascript:" past the block list.
export function schemeOf(url) {
    if (!url) return ''
    const cleaned = url.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '').replace(/[\t\n\r]/g, '')
    const match = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):/)
    return match ? match[1].toLowerCase() : ''
}

export function isWebUrl(url) {
    const scheme = schemeOf(url)
    return scheme === 'http' || scheme === 'https'
}

export function isBlockedUrl(url) {
    return BLOCKED_SCHEMES.includes(schemeOf(url))
}

// A shared link has to name an app or a website. Without a scheme the browser
// reads the target as a path on linkopen.app: /1/spotify reloads itself forever,
// and /1/%2F%2Fexample.com would forward straight to a website.
export function isOpenableUrl(url) {
    return schemeOf(url) !== '' && !isBlockedUrl(url)
}
