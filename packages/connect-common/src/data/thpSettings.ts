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
                // `k` is already typed `ThpCredentials` (its key fields carry the brands),
                // so it crosses back into the typed settings as-is. We deliberately do NOT
                // import the `asX()` value helpers here: this module is reachable from the
                // browser (connect-webextension service worker), and pulling them from the
                // `@trezor/protocol` barrel would drag the Node `crypto`-dependent THP
                // handshake code into that bundle. Branding is nominal/compile-time only,
                // so the runtime value is identical either way.
                return k;
            }

            return [];
        });
    }

    return settings;
};
