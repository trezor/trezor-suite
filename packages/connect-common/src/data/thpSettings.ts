import { asHostStaticKeyHex, asThpCredentialId, asTrezorStaticPublicKey } from '@trezor/protocol';

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
                // Re-apply the brands at this untrusted-shape boundary (decision 6):
                // the rehydrated credential is a plain object at runtime, so brand its
                // key fields as they cross back into the typed settings.
                return {
                    ...k,
                    credential: asThpCredentialId(k.credential),
                    host_static_key: asHostStaticKeyHex(k.host_static_key),
                    trezor_static_public_key: asTrezorStaticPublicKey(k.trezor_static_public_key),
                };
            }

            return [];
        });
    }

    return settings;
};
