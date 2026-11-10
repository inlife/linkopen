import { describe, it, expect, vi } from 'vitest'
import { Analytics } from '@vercel/analytics/next'
import { isSharedLinkPath, redactSharedLinkUrl, sharedLinkPageview } from './analytics'

// Addresses shaped like the ones that reached Vercel Analytics as routes
const SHARED_PAGES = [
    ['/s/1kAHFkJ4KQEw', { data: '1kAHFkJ4KQEw' }],
    ['/1/spotify:track:4cOdK2wGLETKBW3PvgPWqT', { type: '1', url: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT' }],
    ['/1/runshortcut%3A%2F%2Frun%3Fname%3DMorning', { type: '1', url: 'runshortcut://run?name=Morning' }],
    ['/1/altstore:/install', {}],
    ['/1/mnoperator-peng:/show/7d0f3c1e-0000-4000-8000-000000000000/notes', {}],
    ['/0/shortcuts%3A%2F%2Frun-shortcut%3Fname%3DAdd%26input%3Dtext%26text%3DBuy%20milk', { type: '0', url: 'shortcuts://run-shortcut?name=Add&input=text&text=Buy milk' }],
]

describe('isSharedLinkPath', () => {
    it('matches shared-link pages only', () => {
        expect(isSharedLinkPath('/s/1kAHFkJ4KQEw')).toBe(true)
        expect(isSharedLinkPath('/0/slack%3A%2F%2Fopen')).toBe(true)
        expect(isSharedLinkPath('/1/slack%3A%2F%2Fopen')).toBe(true)
        expect(isSharedLinkPath('/')).toBe(false)
        expect(isSharedLinkPath('/tools/deep-link-builder')).toBe(false)
        expect(isSharedLinkPath('/sitemap.xml')).toBe(false)
        expect(isSharedLinkPath(undefined)).toBe(false)
    })
})

describe('redactSharedLinkUrl', () => {
    it('replaces the link with its scheme', () => {
        expect(redactSharedLinkUrl('https://linkopen.app/s/1kAHFkJ4KQEw?x=1#y', 'obsidian')).toBe('https://linkopen.app/s/obsidian')
        expect(redactSharedLinkUrl('https://linkopen.app/1/things%3A%2F%2F%2Fadd', 'Things')).toBe('https://linkopen.app/1/things')
    })

    it('never passes anything but a scheme-shaped label', () => {
        expect(redactSharedLinkUrl('https://linkopen.app/0/x', 'a b/c')).toBe('https://linkopen.app/0/unknown')
        expect(redactSharedLinkUrl('https://linkopen.app/s/x', undefined)).toBe('https://linkopen.app/s/unknown')
    })

    it('leaves other pages alone', () => {
        expect(redactSharedLinkUrl('https://linkopen.app/tools?ref=hn', 'x')).toBe('https://linkopen.app/tools?ref=hn')
    })
})

describe('sharedLinkPageview', () => {
    it('gives shared-link pages a fixed route and path', () => {
        expect(sharedLinkPageview('/s/1kAHFkJ4KQEw')).toEqual({ route: '/s/[data]', path: '/s/[data]' })
        expect(sharedLinkPageview('/0/slack%3A%2F%2Fopen')).toEqual({ route: '/[type]/[url]', path: '/0/[url]' })
        expect(sharedLinkPageview('/1/altstore:/install')).toEqual({ route: '/[type]/[url]', path: '/1/[url]' })
    })

    it('leaves other pages alone', () => {
        expect(sharedLinkPageview('/')).toBe(null)
        expect(sharedLinkPageview('/tools/deep-link-builder')).toBe(null)
        expect(sharedLinkPageview(undefined)).toBe(null)
    })

    it('keeps the path redactable to the app the link opens', () => {
        const { path } = sharedLinkPageview('/1/spotify:track:4cOdK2wGLETKBW3PvgPWqT')
        expect(redactSharedLinkUrl(`https://linkopen.app${path}`, 'spotify')).toBe('https://linkopen.app/1/spotify')
    })
})

// What <Analytics> from @vercel/analytics/next tracks, given what Next.js
// reports for the page. It wraps itself in <Suspense>, works out the route
// from the params, and renders its tracker with that route and path, which
// the props we pass override. vitest.config.js inlines the package so this
// mock reaches it.
let page = {}
vi.mock('next/navigation.js', () => ({
    usePathname: () => page.pathname,
    useParams: () => page.params,
    useSearchParams: () => new URLSearchParams(),
}))

function trackedPageview(pathname, params) {
    page = { pathname, params }
    // Same props as components/site-analytics.js passes
    const inner = Analytics({ beforeSend: e => e, ...sharedLinkPageview(pathname) }).props.children
    const { route, path } = inner.type(inner.props).props
    return { route, path }
}

describe('Vercel Analytics pageview', () => {
    it.each(SHARED_PAGES)('carries no part of the link on %s', (pathname, params) => {
        const sent = trackedPageview(pathname, params)
        const link = pathname.split('/').slice(2).join('/')
        expect(sent).toEqual(sharedLinkPageview(pathname))
        expect(sent.route).not.toContain(link)
        expect(sent.path).not.toContain(link)
    })

    it('keeps the real route on other pages', () => {
        expect(trackedPageview('/tools/deep-link-builder', {})).toEqual({ route: '/tools/deep-link-builder', path: '/tools/deep-link-builder' })
        expect(trackedPageview('/', {})).toEqual({ route: '/', path: '/' })
    })
})
