import type { SignTransaction as SignTransactionParams } from '@trezor/connect-common';

import SignTransaction from './signTransaction';

const base: SignTransactionParams = {
    coin: 'test',
    inputs: [
        {
            address_n: "m/84'/1'/0'/0/0",
            prev_hash: 'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00',
            prev_index: 0,
            amount: '129999867',
            script_type: 'SPENDWITNESS',
        },
    ],
    outputs: [
        {
            address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
            amount: '129999000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

const getPermissions = (params: SignTransactionParams) =>
    new SignTransaction({ payload: { method: 'signTransaction', ...params } }).requiredPermissions;

describe('SignTransaction requiredPermissions', () => {
    it('requires sign for a regular transaction', () => {
        expect(getPermissions(base)).toEqual([{ permission: 'sign', coin: 'test' }]);
    });

    it('requires internal for preauthorized signing, like authorizeCoinjoin', () => {
        expect(getPermissions({ ...base, preauthorized: true })).toContainEqual({
            permission: 'internal',
            coin: 'test',
        });
    });
});
