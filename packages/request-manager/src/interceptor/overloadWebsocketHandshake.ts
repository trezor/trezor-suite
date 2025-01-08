import http from 'http';

import { InterceptorContext, isWhitelistedHost } from './interceptorTypesAndUtils';
import { overloadHttpRequest } from './overloadHttpRequest';

export const overloadWebsocketHandshake = (
    context: InterceptorContext,
    protocol: 'http' | 'https',
    url: string | URL | http.RequestOptions,
    options?: http.RequestOptions | ((r: http.IncomingMessage) => void),
    callback?: unknown,
) => {
    // @trezor/blockchain-link is adding an SocksProxyAgent to each connection
    // related to https://github.com/trezor/trezor-suite/issues/7689
    // this condition should be removed once suite will stop using TrezorConnect.setProxy
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
        url.headers?.Upgrade === 'websocket'
    ) {
        return overloadHttpRequest(context, protocol, url, options, callback);
    }
};
