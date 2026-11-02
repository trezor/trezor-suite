import { type HttpsUrl } from '@trezor/type-utils';
import { isHttps } from '@trezor/utils';

const hasUrlScheme = (value: string) => /^[a-z][a-z0-9+.-]*:/i.test(value);

/**
 * The URL typed into the showcase, or `null` when it cannot be opened. A bare host gets `https://`
 * as on web and desktop, and any other scheme is refused, `http:` included: every host opens https
 * only.
 */
export const parseCustomUrl = (value: string): HttpsUrl | null => {
    const trimmedValue = value.trim();
    const url = hasUrlScheme(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;

    return isHttps(url) ? url : null;
};
