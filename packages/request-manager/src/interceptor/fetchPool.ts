import { type InterceptorContext } from './interceptorTypes';
import { isTorCircuitError } from './torError';

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
            // `isTorCircuitError` recognises the failure shapes of both transports (undici's
            // UND_ERR_SOCKET / UND_ERR_SOCKS5_* as well as the legacy socks ECONNRESET / `options`),
            // so a misbehaving circuit reached over `fetch`/undici still triggers the global
            // circuit-reset recovery (CIRCUIT_MISBEHAVING -> reset-tor-circuits -> closeActiveCircuits).
            if (isTorCircuitError(error)) {
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
