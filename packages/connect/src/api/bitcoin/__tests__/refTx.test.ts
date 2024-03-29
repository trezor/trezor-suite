import {
    requireReferencedTransactions,
    getReferencedTransactions,
    validateReferencedTransactions,
} from '../refTx';
import * as fixtures from '../__fixtures__/refTx';

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
