import { type InterceptorContext } from './interceptorTypes';

const requestTimeoutLimit = 1000 * 30;

type MonitorFetchParams<T extends { status: number }> = {
    context: InterceptorContext;
    host: string;
    identity?: string;
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
            // undici wraps connection failures in a generic error and exposes the underlying cause
            // on the `cause` field, so we inspect both. A SocksClientError thrown by the 'socks'
            // package carries an `options` field, while socket resets surface as 'ECONNRESET'; both
            // indicate a misbehaving Tor circuit.
            const cause = 'cause' in error ? (error.cause as unknown) : undefined;

            const isCircuitMisbehaving = [error, cause].some(
                candidate =>
                    typeof candidate === 'object' &&
                    candidate !== null &&
                    (('code' in candidate && candidate.code === 'ECONNRESET') ||
                        'options' in candidate),
            );

            if (isCircuitMisbehaving) {
                context.handler({
                    type: 'CIRCUIT_MISBEHAVING',
                    identity: identity?.split(':')[0],
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
