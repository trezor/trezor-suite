import { isCircuitMisbehaving } from '../isCircuitMisbehaving';
import { type InterceptorContext } from './interceptorTypes';

const requestTimeoutLimit = 1000 * 30;

type MonitorFetchParams<T extends { status: number }> = {
    context: InterceptorContext;
    host: string;
    identity: string;
    request: Promise<T>;
};

// Reports timing and error events for a fetch routed through undici. This mirrors the monitoring
// that `httpPool` attaches to `http.ClientRequest`, which undici does not go through.
export const monitorFetch = <T extends { status: number }>({
    context,
    host,
    identity,
    request,
}: MonitorFetchParams<T>): Promise<T> => {
    const requestTime = Date.now();

    return request.then(
        response => {
            const timeRequestTook = Date.now() - requestTime;

            const isNetworkMisbehaving = timeRequestTook > requestTimeoutLimit;
            if (isNetworkMisbehaving) {
                context.handler({
                    type: 'NETWORK_MISBEHAVING',
                });
            }

            context.handler({
                type: 'INTERCEPTED_RESPONSE',
                host,
                time: timeRequestTook,
                statusCode: response.status,
            });

            return response;
        },
        (error: Error) => {
            if (isCircuitMisbehaving(error)) {
                const [username] = identity.split(':');
                context.handler({
                    type: 'CIRCUIT_MISBEHAVING',
                    identity: username,
                });
            } else {
                context.handler({
                    type: 'ERROR',
                    error,
                });
            }

            throw error;
        },
    );
};
