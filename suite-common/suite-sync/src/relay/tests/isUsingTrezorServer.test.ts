import { isUsingTrezorServer } from '../isUsingTrezorServer';

describe(isUsingTrezorServer.name, () => {
    it('returns true for the dev relay server', () => {
        expect(isUsingTrezorServer('https://suite-sync-dev.suite.sldev.cz/evolu/')).toBe(true);
    });

    it('returns true for the prod relay server', () => {
        expect(isUsingTrezorServer('https://suite-sync.trezor.io/evolu/')).toBe(true);
    });

    it('returns true with leading/trailing whitespace', () => {
        expect(isUsingTrezorServer('  https://suite-sync.trezor.io/evolu/  ')).toBe(true);
    });

    it('returns true with different casing', () => {
        expect(isUsingTrezorServer('HTTPS://SUITE-SYNC.TREZOR.IO/EVOLU/')).toBe(true);
    });

    it('returns false for a custom relay server', () => {
        expect(isUsingTrezorServer('https://my-custom-relay.example.com')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isUsingTrezorServer('')).toBe(false);
    });

    it('returns false for a partial match', () => {
        expect(isUsingTrezorServer('https://suite-sync.trezor.io')).toBe(false);
    });
});
