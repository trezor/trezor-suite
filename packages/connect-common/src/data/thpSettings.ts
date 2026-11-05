import { MAX_NAME_LENGTH, sanitizeName } from './sanitizeName';
import type { ConnectSettings, ThpSettings } from '../types/settings';

// Names sent to the device are dropped rather than cut when they are too long.
const THP_NAME_OPTIONS = {
    maxLength: MAX_NAME_LENGTH,
    onTooLong: 'reject',
} as const;

export const parseThpSettings = ({ manifest, thp }: Partial<ConnectSettings>): ThpSettings => {
    const settings: ThpSettings = {
        pairingMethods: [],
    };

    if (Array.isArray(thp?.pairingMethods)) {
        settings.pairingMethods = thp.pairingMethods;
    } else {
        settings.pairingMethods = ['CodeEntry'];
    }

    if (typeof thp?.hostName === 'string') {
        settings.hostName = sanitizeName(thp.hostName, THP_NAME_OPTIONS);
    }

    if (typeof thp?.appName === 'string') {
        settings.appName = sanitizeName(thp.appName, THP_NAME_OPTIONS);
    } else if (typeof manifest?.appName === 'string') {
        settings.appName = sanitizeName(manifest.appName, THP_NAME_OPTIONS);
    }

    if (Array.isArray(thp?.knownCredentials)) {
        settings.knownCredentials = thp.knownCredentials.flatMap(k => {
            if (
                k &&
                typeof k === 'object' &&
                typeof k.credential === 'string' &&
                typeof k.host_static_key === 'string' &&
                typeof k.trezor_static_public_key === 'string'
            ) {
                return k;
            }

            return [];
        });
    }

    return settings;
};
