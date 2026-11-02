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

    it.each([
        ['overwrites the page', ['a', 'b', 'c', 'd'], ['a', 'b', 'x', 'y']],
        ['appends past the end', ['a', 'b'], ['a', 'b', 'x', 'y']],
    ])('writes new txs at the page index (%s)', (_, storedTxids, expectedTxids) => {
        const result = mergeTransactions({
            storedTxs: storedTxids.map(txid => tx(txid)),
            transactions: [tx('x'), tx('y')],
            page: 2,
            perPage: 2,
        });

        expect(result?.map(t => t?.txid)).toEqual(expectedTxids);
    });

    it.each([
        ['page', { page: 1, perPage: 2 }],
        ['prepend', {}],
    ])('replaces an updated tx in place with a copy (%s)', (_, paging) => {
        const confirmedTx = tx('a', { blockHeight: 2 });

        const result = mergeTransactions({
            storedTxs: [tx('a', { blockHeight: 0 }), tx('b')],
            transactions: [confirmedTx],
            ...paging,
        });

        expect(result?.map(t => t?.txid)).toEqual(['a', 'b']);
        expect(result?.[0]).toEqual(confirmedTx);
        expect(result?.[0]).not.toBe(confirmedTx);
    });

    it('re-inserts a txid whose slot was overwritten earlier in the page', () => {
        const result = mergeTransactions({
            storedTxs: [tx('a'), tx('b')],
            transactions: [tx('x'), tx('a')],
            page: 1,
            perPage: 2,
        });

        expect(result?.map(t => t?.txid)).toEqual(['x', 'a']);
    });

    it('finds a later duplicate after its first slot was overwritten', () => {
        const result = mergeTransactions({
            storedTxs: [tx('a'), tx('b'), tx('a', { blockHeight: 0 })],
            transactions: [tx('x'), tx('a', { blockHeight: 2 })],
            page: 1,
            perPage: 2,
        });

        expect(result?.map(t => [t?.txid, t?.blockHeight])).toEqual([
            ['x', 590093],
            ['b', 590093],
            ['a', 2],
        ]);
    });

    it('prepends new txs in reverse order', () => {
        const result = mergeTransactions({
            storedTxs: [tx('a')],
            transactions: [tx('x'), tx('y')],
        });

        expect(result?.map(t => t?.txid)).toEqual(['y', 'x', 'a']);
    });

    it.each([
        ['prepend first', ['x', 'a']],
        ['update first', ['a', 'x']],
    ])('combines prepend and update in one batch (%s)', (_, txids) => {
        const result = mergeTransactions({
            storedTxs: [tx('a', { blockHeight: 0 }), tx('b')],
            transactions: txids.map(txid => tx(txid, { blockHeight: 2 })),
        });

        expect(result?.map(t => [t?.txid, t?.blockHeight])).toEqual([
            ['x', 2],
            ['a', 2],
            ['b', 590093],
        ]);
    });
});
