import { describe, it, expect, vi } from 'vitest'
import SiteAnalytics from './site-analytics'

// Made-up addresses shaped like the ones that reached Vercel Analytics as routes,
// with the params Next.js reports for each
const SHARED_PAGES = [
    ['/s/1kAHFkJ4KQEw', { data: '1kAHFkJ4KQEw' }],
    ['/1/spotify:track:0000000000000000000000', { type: '1', url: 'spotify:track:0000000000000000000000' }],
    ['/1/runshortcut%3A%2F%2Frun%3Fname%3DMorning', { type: '1', url: 'runshortcut://run?name=Morning' }],
    ['/1/altstore:/install', {}],
    ['/1/exampleapp:/show/00000000-0000-4000-8000-000000000000/notes', {}],
    ['/0/shortcuts%3A%2F%2Frun-shortcut%3Fname%3DAdd%26input%3Dtext%26text%3DBuy%20milk', { type: '0', url: 'shortcuts://run-shortcut?name=Add&input=text&text=Buy milk' }],
]

// Both site-analytics.js and @vercel/analytics read the page from here.
// vitest.config.js inlines @vercel/analytics so this mock reaches it.
let page = {}
vi.mock('next/navigation', () => ({
    usePathname: () => page.pathname,
    useParams: () => page.params,
    useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/script', () => ({ default: () => null }))

// Renders <SiteAnalytics> one level at a time, down to the route and path
// that <Analytics> from @vercel/analytics/next hands its tracker. It wraps
// itself in <Suspense>, then works out the route from the params, and our
// props override that.
function render(pathname, params) {
    page = { pathname, params }
    const [analytics, googleAnalytics] = SiteAnalytics().props.children
    const inner = analytics.type(analytics.props).props.children
    const { route, path } = inner.type(inner.props).props
    return { route, path, googleAnalytics: Boolean(googleAnalytics) }
}

describe('SiteAnalytics', () => {
    it.each(SHARED_PAGES)('sends no part of the link on %s', (pathname, params) => {
        const sent = render(pathname, params)
        const link = pathname.split('/').slice(2).join('/')
        expect(sent.route).toBe(pathname.startsWith('/s/') ? '/s/[data]' : '/[type]/[url]')
        expect(sent.path).toBe(pathname.startsWith('/s/') ? '/s/[data]' : `/${pathname[1]}/[url]`)
        expect(sent.route).not.toContain(link)
        expect(sent.path).not.toContain(link)
        expect(sent.googleAnalytics).toBe(false)
    })

    it('keeps the real route on other pages', () => {
        expect(render('/tools/deep-link-builder', {})).toEqual({ route: '/tools/deep-link-builder', path: '/tools/deep-link-builder', googleAnalytics: true })
        expect(render('/', {})).toEqual({ route: '/', path: '/', googleAnalytics: true })
    })
})
