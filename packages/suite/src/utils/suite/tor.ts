import { parseHostname, urlToOnion } from '@trezor/utils';
import { TOR_URLS } from '@trezor/urls';
import { TorStatus } from 'src/types/suite';

/**
 * returns tor url if tor url is request and tor url is available for given domain
 */
export const getTorUrlIfAvailable = (url: string) => urlToOnion(url, TOR_URLS);

export const getIsTorDomain = (domain: string) => domain.endsWith('.onion');

export const isOnionUrl = (url: string) => {
    const hostname = parseHostname(url);
    return !!hostname && getIsTorDomain(hostname);
};

export const getIsTorEnabled = (torStatus: TorStatus): boolean => {
    switch (torStatus) {
        case TorStatus.Enabled:
        case TorStatus.Misbehaving:
            // When Tor is in status Misbehaving means network is not behaving properly but still enabled.
            return true;

        case TorStatus.Enabling:
        case TorStatus.Disabling:
        case TorStatus.Disabled:
        case TorStatus.Error:
            return false;
    }
};

export const getIsTorLoading = (torStatus: TorStatus): boolean => {
    switch (torStatus) {
        case TorStatus.Enabling:
        case TorStatus.Disabling:
            return true;

        case TorStatus.Enabled:
        case TorStatus.Disabled:
        case TorStatus.Misbehaving:
        case TorStatus.Error:
            return false;
    }
};
