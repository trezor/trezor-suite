import type http from 'http';

import { isWhitelistedHost } from '@trezor/utils';

import { type InterceptorContext } from './interceptorTypes';
import { isHeaderObject, overloadHttpRequest } from './overloadHttpRequest';

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
    // @trezor/blockchain-link is adding an SocksProxyAgent to each connection
    // related to https://github.com/trezor/trezor-suite/issues/7689
    // this condition should be removed once suite will stop using TrezorConnect.updateConnectSettings
    if (
        typeof url === 'object' &&
        isWhitelistedHost(url.host, context.notRequiredTorDomainsList) &&
        'agent' in url
    ) {
        delete url.agent;
    }

    if (
        typeof url === 'object' &&
        !isWhitelistedHost(url.host, context.notRequiredTorDomainsList) && // difference between overloadHttpRequest
        'headers' in url &&
        isHeaderObject(url.headers) && // since @types/node 24 headers may also be a raw array form
        url.headers.Upgrade === 'websocket'
    ) {
        return overloadHttpRequest({ context, protocol, url, options, callback, validateRequest });
    }
};
