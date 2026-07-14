import type http from 'http';

import { CircuitMisbehavingError, isCircuitMisbehaving } from './isCircuitMisbehaving';
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

        // Override `emit` so that when an 'error' event fires, all listeners
        // (including consumer ones) receive a typed CircuitMisbehavingError
        // instead of the raw network error.
        const originalEmit = request.emit.bind(request);
        request.emit = (event: string, ...args: unknown[]) => {
            if (event === 'error' && isCircuitMisbehaving(args[0])) {
                interceptorOptions.handler({
                    type: 'CIRCUIT_MISBEHAVING',
                    identity: identity?.split(':')[0],
                });

                return originalEmit(
                    'error',
                    new CircuitMisbehavingError(
                        {
                            host: host ?? 'unknown',
                            identity: identity?.split(':')[0],
                            method: 'http',
                        },
                        args[0],
                    ),
                );
            }

            if (event === 'error') {
                interceptorOptions.handler({
                    type: 'ERROR',
                    error: args[0] as Error,
                });
            }

            return originalEmit(event, ...args);
        };

        return request;
    };
};
