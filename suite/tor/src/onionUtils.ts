import { parseHostname } from '@trezor/utils';

export const getIsTorDomain = (domain: string) => domain.endsWith('.onion');

export const isOnionUrl = (url: string) => {
    const hostname = parseHostname(url);

    return !!hostname && getIsTorDomain(hostname);
};
