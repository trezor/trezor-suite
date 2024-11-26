import { HttpRequestType, HttpRequestReturnType, HttpRequestOptions } from './assetsTypes';
import { tryLocalAssetRequire } from './assetUtils';

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
                if (type === 'binary') {
                    return response.arrayBuffer() as unknown as HttpRequestReturnType<T>;
                }
                if (type === 'json') {
                    return response.json() as unknown as HttpRequestReturnType<T>;
                }

                return response.text() as unknown as HttpRequestReturnType<T>;
            })
            .catch(error => {
                console.error('httpRequest native error', error);
                throw error;
            });
    }

    return asset as Promise<HttpRequestReturnType<T>>;
}
