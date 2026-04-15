import { type Url } from './types';

type UtmParams = Record<`utm_${Lowercase<string>}`, string>;

export const withUtmParams = (url: Url, params: UtmParams): Url => {
    if (!url.includes('trezor.io')) {
        throw new Error(`URL must include trezor.io: ${url}`);
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    const parts = cleanUrl.split('#');
    const baseUrl = parts[0] ?? cleanUrl;
    const fragment = parts[1];
    const anchorFragment = fragment ? `#${fragment}` : '';

    const urlObj = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    const existingParams = new Set(urlObj.searchParams.keys());

    const newParams = Object.entries(params)
        .filter(([key]) => !existingParams.has(key))
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    if (!newParams) return cleanUrl as Url;

    const separator = baseUrl.includes('?') ? '&' : '?';

    return `${baseUrl}${separator}${newParams}${anchorFragment}` as Url;
};

const resolveUtmMedium = () => {
    try {
        if (process.env.SUITE_TYPE === 'web') {
            return 'web';
        } else if (process.env.SUITE_TYPE === 'desktop') {
            return 'desktop';
        } else if (
            process.env.EXPO_PUBLIC_ENVIRONMENT &&
            process.env.EXPO_PUBLIC_ENVIRONMENT !== 'undefined'
        ) {
            return 'mobile';
        }

        return undefined;
    } catch {
        return undefined;
    }
};

export const withPlatformUtm = (url: Url): Url => {
    const utmMedium = resolveUtmMedium();

    return withUtmParams(url, utmMedium ? { utm_medium: utmMedium } : {});
};
