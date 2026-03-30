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
        settings.hostName = thp.hostName;
    }

    if (typeof thp?.appName === 'string') {
        settings.appName = thp.appName;
    } else if (typeof manifest?.appName === 'string') {
        settings.appName = manifest?.appName;
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
