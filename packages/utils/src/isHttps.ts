import { type HttpsUrl } from '@trezor/type-utils';

export function isHttps(url: string): url is HttpsUrl {
    try {
        const parsedUrl = new URL(url);

        return parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
}
