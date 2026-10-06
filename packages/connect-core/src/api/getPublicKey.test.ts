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

    it('requires read_xpub for the network of a crossChain path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/84'/2'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub', coin: 'ltc' },
        ]);
    });

    it('requires coin-less read_xpub for a crossChain path of no Bitcoin network', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/60'/0'", crossChain: true })).toEqual([
            { permission: 'read_xpub' },
        ]);
    });

    it('requires coin-less read_xpub when the v9 fallback derives a path of no Bitcoin network', () => {
        expect(getPermissions({ coin: 'eth', path: "m/44'/60'/0'", _v9_compat: true })).toEqual([
            { permission: 'read_xpub' },
        ]);
    });
});
