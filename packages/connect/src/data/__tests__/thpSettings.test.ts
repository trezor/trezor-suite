import { parseThpSettings } from '../thpSettings';

describe('data/thpSettings', () => {
    it('parseThpSettings', () => {
        const hostName = 'TrezorConnect';
        const manifest = { appName: hostName, appUrl: 'test', email: 'test@trezor.io' };
        const pairingMethods = ['CodeEntry' as const];

        // hostName fallbacks to manifest.appName, default pairingMethods
        let result = parseThpSettings({ manifest });
        expect(result).toEqual({ hostName, pairingMethods });

        // hostName from settings.thp, default pairingMethods
        result = parseThpSettings({
            thp: { hostName: 'Bar', pairingMethods },
        });
        expect(result).toEqual({ hostName: 'Bar', pairingMethods });

        // pairingMethods from settings.thp
        result = parseThpSettings({ manifest, thp: { pairingMethods: [] } });
        expect(result).toEqual({ hostName, pairingMethods: [] });

        // pairingMethods as enum values
        result = parseThpSettings({
            manifest,
            thp: { pairingMethods: [1, 3] },
        });
        expect(result).toEqual({ hostName, pairingMethods: [1, 3] });

        // staticKey from settings.thp
        result = parseThpSettings({
            manifest,
            thp: { staticKey: '00112233', pairingMethods },
        });
        expect(result).toEqual({ hostName, staticKey: '00112233', pairingMethods });

        // knownCredentials from settings.thp
        result = parseThpSettings({
            manifest,
            thp: {
                knownCredentials: [
                    { credential: '0000', trezor_static_pubkey: '1111', autoconnect: true },
                    { credential: '0101', trezor_static_pubkey: '0202' },
                ],
                pairingMethods,
            },
        });
        expect(result).toEqual({
            hostName,
            pairingMethods,
            knownCredentials: [
                { credential: '0000', trezor_static_pubkey: '1111', autoconnect: true },
                { credential: '0101', trezor_static_pubkey: '0202' },
            ],
        });

        // @ts-expect-error invalid pairingMethods
        result = parseThpSettings({ manifest, thp: { pairingMethods: 1 } });
        expect(result).toEqual({ hostName, pairingMethods });
        // @ts-expect-error invalid pairingMethods
        result = parseThpSettings({ manifest, thp: { pairingMethods: ['Foo'] } });
        // @ts-expect-error invalid pairingMethods
        result = parseThpSettings({ manifest, thp: { pairingMethods: [0] } });

        // @ts-expect-error invalid hostName
        result = parseThpSettings({ thp: { hostName: {} } });
        expect(result).toEqual({ pairingMethods });

        // @ts-expect-error invalid staticKey
        result = parseThpSettings({ thp: { hostName, staticKey: true } });
        expect(result).toEqual({ hostName, pairingMethods });

        // invalid knownCredentials
        result = parseThpSettings({
            thp: {
                hostName,
                pairingMethods,
                knownCredentials: [
                    // @ts-expect-error
                    { credential: 'aa' },
                    // @ts-expect-error
                    { trezor_static_pubkey: 'aa' },
                    // @ts-expect-error
                    null,
                ],
            },
        });
        expect(result).toEqual({ hostName, pairingMethods, knownCredentials: [] });
    });
});
