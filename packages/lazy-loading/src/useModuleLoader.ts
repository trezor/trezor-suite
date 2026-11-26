import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { useFreshRef } from '@trezor/react-utils';

type ModuleLoader = () => Promise<unknown>;

export type UseModuleLoaderOptions<TPayload, TKey> = {
    /** The key a payload loads under, so `preload` can run from a key the caller already has. */
    toKey: (payload: TPayload) => TKey;
    /** `undefined` where there is nothing to fetch, which keeps that payload synchronous. */
    getLoader: (key: TKey) => ModuleLoader | undefined;
    onLoaded: (payload: TPayload) => void;
    onError: (error: unknown, payload: TPayload) => void;
    retries?: number;
};

/**
 * Runs an action once its module has arrived, so the control that triggered it can report a
 * loading state. A mutation, not a query: a query would prefetch on mount of every control.
 *
 * A failure reaches `onError` rather than a `lazy()` boundary, which caches a rejection for the
 * component's lifetime and would need a reload to recover; here the next attempt can succeed.
 */
export const useModuleLoader = <TPayload, TKey>({
    toKey,
    getLoader,
    onLoaded,
    onError,
    /** A chunk lost to a flaky connection is worth retrying before giving up. */
    retries = 2,
}: UseModuleLoaderOptions<TPayload, TKey>) => {
    /** Through a ref so `load` and `preload` keep one identity: callers pass handlers inline. */
    const options = useFreshRef({ toKey, getLoader, onLoaded, onError });

    const { mutate, isPending } = useMutation({
        /** The module is not kept: a `lazy()` boundary re-imports it from the bundler's cache. */
        mutationFn: async (payload: TPayload) => {
            await options.current.getLoader(options.current.toKey(payload))?.();
        },
        retry: retries,
    });

    const load = useCallback(
        (payload: TPayload) => {
            /** Nothing to fetch, so run in this very commit rather than a tick later. */
            if (!options.current.getLoader(options.current.toKey(payload))) {
                options.current.onLoaded(payload);

                return;
            }

            /**
             * On `mutate()` rather than the mutation, so react-query drops them when the caller
             * unmounts mid-flight. The catch: a control that unmounts on its own click, as a
             * menu item does, never reaches them and needs its action to live outside this hook.
             */
            mutate(payload, {
                onSuccess: () => options.current.onLoaded(payload),
                onError: error => options.current.onError(error, payload),
            });
        },
        [mutate, options],
    );

    /**
     * Fetches a module before the interaction that needs it. A failed preload is silent: the
     * bundler drops the chunk, so the interaction asks again and `load` owns the retry and report.
     */
    const preload = useCallback(
        (key: TKey) => {
            options.current
                .getLoader(key)?.()
                .catch(() => undefined);
        },
        [options],
    );

    return { load, preload, isLoading: isPending };
};
