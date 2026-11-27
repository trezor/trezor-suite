import type { CoinSymbol } from '@trezor/connect-common';

import GetPublicKey from './getPublicKey';

const createMethod = (params: { path: string; coin?: CoinSymbol }, v9Compat?: boolean) =>
    new GetPublicKey({
        payload: { method: 'getPublicKey', ...params, _v9_compat: v9Compat },
    });

describe('GetPublicKey', () => {
    it.each([
        ['a bitcoin path', { path: "m/84'/0'/0'" }],
        ['a non-bitcoin path', { path: "m/44'/60'/0'" }],
        ['a non-bitcoin coin', { path: "m/44'/60'/0'", coin: 'eth' as const }],
    ])('exports the public key of %s in v9 compat mode as bitcoin', (_, params) => {
        expect(createMethod(params, true)['params'][0]?.coinInfo.shortcut).toBe('BTC');
    });

    it('rejects a non-bitcoin path without v9 compat mode', () => {
        expect(() => createMethod({ path: "m/44'/60'/0'" })).toThrow();
    });
});
