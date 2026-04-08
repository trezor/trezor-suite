import { isUsingTrezorSuiteSyncServer } from '../isUsingTrezorSuiteSyncServer';

describe(isUsingTrezorSuiteSyncServer.name, () => {
    it('returns true for the dev server server', () => {
        expect(isUsingTrezorSuiteSyncServer('https://suite-sync-dev.suite.sldev.cz/evolu/')).toBe(
            true,
        );
    });

    it('returns true for the prod server server', () => {
        expect(isUsingTrezorSuiteSyncServer('https://suite-sync.trezor.io/evolu/')).toBe(true);
    });

    it('returns true with leading/trailing whitespace', () => {
        expect(isUsingTrezorSuiteSyncServer('  https://suite-sync.trezor.io/evolu/  ')).toBe(true);
    });

    it('returns true with different casing', () => {
        expect(isUsingTrezorSuiteSyncServer('HTTPS://SUITE-SYNC.TREZOR.IO/EVOLU/')).toBe(true);
    });

    it('returns false for a custom server server', () => {
        expect(isUsingTrezorSuiteSyncServer('https://my-custom-relay.example.com')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isUsingTrezorSuiteSyncServer('')).toBe(false);
    });

    it('returns false for a partial match', () => {
        expect(isUsingTrezorSuiteSyncServer('https://suite-sync.trezor.io')).toBe(false);
    });
});
