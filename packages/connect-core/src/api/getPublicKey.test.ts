import type {
    GetPublicKey as GetPublicKeyParams,
    GetPublicKeyV9Compat,
} from '@trezor/connect-common/src/types/api/account/getPublicKey';

import GetPublicKey from './getPublicKey';

const getPermissions = (params: GetPublicKeyParams & GetPublicKeyV9Compat) =>
    new GetPublicKey({ payload: { method: 'getPublicKey', ...params } }).requiredPermissions;

describe('GetPublicKey requiredPermissions', () => {
    it('requires read_xpub for the coin of the path', () => {
        expect(getPermissions({ coin: 'test', path: "m/84'/1'/0'" })).toEqual([
            { permission: 'read_xpub', coin: 'test' },
        ]);
    });

    // A crossChain path and the v9 fallback derive a key of another network, yet the permission
    // names `coin`, or btc for the fallback.
    it('requires read_xpub for `coin` instead of the network of a crossChain path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/84'/2'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'btc' },
        ]);
    });

    it('requires read_xpub for `coin` instead of the other-family network of a crossChain path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/60'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'btc' },
        ]);
        expect(getPermissions({ coin: 'btc', path: "m/1852'/1815'/0'", crossChain: true })).toEqual(
            [{ permission: 'read_xpub', coin: 'btc' }],
        );
    });

    it('requires read_xpub for btc instead of the network of the path the v9 fallback derives', () => {
        expect(getPermissions({ coin: 'eth', path: "m/44'/60'/0'", _v9_compat: true })).toEqual([
            { permission: 'read_xpub', coin: 'btc' },
        ]);
    });

    it('requires read_xpub for `coin` for a path of a coin type no network knows', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/9999'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'btc' },
        ]);
    });
});
