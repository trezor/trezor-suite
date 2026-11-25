import { promiseRaceWithSignal } from '@trezor/utils';

type SharedRequestOptions = { signal?: AbortSignal };

/**
 * Lets concurrent calls with the same options share one pending request.
 * The shared request runs without a caller's abort signal,
 * so a caller that aborts stops waiting for it without failing the others.
 */
export const shareInFlightRequest = <TOptions extends SharedRequestOptions | undefined, TResult>(
    request: (options: TOptions) => Promise<TResult>,
): ((options: TOptions) => Promise<TResult>) => {
    const pendingRequests = new Map<string, Promise<TResult>>();

    return options => {
        const sharedOptions = { ...options, signal: undefined };
        const requestKey = JSON.stringify(sharedOptions);

        let pendingRequest = pendingRequests.get(requestKey);

        if (pendingRequest === undefined) {
            pendingRequest = request(sharedOptions).finally(() => {
                pendingRequests.delete(requestKey);
            });
            pendingRequests.set(requestKey, pendingRequest);
        }

        return promiseRaceWithSignal(pendingRequest, options?.signal);
    };
};
