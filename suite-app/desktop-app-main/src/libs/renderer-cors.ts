import { safeParseUrl } from '@trezor/utils';

import { RENDERER_ORIGIN, isRendererUrl } from './renderer-protocol';

const ALLOW_ORIGIN_HEADER = 'access-control-allow-origin';
const HTTP_PROTOCOLS = ['http:', 'https:'];

type ResponseHeaders = Record<string, string[]>;

type AllowRendererOriginParams = {
    /** URL of the frame the request came from. */
    frameUrl: string | undefined;
    requestUrl: string;
    responseHeaders: ResponseHeaders | undefined;
};

/**
 * Lets the packaged renderer read the responses to its own requests, preflights included.
 * It used to load from `file://`, which Electron exempts from CORS,
 * so a backend that sends `Access-Control-Allow-Origin` only to a list of web origins
 * (the earn workers, trezord-go) was readable anyway.
 * On the renderer scheme Chromium enforces CORS and blocks such a response.
 * Which hosts the renderer may reach at all stays with modules/request-filter.ts.
 */
export const allowRendererOrigin = ({
    frameUrl,
    requestUrl,
    responseHeaders = {},
}: AllowRendererOriginParams): ResponseHeaders => {
    const requestProtocol = safeParseUrl(requestUrl)?.protocol;
    const isHttpRequest = HTTP_PROTOCOLS.some(protocol => protocol === requestProtocol);
    if (!isRendererUrl(frameUrl) || !isHttpRequest) return responseHeaders;

    const otherHeaders = Object.entries(responseHeaders).filter(
        ([name]) => name.toLowerCase() !== ALLOW_ORIGIN_HEADER,
    );

    return {
        ...Object.fromEntries(otherHeaders),
        'Access-Control-Allow-Origin': [RENDERER_ORIGIN],
    };
};
