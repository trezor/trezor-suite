import { getReferencedTransactions } from '../refTx';

describe('core/methods/tx/refTx', () => {
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
