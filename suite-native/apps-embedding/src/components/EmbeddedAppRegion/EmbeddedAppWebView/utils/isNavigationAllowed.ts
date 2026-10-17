import { isHttps, safeParseUrl } from '@trezor/utils';

type IsNavigationAllowedParams = {
    url: string;
    isTopFrame?: boolean;
    allowedOrigin: string;
};

/**
 * Whether the embedded page may load `url`. As on desktop, only the main frame is held to the
 * https origin the page was opened with, so every other scheme is refused as well (`tel:`,
 * `intent:`, another app's or Suite's own deep link). Android does not tell frames apart, so a
 * request without `isTopFrame` counts as a main-frame one.
 */
export const isNavigationAllowed = ({
    url,
    isTopFrame,
    allowedOrigin,
}: IsNavigationAllowedParams) =>
    isTopFrame === false || (isHttps(url) && safeParseUrl(url)?.origin === allowedOrigin);
