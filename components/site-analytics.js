'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { Analytics } from '@vercel/analytics/next'
import { redactSharedLinkUrl, sharedLinkPageview } from 'utils/analytics'

const GA_ID = 'G-CG6KC5KZLG'

// See utils/analytics.js: shared-link pages never send their address.
// beforeSend only sees the URL; the route is sent as it is.
function beforeSend(event) {
    const scheme = document.querySelector('[data-link-scheme]')?.dataset.linkScheme
    return { ...event, url: redactSharedLinkUrl(event.url, scheme) }
}

export default function SiteAnalytics() {
    // On shared-link pages, a fixed route and path replace the ones <Analytics>
    // works out from the address (our props win over its own). Other pages
    // pass nothing, so they keep their real route.
    const sharedLink = sharedLinkPageview(usePathname())

    return (
        <>
            <Analytics beforeSend={beforeSend} {...sharedLink} />
            {!sharedLink && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_ID}');
                        `}
                    </Script>
                </>
            )}
        </>
    )
}
