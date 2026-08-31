import type http from 'http';

import { isWhitelistedHost } from '@trezor/utils';

import { type InterceptorContext } from './interceptorTypes';
import { overloadHttpRequest } from './overloadHttpRequest';

type OverloadWebsocketHandshakeParams = {
    context: InterceptorContext;
    protocol: 'http' | 'https';
    url: string | URL | http.RequestOptions;
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void);
    callback?: unknown;
    validateRequest: (params: { hostname: string }) => void;
};

export const overloadWebsocketHandshake = ({
    context,
    protocol,
    url,
    options,
    callback,
    validateRequest,
}: OverloadWebsocketHandshakeParams) => {
    if (
        typeof url === 'object' &&
        !isWhitelistedHost(url.host, context.notRequiredTorDomainsList) && // difference between overloadHttpRequest
        'headers' in url &&
        url.headers?.Upgrade === 'websocket'
    ) {
        return overloadHttpRequest({ context, protocol, url, options, callback, validateRequest });
    }
};
