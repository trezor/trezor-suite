import { HttpRequestError, tryLocalAssetRequire } from './assetUtils';
import type { HttpRequestOptions, HttpRequestReturnType, HttpRequestType } from './assetsTypes';

/**
 * Http requesst wrapper for suite-native, that first tries to read files locally (unless forced to skip),
 * then fetches from remote source and handles various response states in a unified way.
 */
export function httpRequest<T extends HttpRequestType>(
    url: string,
    type: T,
    options?: HttpRequestOptions,
): Promise<HttpRequestReturnType<T>> {
    const asset = options?.skipLocalForceDownload ? null : tryLocalAssetRequire(url);

    if (!asset) {
        return fetch(url, {
            ...options,
        })
            .then(response => {
                if (!response.ok) {
                    throw new HttpRequestError(response);
                }
                if (type === 'binary') {
                    return response.arrayBuffer() as unknown as HttpRequestReturnType<T>;
                }
                if (type === 'json') {
                    return response.json() as unknown as HttpRequestReturnType<T>;
                }

                return response.text() as unknown as HttpRequestReturnType<T>;
            })
            .catch(error => {
                throw error;
            });
    }

    return asset as Promise<HttpRequestReturnType<T>>;
}
