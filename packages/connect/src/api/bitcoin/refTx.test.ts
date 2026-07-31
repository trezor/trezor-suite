import * as fixtures from './__fixtures__/refTx';
import {
    getReferencedTransactions,
    requireReferencedTransactions,
    validateReferencedTransactions,
} from './refTx';

describe('core/methods/tx/refTx', () => {
    it('requireReferencedTransactions', () => {
        expect(requireReferencedTransactions([{ script_type: 'SPENDP2SHWITNESS' }] as any)).toEqual(
            true,
        );
        expect(
            requireReferencedTransactions([
                { script_type: 'SPENDP2SHWITNESS' },
                { script_type: 'SPENDTAPROOT' },
                { script_type: 'SPENDWITNESS' },
                { script_type: 'SPENDADDRESS' },
                { script_type: 'SPENDMULTISIG' },
                { script_type: undefined },
            ] as any),
        ).toEqual(true);
        expect(
            requireReferencedTransactions([
                { script_type: 'SPENDTAPROOT' },
                { script_type: 'SPENDTAPROOT' },
                { script_type: 'SPENDTAPROOT' },
            ] as any),
        ).toEqual(false);
        expect(
            requireReferencedTransactions([
                { script_type: 'SPENDTAPROOT' },
                { script_type: 'EXTERNAL' },
            ] as any),
        ).toEqual(false);

        // zcash v5
        expect(
            requireReferencedTransactions([], { version: 4 }, { shortcut: 'ZEC' } as any),
        ).toEqual(true);
        expect(
            requireReferencedTransactions([], { version: 4 }, { shortcut: 'TAZ' } as any),
        ).toEqual(true);
        expect(
            requireReferencedTransactions([], { version: 5 }, { shortcut: 'ZEC' } as any),
        ).toEqual(false);
        expect(
            requireReferencedTransactions([], { version: 5 }, { shortcut: 'TAZ' } as any),
        ).toEqual(false);
    });

    it('validateReferencedTransactions applies the ZEC v5 exemption for input reference txs', () => {
        // A valid provided refTx, unrelated to the spent input below.
        const providedRefTx = {
            hash: '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
            version: 1,
            lock_time: 1287124,
            inputs: [
                {
                    prev_hash: 'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00',
                    prev_index: 0,
                    script_sig: '',
                    sequence: 4294967293,
                },
            ],
            bin_outputs: [
                {
                    amount: 10000000,
                    script_pubkey: 'a914051877a0cc43165e48975c1e62bdef3b6c942a3887',
                },
            ],
        };
        // The input references a tx that is NOT provided, so a strict validation would throw.
        const params = {
            transactions: [providedRefTx],
            inputs: [
                {
                    prev_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    prev_index: 0,
                },
            ],
            outputs: [],
            coinInfo: { shortcut: 'ZEC' },
        };

        // Zcash NU5 (v5) transactions don't need input reference txs (matches the authoritative
        // requireReferencedTransactions check in signTransaction) — validation must not throw.
        expect(() =>
            validateReferencedTransactions({ ...params, version: 5 } as any),
        ).not.toThrow();

        // Older Zcash versions still require them.
        expect(() => validateReferencedTransactions({ ...params, version: 4 } as any)).toThrow(
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa not provided',
        );
    });

    it('getReferencedTransactions', () => {
        const inputs = [
            { prev_hash: 'abcd' },
            { prev_hash: 'abcd' },
            { prev_hash: 'deadbeef' },
            { prev_hash: 'abcd' },
            { prev_hash: 'deadbeef' },
            { prev_hash: 'dcba' },
        ];
        const result = ['abcd', 'deadbeef', 'dcba'];
        expect(getReferencedTransactions(inputs as any)).toEqual(result);
    });

    describe('validateReferencedTransactions', () => {
        fixtures.validateReferencedTransactions.forEach(f => {
            it(` ${f.description}`, () => {
                if (f.error) {
                    expect(() => validateReferencedTransactions(f.params as any)).toThrow(f.error);
                } else {
                    expect(validateReferencedTransactions(f.params as any)).toEqual(f.result);
                }
            });
        });
    });
});
