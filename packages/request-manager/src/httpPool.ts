import http from 'http';
import { InterceptorOptions } from './types';

export const createRequestPool = (interceptorOptions: InterceptorOptions) => {
    const requestTimeoutLimit = 1000 * 30;

    return (request: http.ClientRequest) => {
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
            interceptorOptions.handler({
                type: 'ERROR',
                error,
            });
        });

        return request;
    };
};
