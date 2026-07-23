import { useEffect, useRef } from 'react';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { useCurrentRef } from '@trezor/react-utils';
import { IMAGE_PROXY_API_AUTH_BEARER, IMAGE_PROXY_API_URL } from '@trezor/urls';

/**
 * Load a remote image using proxy to preserve privacy of our users.
 * Display loadingComponent while the image is being fetched
 * Display fallbackComponent if the image fails to load
 */
export const useProxyImage = (src?: string) => {
    const abortControllersRef = useRef(new Map<string, AbortController>());
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is src; abortControllersRef is a mutable ref used only for abort bookkeeping and must not be part of the key
    const proxyImageQuery = useQuery({
        enabled: Boolean(src),
        queryKey: desktopQueryKeys.proxyImage(src),
        queryFn: async () => {
            const abortController = new AbortController();

            abortControllersRef.current.set(src!, abortController);

            const res = await fetch(`${IMAGE_PROXY_API_URL}?url=${encodeURIComponent(src!)}`, {
                headers: {
                    Authorization: `Bearer ${IMAGE_PROXY_API_AUTH_BEARER}`,
                },
                signal: abortController.signal,
            });

            if (!res.ok) {
                throw new Error('Image fetch failed');
            }

            const blob = await res.blob();

            abortControllersRef.current.delete(src!);

            return URL.createObjectURL(blob);
        },
        staleTime: 24 * 60 * 60 * 1000,
    });
    const inProgressRef = useCurrentRef(proxyImageQuery.isLoading);

    useEffect(() => {
        if (!src) return;

        const inProgress = inProgressRef.current;
        const abortController = abortControllersRef.current.get(src);

        return () => {
            if (inProgress && abortController) {
                abortController.abort('Image fetch aborted on unmount.');
            }
        };
    }, [src, inProgressRef]);

    return proxyImageQuery;
};
