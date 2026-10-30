import type { Transaction } from '@trezor/blockchain-link-types';

export const mockTransaction = (transaction: Partial<Transaction> = {}): Transaction => ({
    type: 'recv',
    txid: 'txid',
    blockTime: 1700000000,
    blockHeight: 100,
    amount: '1000',
    fee: '10',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [],
        vout: [],
        size: 200,
        totalInput: '0',
        totalOutput: '0',
    },
    ...transaction,
});
