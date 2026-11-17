import type { CoinSymbol } from '@trezor/connect-common';

import GetPublicKey from './getPublicKey';

type GetPublicKeyParams = {
    path: string;
    coin?: CoinSymbol;
    crossChain?: boolean;
    ecdsaCurveName?: string;
};

const createMethod = (params: GetPublicKeyParams, v9Compat?: boolean) =>
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

describe('GetPublicKey crossChain permissions', () => {
    it.each([
        ['Litecoin', "m/84'/2'/0'", undefined, 'ltc'],
        ['Ethereum', "m/44'/60'/0'", undefined, 'eth'],
        ['Tron', "m/44'/195'/0'", undefined, 'trx'],
        ['Ripple', "m/44'/144'/0'", undefined, 'xrp'],
        ['Nostr', "m/44'/1237'/0'", undefined, 'nostr'],
        ['Solana', "m/44'/501'/0'/0'", 'ed25519', 'sol'],
        ['Stellar', "m/44'/148'/0'", 'ed25519', 'xlm'],
        ['Solana on secp256k1', "m/44'/501'/0'/0'", undefined, 'btc'],
        ['Ethereum on secp256k1-decred', "m/44'/60'/0'", 'secp256k1-decred', 'eth'],
        ['Ethereum on secp256k1-groestl', "m/44'/60'/0'", 'secp256k1-groestl', 'eth'],
        ['Ethereum on an empty curve name', "m/44'/60'/0'", '', 'eth'],
        ['Solana on ed25519 with a NUL suffix', "m/44'/501'/0'/0'", 'ed25519\0x', 'sol'],
        ['Ethereum on ed25519', "m/44'/60'/0'", 'ed25519', 'btc'],
        ['Monero', "m/44'/128'/0'", 'ed25519', 'btc'],
        ['Cardano', "m/1852'/1815'/0'", 'ed25519', 'btc'],
        ['coin type 1', "m/84'/1'/0'", undefined, 'btc'],
        ['an unknown coin type', "m/44'/9999'/0'", undefined, 'btc'],
    ])('requires read_xpub for a crossChain path of %s', (_, path, ecdsaCurveName, coin) => {
        const method = createMethod({ coin: 'btc', path, ecdsaCurveName, crossChain: true });
        expect(method.requiredPermissions).toEqual([{ permission: 'read_xpub', coin }]);
    });

    it('titles a crossChain call by its coin and the network of its path', () => {
        expect(createMethod({ coin: 'btc', path: "m/44'/60'/0'", crossChain: true }).info).toBe(
            'Export public key of Bitcoin legacy account #1 (Ethereum path)',
        );
        expect(
            createMethod({
                coin: 'btc',
                path: "m/44'/501'/0'/0'",
                ecdsaCurveName: 'ed25519',
                crossChain: true,
            }).info,
        ).toBe('Export public key of Bitcoin legacy account #1 (Solana path)');
    });
});
