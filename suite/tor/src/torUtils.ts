import { parseHostname } from '@trezor/utils';

import { TorStatus } from './torSlice';

export const getIsTorDomain = (domain: string) => domain.endsWith('.onion');

export const isOnionUrl = (url: string) => {
    const hostname = parseHostname(url);

    return !!hostname && getIsTorDomain(hostname);
};

export const getIsTorEnabled = (torStatus: TorStatus) => {
    switch (torStatus) {
        case TorStatus.Enabled:
        case TorStatus.Slow:
            return true;

        case TorStatus.Enabling:
        case TorStatus.Disabling:
        case TorStatus.Disabled:
            return false;

        default:
            return false;
    }
};

export const getIsTorLoading = (torStatus: TorStatus) => {
    switch (torStatus) {
        case TorStatus.Enabling:
        case TorStatus.Disabling:
            return true;

        case TorStatus.Enabled:
        case TorStatus.Disabled:
            return false;

        default:
            return false;
    }
};
