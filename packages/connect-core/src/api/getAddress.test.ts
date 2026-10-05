import type { GetAddress as GetAddressParams } from '@trezor/connect-common/src/types/api/account/getAddress';

import GetAddress from './getAddress';

const getPermissions = (params: GetAddressParams) =>
    new GetAddress({ payload: { method: 'getAddress', ...params } }).requiredPermissions;

describe('GetAddress requiredPermissions', () => {
    it('requires read_address for the coin of the path', () => {
        expect(getPermissions({ coin: 'test', path: "m/84'/1'/0'/0/0" })).toEqual([
            { permission: 'read_address', coin: 'test' },
        ]);
    });

    it('requires read_address for the network of a crossChain path', () => {
        expect(getPermissions({ coin: 'test', path: "m/84'/0'/0'/0/0", crossChain: true })).toEqual(
            [{ permission: 'read_address', coin: 'btc' }],
        );
    });

    it('requires coin-less read_address for a crossChain path of no Bitcoin network', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/60'/0'/0/0", crossChain: true })).toEqual(
            [{ permission: 'read_address' }],
        );
    });
});
