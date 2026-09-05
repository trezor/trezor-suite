import { Iframe } from '@trezor/components';

import { type UseEmbeddedAppIframeParams } from '../hooks/useEmbeddedAppIframe';
import { useParseIframeProps } from './hooks/useParseIframeProps';
import { type UnknownIframeProps } from './schemas';

export type EmbeddedAppIframeProps = {
    /**
     * The URL of the embedded document. Must be served over HTTPS to avoid mixed-content issues.
     */
    src: UnknownIframeProps['src'];

    /**
     * `document.title` of the embedded document.
     */
    title: string;

    /**
     * Allows you to opening specific URL via `window.open(url, hrefTag)` / `<a target={hrefTag}>`.
     */
    hrefTag?: string;

    /**
     * (Doesn't has to has a stable reference.)
     */
    onEvent: UseEmbeddedAppIframeParams['onEvent'];

    /**
     * Permission policy for the iframe:
     * __It inherits the top document's permission policy and further restricts it.__
     * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#allow
     */
    allow?: string;

    /**
     * Restrict features within the iframe by allowing only a minimal subset of capabilities.
     * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox
     */
    sandbox?: UnknownIframeProps['sandbox'];

    /**
     * Omit sharing Suite URL as `document.referrer` for any cross-origin requests.
     * And allow it only when origin (including protocol) matches Suite's origin.
     */
    referrerPolicy?: UnknownIframeProps['referrerPolicy'];

    /**
     * Wait for loading the iframe until it is visible in the viewport.
     */
    lazy?: boolean;

    onLoad?: () => void;
    onError?: () => void;
    ref?: React.Ref<HTMLIFrameElement>;
};

export const EmbeddedAppIframe = ({
    onLoad,
    onError,
    ref,
    src,
    title,
    allow,
    sandbox,
    referrerPolicy,
    lazy = false,
    hrefTag,
}: EmbeddedAppIframeProps) => {
    const parsedProps = useParseIframeProps({ src, sandbox, referrerPolicy });

    if (!parsedProps) return null;

    return (
        <Iframe
            // Remount on target change so a stale document never survives a selection.
            key={src}
            ref={ref}
            name={hrefTag}
            src={parsedProps?.src.toString()}
            title={title}
            allow={allow}
            sandbox={parsedProps?.sandbox}
            // Some providers reject requests carrying a foreign Referer outright.
            referrerPolicy={parsedProps?.referrerPolicy}
            onLoad={onLoad}
            onError={onError}
            loading={lazy ? 'lazy' : 'eager'}
        />
    );
};
