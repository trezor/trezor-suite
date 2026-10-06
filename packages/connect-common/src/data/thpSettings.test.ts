import { parseThpSettings } from './thpSettings';

describe('data/thpSettings', () => {
    it('parseThpSettings', () => {
        const appName = 'TrezorConnect';
        const manifest = { appName, appUrl: 'test', email: 'test@trezor.io' };
        const pairingMethods = ['CodeEntry' as const];

        // appName fallbacks to manifest.appName, default pairingMethods
        let result = parseThpSettings({ manifest });
        expect(result).toEqual({ appName, pairingMethods });

        // appName from settings.thp, default pairingMethods
        result = parseThpSettings({
            thp: { appName: 'Bar', pairingMethods },
        });
        expect(result).toEqual({ appName: 'Bar', pairingMethods });

        // pairingMethods from settings.thp
        result = parseThpSettings({ manifest, thp: { pairingMethods: [] } });
        expect(result).toEqual({ appName, pairingMethods: [] });

        // pairingMethods as enum values
        result = parseThpSettings({
            manifest,
            thp: { pairingMethods: [1, 3] },
        });
        expect(result).toEqual({ appName, pairingMethods: [1, 3] });

        // knownCredentials from settings.thp
        result = parseThpSettings({
            manifest,
            thp: {
                knownCredentials: [
                    {
                        credential: '0000',
                        host_static_key: '7777',
                        trezor_static_public_key: '1111',
                        autoconnect: true,
                    },
                    {
                        credential: '0101',
                        host_static_key: '7777',
                        trezor_static_public_key: '0202',
                    },
                ],
                pairingMethods,
            },
        });
        expect(result).toEqual({
            appName,
            pairingMethods,
            knownCredentials: [
                {
                    credential: '0000',
                    host_static_key: '7777',
                    trezor_static_public_key: '1111',
                    autoconnect: true,
                },
                {
                    credential: '0101',
                    host_static_key: '7777',
                    trezor_static_public_key: '0202',
                },
            ],
        });

        // @ts-expect-error invalid pairingMethods
        result = parseThpSettings({ manifest, thp: { pairingMethods: 1 } });
        expect(result).toEqual({ appName, pairingMethods });
        // @ts-expect-error invalid pairingMethods
        parseThpSettings({ manifest, thp: { pairingMethods: ['Foo'] } });
        // @ts-expect-error invalid pairingMethods
        parseThpSettings({ manifest, thp: { pairingMethods: [0] } });

        // @ts-expect-error invalid appName
        result = parseThpSettings({ thp: { appName: {} } });
        expect(result).toEqual({ pairingMethods });

        // @ts-expect-error invalid hostName
        result = parseThpSettings({ thp: { hostName: {} } });
        expect(result).toEqual({ pairingMethods });

        // invalid knownCredentials
        result = parseThpSettings({
            thp: {
                appName,
                pairingMethods,
                knownCredentials: [
                    // @ts-expect-error
                    { credential: 'aa' },
                    // @ts-expect-error
                    { trezor_static_public_key: 'aa' },
                    // @ts-expect-error
                    null,
                ],
            },
        });
        expect(result).toEqual({ appName, pairingMethods, knownCredentials: [] });
    });

    describe('trims whitespace from name fields', () => {
        const pairingMethods = ['CodeEntry' as const];

        it('trims appName from thp settings', () => {
            const result = parseThpSettings({
                thp: { appName: '  My  App  ', pairingMethods },
            });
            expect(result.appName).toBe('My App');
        });

        it('trims appName when falling back to manifest', () => {
            const result = parseThpSettings({
                manifest: {
                    appName: '  Manifest  App  ',
                    appUrl: 'https://test.com',
                    email: 'test@test.com',
                },
            });
            expect(result.appName).toBe('Manifest App');
        });

        it('trims hostName', () => {
            const result = parseThpSettings({
                thp: { hostName: '  My  Host  ', pairingMethods },
            });
            expect(result.hostName).toBe('My Host');
        });
    });

    describe('rejects invalid name fields', () => {
        const pairingMethods = ['CodeEntry' as const];

        it('drops empty appName from thp settings', () => {
            const result = parseThpSettings({
                thp: { appName: '', pairingMethods },
            });
            expect(result.appName).toBeUndefined();
        });

        it('drops whitespace-only appName from thp settings', () => {
            const result = parseThpSettings({
                thp: { appName: '   ', pairingMethods },
            });
            expect(result.appName).toBeUndefined();
        });

        it('drops appName with only control characters', () => {
            const result = parseThpSettings({
                thp: { appName: '\x00\x1F', pairingMethods },
            });
            expect(result.appName).toBeUndefined();
        });

        it('strips control characters from appName', () => {
            const result = parseThpSettings({
                thp: { appName: 'My\x00App', pairingMethods },
            });
            expect(result.appName).toBe('MyApp');
        });

        it('drops appName exceeding 100 characters', () => {
            const result = parseThpSettings({
                thp: { appName: 'A'.repeat(101), pairingMethods },
            });
            expect(result.appName).toBeUndefined();
        });

        it('drops empty hostName', () => {
            const result = parseThpSettings({
                thp: { hostName: '   ', pairingMethods },
            });
            expect(result.hostName).toBeUndefined();
        });

        it('strips control characters from hostName', () => {
            const result = parseThpSettings({
                thp: { hostName: 'My\x00Host', pairingMethods },
            });
            expect(result.hostName).toBe('MyHost');
        });
    });
});
