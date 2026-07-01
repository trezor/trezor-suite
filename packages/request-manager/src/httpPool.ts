import type http from 'http';

import { isCircuitMisbehaving } from './isCircuitMisbehaving';
import { type InterceptorOptions } from './types';

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
            if (isCircuitMisbehaving(error)) {
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
