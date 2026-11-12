import { describe, it, expect } from 'vitest'
import { schemeOf, isWebUrl, isBlockedUrl, isOpenableUrl } from './link-policy'

describe('schemeOf', () => {
    it('returns the lowercased scheme', () => {
        expect(schemeOf('obsidian://open?vault=Notes')).toBe('obsidian')
        expect(schemeOf('  Slack://channel?team=T1&id=C1')).toBe('slack')
        expect(schemeOf('spotify:track:6rqhFgbbKwnb9MLmUQDhG6')).toBe('spotify')
    })

    it('returns empty string when there is no scheme', () => {
        expect(schemeOf('')).toBe('')
        expect(schemeOf('not a url')).toBe('')
        expect(schemeOf('://missing')).toBe('')
    })

    it('reads the scheme the way browsers do', () => {
        expect(schemeOf('\x01javascript:alert(1)')).toBe('javascript')
        expect(schemeOf('java\tscript:alert(1)')).toBe('javascript')
        expect(schemeOf(' spotify:abc')).toBe('')
    })
})

describe('isWebUrl', () => {
    it('is true for http and https in any case', () => {
        expect(isWebUrl('https://example.com')).toBe(true)
        expect(isWebUrl('HTTP://example.com')).toBe(true)
    })

    it('is false for app schemes', () => {
        expect(isWebUrl('obsidian://open?vault=Notes')).toBe(false)
        expect(isWebUrl('httpsx://example.com')).toBe(false)
    })
})

describe('isBlockedUrl', () => {
    it('blocks script-running schemes', () => {
        expect(isBlockedUrl('javascript:alert(1)')).toBe(true)
        expect(isBlockedUrl(' JavaScript:alert(1)')).toBe(true)
        expect(isBlockedUrl('data:text/html,<b>hi</b>')).toBe(true)
        expect(isBlockedUrl('vbscript:msgbox')).toBe(true)
        expect(isBlockedUrl('\x01javascript:alert(1)')).toBe(true)
        expect(isBlockedUrl('java\nscript:alert(1)')).toBe(true)
    })

    it('allows app and web schemes', () => {
        expect(isBlockedUrl('slack://open')).toBe(false)
        expect(isBlockedUrl('https://example.com')).toBe(false)
    })
})

describe('isOpenableUrl', () => {
    it('allows links that name an app or a website', () => {
        expect(isOpenableUrl('spotify:track:6rqhFgbbKwnb9MLmUQDhG6')).toBe(true)
        expect(isOpenableUrl('obsidian://open?vault=Notes')).toBe(true)
        expect(isOpenableUrl('https://example.com')).toBe(true)
    })

    it('refuses targets without a scheme, which the browser would read as a path', () => {
        expect(isOpenableUrl('spotify')).toBe(false)
        expect(isOpenableUrl('www.example.com')).toBe(false)
        expect(isOpenableUrl('//example.com')).toBe(false)
        expect(isOpenableUrl('/about')).toBe(false)
        expect(isOpenableUrl(' spotify:abc')).toBe(false)
        expect(isOpenableUrl('')).toBe(false)
    })

    it('refuses blocked schemes', () => {
        expect(isOpenableUrl('javascript:alert(1)')).toBe(false)
    })
})
