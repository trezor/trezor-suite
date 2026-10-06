import { MAX_NAME_LENGTH, sanitizeName } from './sanitizeName';
import type { ConnectSettings, ThpSettings } from '../types/settings';

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
        settings.hostName = sanitizeName(thp.hostName, MAX_NAME_LENGTH);
    }

    if (typeof thp?.appName === 'string') {
        settings.appName = sanitizeName(thp.appName, MAX_NAME_LENGTH);
    } else if (typeof manifest?.appName === 'string') {
        settings.appName = sanitizeName(manifest.appName, MAX_NAME_LENGTH);
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
