import { corsValidator, parseConnectSettings, parseManifest } from './connectSettings';

describe('data/connectSettings', () => {
    describe('parseConnectSettings enabledNetworks', () => {
        it('preserves enabledNetworks passed to init', () => {
            expect(
                parseConnectSettings({ enabledNetworks: [{ coin: 'ada' }, { coin: 'btc' }] })
                    .enabledNetworks,
            ).toEqual([{ coin: 'ada' }, { coin: 'btc' }]);
        });

        it('leaves enabledNetworks undefined when not provided', () => {
            expect(parseConnectSettings({}).enabledNetworks).toBeUndefined();
        });

        it('drops a non-array enabledNetworks value', () => {
            expect(
                // @ts-expect-error intentionally malformed input
                parseConnectSettings({ enabledNetworks: 'ada' }).enabledNetworks,
            ).toBeUndefined();
        });
    });

    describe('parseManifest', () => {
        const baseManifest = {
            email: 'test@test.com',
            appUrl: 'https://test.com',
            appName: 'Test App',
        };

        it('returns undefined when manifest is undefined', () => {
            expect(parseManifest(undefined)).toBeUndefined();
        });

        it('returns undefined when email is not a string', () => {
            // @ts-expect-error intentionally malformed input
            expect(parseManifest({ ...baseManifest, email: 123 })).toBeUndefined();
        });

        it('returns undefined when appUrl is not a string', () => {
            // @ts-expect-error intentionally malformed input
            expect(parseManifest({ ...baseManifest, appUrl: null })).toBeUndefined();
        });

        it('returns undefined when appName is not a string', () => {
            // @ts-expect-error intentionally malformed input
            expect(parseManifest({ ...baseManifest, appName: 42 })).toBeUndefined();
        });

        it('returns undefined when appIcon is not a string or undefined', () => {
            // @ts-expect-error intentionally malformed input
            expect(parseManifest({ ...baseManifest, appIcon: 123 })).toBeUndefined();
        });

        it('accepts appIcon as undefined', () => {
            expect(parseManifest({ ...baseManifest, appIcon: undefined })).toEqual({
                ...baseManifest,
                appIcon: undefined,
            });
        });

        it('accepts appIcon as a string', () => {
            expect(parseManifest({ ...baseManifest, appIcon: 'icon.png' })).toEqual({
                ...baseManifest,
                appIcon: 'icon.png',
            });
        });

        it('returns a valid manifest with all fields', () => {
            expect(parseManifest(baseManifest)).toEqual({
                email: 'test@test.com',
                appUrl: 'https://test.com',
                appName: 'Test App',
                appIcon: undefined,
            });
        });

        it('sanitizes appName', () => {
            expect(parseManifest({ ...baseManifest, appName: '  Test   App  ' })?.appName).toBe(
                'Test App',
            );
        });

        it('returns undefined when appName sanitizes to nothing', () => {
            expect(parseManifest({ ...baseManifest, appName: '   ' })).toBeUndefined();
        });
    });

    it('gives the manifest and THP the same appName', () => {
        const settings = parseConnectSettings({
            manifest: {
                email: 'test@test.com',
                appUrl: 'https://test.com',
                appName: ` ${'A'.repeat(200)} `,
            },
        });

        expect(settings.manifest?.appName).toBe('A'.repeat(100));
        expect(settings.thp?.appName).toBe(settings.manifest?.appName);
    });

    it('corsValidator', () => {
        expect(corsValidator('https://connect.trezor.io/9-beta/')).toBeDefined();
        expect(corsValidator('https://az-AZ_123.trezor.io/')).toBeDefined();
        expect(corsValidator('https://multiple.sub.domain.trezor.io/')).toBeDefined();
        expect(corsValidator('https://trezor.sldev.io/')).not.toBeDefined();
        expect(corsValidator('https://testxtrezor.io/')).not.toBeDefined();
        expect(corsValidator('https://testxtrezorxio/')).not.toBeDefined();
        expect(corsValidator('https://non!alpha*numeric?.trezor.io/')).not.toBeDefined();
        expect(corsValidator('https://connect.trezor.io')).not.toBeDefined(); // missing slash at the end
        expect(corsValidator('http://connect.trezor.io/')).not.toBeDefined(); // missing https
        expect(corsValidator('https://localhost:8088/')).toBeDefined();
        expect(corsValidator('https://localhost:5088/')).toBeDefined();
        expect(corsValidator('https://localhost:8088/subdir/')).toBeDefined();
        expect(corsValidator('http://localhost:8088/')).toBeDefined();
        expect(corsValidator('https://connect.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://az-AZ_123.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://multiple.sub.domain.sldev.cz/')).toBeDefined();
        expect(corsValidator('https://sldev.trezor.cz/')).not.toBeDefined();
        expect(corsValidator('https://testxsldev.cz/')).not.toBeDefined();
        expect(corsValidator('https://testxsldevxcz/')).not.toBeDefined();
        expect(corsValidator('https://non!alpha*numeric?.sldev.cz/')).not.toBeDefined();
        expect(corsValidator('https://connect.sldev.cz')).not.toBeDefined(); // missing slash at the end
        expect(corsValidator('http://connect.sldev.cz/')).not.toBeDefined(); // missing https
        // @ts-expect-error
        expect(corsValidator(null)).not.toBeDefined();
        expect(corsValidator(undefined)).not.toBeDefined();
        // @ts-expect-error
        expect(corsValidator({})).not.toBeDefined();
        // @ts-expect-error
        expect(corsValidator(1)).not.toBeDefined();
        expect(corsValidator('https://other-domain.com/connect.trezor.io/9/')).not.toBeDefined();
    });
});
