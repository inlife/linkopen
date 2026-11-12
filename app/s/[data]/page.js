import RedirectView from 'components/redirect-view'
import { decode } from 'utils/codec'
import { isOpenableUrl } from 'utils/link-policy'

export default async function CompressedProxyPage({ params }) {
    const { data } = await params

    let target = null
    try {
        target = decode(decodeURIComponent(data))
    } catch {
        // falls through to the invalid view
    }

    if (!target || !isOpenableUrl(target.url)) return <RedirectView invalid />
    return <RedirectView url={target.url} type={target.type} />
}
