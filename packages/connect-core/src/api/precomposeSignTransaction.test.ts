import type { SignTransaction as SignTransactionParams } from '@trezor/connect-common';

import PrecomposeSignTransaction from './precomposeSignTransaction';

const input = {
    address_n: "m/86'/1'/0'/0/0",
    prev_hash: 'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00',
    prev_index: 0,
    amount: '129999867',
    script_type: 'SPENDTAPROOT',
} as const;

const base: SignTransactionParams = {
    coin: 'test',
    inputs: [input],
    outputs: [
        {
            address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
            amount: '129999000',
            script_type: 'PAYTOADDRESS',
        },
    ],
};

const precompose = (params: SignTransactionParams) =>
    new PrecomposeSignTransaction({
        payload: { method: 'precomposeSignTransaction', ...params },
    }).run();

describe('PrecomposeSignTransaction', () => {
    it('precomposes a transaction whose inputs carry their amounts', async () => {
        await expect(precompose(base)).resolves.toMatchObject({
            type: 'final',
            totalSpent: '129999867',
            fee: '867',
        });
    });

    it('needs the referenced transaction to value an input with a numeric amount', () => {
        expect(() => precompose({ ...base, inputs: [{ ...input, amount: 129999867 }] })).toThrow(
            'refTxs are required',
        );
    });
});
