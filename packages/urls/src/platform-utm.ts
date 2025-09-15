import { type Url } from './types';

type TrezorUrlWithoutUTM = `${string}trezor.io${string}`;

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

export const withPlatformUtm = (url: TrezorUrlWithoutUTM): Url => {
    if (!url.includes('trezor.io')) {
        throw new Error(`URL must include trezor.io: ${url}`);
    }

    if (url.includes('utm_medium=')) {
        throw new Error(`URL must not include utm_medium: ${url}`);
    }

    const utmMedium = resolveUtmMedium();

    if (!utmMedium) return url as Url;

    const separator = url.includes('?') ? '&' : '?';

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    return `${cleanUrl}${separator}utm_medium=${utmMedium}` as Url;
};
