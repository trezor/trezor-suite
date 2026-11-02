import { isHttps, safeParseUrl } from '@trezor/utils';

type IsNavigationAllowedParams = {
    url: string;
    isTopFrame?: boolean;
    /** The url of the main frame's document, which iOS reports with every request. */
    mainDocumentURL?: string;
    allowedOrigins: string[];
};

// What a subframe may load: the web, and the content a page builds for itself. Every scheme that
// hands a request to another app — `tel:`, `sms:`, `intent:`, Suite's own deep link — is refused
// in a subframe as in the main frame.
const SUBFRAME_ALLOWED_PROTOCOLS = ['https:', 'about:', 'blob:', 'data:'];

/**
 * Whether the embedded page may load `url`. As on desktop, only the main frame is held to the
 * allowlist: the https origin the page was opened with and the origins its catalog entry declares.
 * Every other scheme is refused with it (`tel:`, `intent:`, another app's or Suite's own deep
 * link). A subframe may load any https page and the `about:`, `blob:` and `data:` content a page
 * builds for itself, and is refused every other scheme too. Android asks only about top-level
 * http(s) navigations and custom-scheme requests from any frame, and names no frame, so a request
 * without `isTopFrame` counts as a main-frame one. So does a subframe request without
 * `mainDocumentURL`: iOS tells a subframe by its url differing from the main document's, so a
 * request with no main document to differ from has not been shown to come from a subframe.
 */
export const isNavigationAllowed = ({
    url,
    isTopFrame,
    mainDocumentURL,
    allowedOrigins,
}: IsNavigationAllowedParams) => {
    const parsedUrl = safeParseUrl(url);

    if (isTopFrame === false && mainDocumentURL !== undefined) {
        return parsedUrl !== null && SUBFRAME_ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
    }

    return isHttps(url) && parsedUrl !== null && allowedOrigins.includes(parsedUrl.origin);
};
