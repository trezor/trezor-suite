import http from 'http';
import { InterceptorOptions } from './types';

export const createRequestPool = (interceptorOptions: InterceptorOptions) => {
    const requestTimeoutLimit = 1000 * 30;

    return (request: http.ClientRequest, identity?: string) => {
        const { host } = request;
        const requestTime = Date.now();

        request.on('response', response => {
            const timeRequestTook = Date.now() - requestTime;
            const { statusCode } = response;

            const isNetworkMisbehaving = timeRequestTook > requestTimeoutLimit;
            if (isNetworkMisbehaving) {
                interceptorOptions.handler({
                    type: 'NETWORK_MISBEHAVING',
                });
            }
            interceptorOptions.handler({
                type: 'INTERCEPTED_RESPONSE',
                host,
                time: timeRequestTook,
                statusCode,
            });
        });

        request.on('error', (error: Error) => {
            // catch network errors from:
            // - nodejs http module (using error.code field) examples: "socket hang up" or "socket disconnected before secure TLS connection was established"
            //   see ./node_modules/@types/node/*/http.d.ts
            // - SocksClientError (using error.options field) thrown by 'socks' package (dependency of socks-proxy-agent)
            //   see https://github.com/JoshGlazebrook/socks/blob/76d013e4c9a2d956f07868477d8f12ec0b96edfc/src/common/util.ts
            //   see https://github.com/JoshGlazebrook/socks/blob/76d013e4c9a2d956f07868477d8f12ec0b96edfc/src/common/constants.ts
            if (('code' in error && error.code === 'ECONNRESET') || 'options' in error) {
                interceptorOptions.handler({
                    type: 'CIRCUIT_MISBEHAVING',
                    identity: identity?.split(':')[0],
                });
            } else {
                interceptorOptions.handler({
                    type: 'ERROR',
                    error,
                });
            }
        });

        return request;
    };
};
