import { shouldCompress } from 'utils/codec'
import { isBlockedUrl, isWebUrl, schemeOf } from 'utils/link-policy'

export const LINK_ORIGIN = 'https://linkopen.app'

// Builds the shareable https link for an app link. One place for the rules in
// utils/link-policy: website links always get the confirmation page (type '0'),
// and links without a scheme or with a script-running one are refused. The URL
// is encoded exactly as given (no trimming), so callers that want trimming do
// it themselves.
//
// Picks the compressed /s/ path or the legacy /<type>/<encoded> path,
// whichever is shorter.
export function makeLink(url, { auto = true } = {}) {
    if (typeof url !== 'string' || url.trim() === '') {
        throw new Error('URL is empty')
    }
    if (!schemeOf(url)) {
        throw new Error('URL must start with a scheme, like obsidian:')
    }
    if (isBlockedUrl(url)) {
        throw new Error(`${schemeOf(url)}: links are not allowed`)
    }

    const type = auto && !isWebUrl(url) ? '1' : '0'
    const result = shouldCompress(url, type)
    const path = result.useCompression ? `s/${result.compressed}` : result.legacy
    return `${LINK_ORIGIN}/${path}`
}
