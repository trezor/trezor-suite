import { requireReferencedTransactions, getReferencedTransactions } from '../refTx';

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
});
