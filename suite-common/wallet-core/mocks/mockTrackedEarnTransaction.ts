import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    type EarnTransactionsState,
    type TrackedEarnTransaction,
    getEarnTransactionKey,
} from '../src/earn/earnTransactionsReducer';

export const mockTrackedEarnTransaction = (
    overrides: Partial<TrackedEarnTransaction> = {},
): TrackedEarnTransaction => ({
    accountKey: mockAccountKey(),
    txid: 'mockTxid',
    flow: 'stake',
    ...overrides,
});

export const mockEarnTransactionsState = (
    transactions: TrackedEarnTransaction[],
): EarnTransactionsState =>
    Object.fromEntries(transactions.map(tx => [getEarnTransactionKey(tx), tx]));
