import type { AccountInfo, Transaction } from '@trezor/blockchain-link-types';

export const mockAccountInfo = (overrides: Partial<AccountInfo> = {}): AccountInfo => ({
    descriptor: 'xpub',
    balance: '0',
    availableBalance: '0',
    empty: true,
    history: { total: 0, unconfirmed: 0, transactions: [] },
    ...overrides,
});

export const mockHistoryTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    type: 'sent',
    txid: 'f'.repeat(64),
    blockHeight: 800000,
    amount: '0',
    fee: '0',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    ...overrides,
});
