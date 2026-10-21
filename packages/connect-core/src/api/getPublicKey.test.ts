import type { CoinSymbol } from '@trezor/connect-common';

import GetPublicKey from './getPublicKey';

const createMethod = (params: { path: string; coin?: CoinSymbol }, v9Compat?: boolean) =>
    new GetPublicKey({
        payload: { method: 'getPublicKey', ...params, _v9_compat: v9Compat },
    });

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
