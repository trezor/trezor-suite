import type { GetPublicKey as GetPublicKeyParams } from '@trezor/connect-common/src/types/api/account/getPublicKey';

import GetPublicKey from './getPublicKey';

const createMethod = (params: GetPublicKeyParams, v9Compat?: boolean) =>
    new GetPublicKey({
        payload: { method: 'getPublicKey', ...params, _v9_compat: v9Compat },
    });

const getPermissions = (params: GetPublicKeyParams) => createMethod(params).requiredPermissions;

describe('GetPublicKey permissions', () => {
    it('requires a coin permission for a bitcoin path', () => {
        const method = createMethod({ path: "m/84'/0'/0'" });
        expect(method.requiredPermissions).toEqual([{ permission: 'read_xpub', coin: 'btc' }]);
        expect(method.info).toBe('Export public key of Bitcoin native segwit account #1');
    });

    it('requires a coin permission for a bitcoin path in v9 compat mode', () => {
        const method = createMethod({ path: "m/84'/0'/0'" }, true);
        expect(method.requiredPermissions).toEqual([{ permission: 'read_xpub', coin: 'btc' }]);
    });

    it('requires a generic permission for a non-bitcoin path in v9 compat mode', () => {
        const method = createMethod({ path: "m/44'/60'/0'" }, true);
        expect(method.requiredPermissions).toEqual([{ permission: 'read_xpub' }]);
        expect(method.info).toBe('Export public key of Ethereum account #1');
    });

    it('requires a generic permission for a non-bitcoin coin in v9 compat mode', () => {
        const method = createMethod({ path: "m/44'/60'/0'", coin: 'eth' }, true);
        expect(method.requiredPermissions).toEqual([{ permission: 'read_xpub' }]);
    });

    it('rejects a non-bitcoin path without v9 compat mode', () => {
        expect(() => createMethod({ path: "m/44'/60'/0'" })).toThrow();
    });

    it('combines coin and generic permissions in a bundle', () => {
        const method = new GetPublicKey({
            payload: {
                method: 'getPublicKey',
                bundle: [
                    { path: "m/84'/0'/0'" },
                    { path: "m/44'/60'/0'" },
                    { path: "m/44'/195'/0'" },
                ],
                _v9_compat: true,
            },
        });
        expect(method.requiredPermissions).toEqual([
            { permission: 'read_xpub', coin: 'btc' },
            { permission: 'read_xpub' },
        ]);
    });
});

describe('GetPublicKey requiredPermissions', () => {
    it('requires read_xpub for the coin of the path', () => {
        expect(getPermissions({ coin: 'test', path: "m/84'/1'/0'" })).toEqual([
            { permission: 'read_xpub', coin: 'test' },
        ]);
    });

    it('requires read_xpub for the network of a crossChain path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/84'/2'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'ltc' },
        ]);
    });

    it('requires read_xpub for the other-family network of a crossChain path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/60'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'eth' },
        ]);
    });

    // A misc coin type stays unresolved: `ada`/`tada` in a permission feed connect's
    // `enabledNetworks`, which turns on `derive_cardano` and re-creates the device session, while
    // this call only derives a secp256k1 key in the declared coin's format.
    it('requires read_xpub for the declared coin at a cardano path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/1852'/1815'/0'", crossChain: true })).toEqual(
            [{ permission: 'read_xpub', coin: 'btc' }],
        );
    });

    // A coin type no network knows falls back to the declared coin, so the permission is never
    // coin-less (device-wide).
    it('requires read_xpub for the declared coin when no network knows the path coin type', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/9999'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'btc' },
        ]);
    });

    // The permission names the network of the path, so the info label names it too — otherwise
    // the user reads a Bitcoin label under an "Ethereum" permission heading.
    it('names both coins in the info label of a crossChain path', () => {
        expect(createMethod({ coin: 'btc', path: "m/84'/0'/0'" }).info).toBe(
            'Export public key of Bitcoin native segwit account #1',
        );
        expect(createMethod({ coin: 'btc', path: "m/44'/60'/0'", crossChain: true }).info).toBe(
            'Export public key of Bitcoin legacy account #1 (Ethereum path)',
        );
    });
});
