import type { GetAddress as GetAddressParams } from '@trezor/connect-common/src/types/api/account/getAddress';

import GetAddress from './getAddress';

const createMethod = (params: GetAddressParams) =>
    new GetAddress({ payload: { method: 'getAddress', ...params } });

const getPermissions = (params: GetAddressParams) => createMethod(params).requiredPermissions;

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

    it('requires read_address for the other-family network of a crossChain path', () => {
        expect(getPermissions({ coin: 'btc', path: "m/44'/60'/0'/0/0", crossChain: true })).toEqual(
            [{ permission: 'read_address', coin: 'eth' }],
        );
    });

    // A coin type no network knows falls back to the declared coin, so the permission is never
    // coin-less (device-wide).
    it('requires read_address for the declared coin when no network knows the path coin type', () => {
        expect(
            getPermissions({ coin: 'btc', path: "m/44'/9999'/0'/0/0", crossChain: true }),
        ).toEqual([{ permission: 'read_address', coin: 'btc' }]);
    });

    // The permission names the network of the path, so the title names it too — otherwise the
    // user reads "Export Bitcoin address" under an "Ethereum" permission heading.
    it('names both coins in the info label of a crossChain path', () => {
        expect(createMethod({ coin: 'btc', path: "m/84'/0'/0'/0/0" }).info).toBe(
            'Export Bitcoin address',
        );
        expect(createMethod({ coin: 'btc', path: "m/44'/60'/0'/0/0", crossChain: true }).info).toBe(
            'Export Bitcoin address (Ethereum path)',
        );
    });
});
