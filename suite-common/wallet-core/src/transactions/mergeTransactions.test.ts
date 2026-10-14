import { testMocks } from '@suite-common/test-utils';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';

import { mergeTransactions } from './mergeTransactions';

const tx = (txid: string, overrides?: Partial<WalletAccountTransaction>) =>
    testMocks.getWalletTransaction({ txid, ...overrides });

describe(mergeTransactions.name, () => {
    it.each([
        ['page', { page: 1, perPage: 2 }],
        ['prepend', {}],
    ])('returns undefined when nothing changes (%s)', (_, paging) => {
        const storedTxs = [tx('a'), tx('b')];

        expect(
            mergeTransactions({
                storedTxs,
                transactions: [tx('a', { blockHeight: 1 }), tx('b')],
                ...paging,
            }),
        ).toBeUndefined();
    });

    it.each([
        ['page, update first', ['a', 'new'], { page: 1, perPage: 2 }],
        ['page, insert first', ['new', 'a'], { page: 1, perPage: 2 }],
        ['prepend, update first', ['a', 'new'], {}],
        ['prepend, insert first', ['new', 'a'], {}],
    ])('does not mutate stored txs (%s)', (_, txids, paging) => {
        const storedTxs = [tx('a', { blockHeight: 0 }), tx('b')];
        const storedSnapshot = [...storedTxs];

        mergeTransactions({ storedTxs, transactions: txids.map(txid => tx(txid)), ...paging });

        expect(storedTxs).toHaveLength(storedSnapshot.length);
        storedSnapshot.forEach((storedTx, index) => expect(storedTxs[index]).toBe(storedTx));
    });
});
