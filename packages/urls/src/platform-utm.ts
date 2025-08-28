import { getEnvironment } from '@trezor/env-utils';

import { type Url } from './types';

type TrezorUrlWithoutUTM = `${string}trezor.io${string}`;

export const withPlatformUtm = (url: TrezorUrlWithoutUTM): Url => {
    if (!url.includes('trezor.io')) {
        throw new Error(`URL must include trezor.io: ${url}`);
    }

    if (url.includes('utm_medium=')) {
        throw new Error(`URL must not include utm_medium: ${url}`);
    }

    const utmMedium = getEnvironment();
    const separator = url.includes('?') ? '&' : '?';

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    return `${cleanUrl}${separator}utm_medium=${utmMedium}` as Url;
};
