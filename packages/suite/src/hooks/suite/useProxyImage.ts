import { useEffect, useState } from 'react';

import { IMAGE_PROXY_API_AUTH_BEARER, IMAGE_PROXY_API_URL } from '@trezor/urls';

/**
 * Load a remote image using proxy to preserve privacy of our users.
 * Display loadingComponent while the image is being fetched
 * Display fallbackComponent if the image fails to load
 */
export const useProxyImage = (src?: string) => {
    const [imageBlob, setImageBlob] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        setLoading(true);
        setError(false);
        setImageBlob(null);

        if (!src) {
            setLoading(false);
            setError(true);

            return;
        }

        fetch(`${IMAGE_PROXY_API_URL}?url=${encodeURIComponent(src)}`, {
            headers: {
                Authorization: `Bearer ${IMAGE_PROXY_API_AUTH_BEARER}`,
            },
        })
            .then(res => {
                if (!res.ok) throw new Error('Image fetch failed');

                return res.blob();
            })
            .then(blob => {
                if (!isCancelled) {
                    const objectUrl = URL.createObjectURL(blob);
                    setImageBlob(objectUrl);
                }
            })
            .catch(() => {
                if (!isCancelled) setError(true);
            })
            .finally(() => {
                if (!isCancelled) setLoading(false);
            });

        return () => {
            isCancelled = true;
        };
    }, [src]);

    return {
        imageBlob,
        loading,
        error,
    };
};
