import { transformAccountTransactions } from './handlers/getAccountInfo';

// Regression tests for the `account_tx` poison-record DoS: a malformed or malicious
// rippled backend (custom XRP backends are user-selectable) can return `result.transactions`
// as a non-array; the pre-fix `response.result.transactions.flatMap(...)` threw
// synchronously and rejected the whole getAccountInfo handler (per-account history DoS).
describe('transformAccountTransactions', () => {
    const descriptor = 'rTEST00000000000000000000000000000';

    const validTx = {
        hash: 'ABCDEF',
        tx_json: {
            TransactionType: 'Payment',
            Account: descriptor,
            DeliverMax: '1000000',
        },
        meta: { TransactionResult: 'tesSUCCESS', delivered_amount: '1000000' },
    };

    it('transforms a well-formed transactions array', () => {
        const result = transformAccountTransactions([validTx] as any, descriptor);
        expect(result).toHaveLength(1);
        expect(result[0]?.txid).toBe('ABCDEF');
    });

    it('does not throw and returns [] when transactions is a non-array object', () => {
        expect(() => transformAccountTransactions({} as any, descriptor)).not.toThrow();
        expect(transformAccountTransactions({} as any, descriptor)).toEqual([]);
    });

    it('does not throw and returns [] when transactions is undefined', () => {
        expect(() => transformAccountTransactions(undefined, descriptor)).not.toThrow();
        expect(transformAccountTransactions(undefined, descriptor)).toEqual([]);
    });

    it('skips records that are missing tx_json but keeps valid siblings', () => {
        const result = transformAccountTransactions(
            [{ hash: 'NO_TX_JSON' }, validTx] as any,
            descriptor,
        );
        expect(result).toHaveLength(1);
        expect(result[0]?.txid).toBe('ABCDEF');
    });
});
