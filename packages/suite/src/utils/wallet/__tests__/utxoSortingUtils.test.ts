import { testMocks } from '@suite-common/test-utils';

import { sortUtxos } from '../utxoSortingUtils';

const UTXOS = [
    testMocks.getUtxo({ amount: '1', blockHeight: undefined, txid: 'txid1', vout: 0 }),
    testMocks.getUtxo({ amount: '2', blockHeight: undefined, txid: 'txid2', vout: 1 }),
    testMocks.getUtxo({ amount: '2', blockHeight: 1, txid: 'txid2', vout: 0 }),
    testMocks.getUtxo({ amount: '2', blockHeight: 2, txid: 'txid3', vout: 0 }),
];

const ACCOUNT_TRANSACTIONS = [
    testMocks.getWalletTransaction({ txid: 'txid1', blockTime: undefined }),
    testMocks.getWalletTransaction({ txid: 'txid2', blockTime: 1 }),
    testMocks.getWalletTransaction({ txid: 'txid3', blockTime: 2 }),
];

const findTx = (txid: string) => ACCOUNT_TRANSACTIONS.find(tx => tx.txid === txid);

describe(sortUtxos.name, () => {
    it('sorts UTXOs by newest first', () => {
        const sortedUtxos = sortUtxos(UTXOS, 'newestFirst', ACCOUNT_TRANSACTIONS);
        expect(
            sortedUtxos.map(it => [
                it.blockHeight ?? findTx(it.txid)?.blockTime,
                `${it.txid}:${it.vout}`, // for stable sorting
            ]),
        ).toEqual([
            [2, 'txid3:0'],
            [1, 'txid2:1'],
            [1, 'txid2:0'],
            [undefined, 'txid1:0'],
        ]);
    });

    it('sorts UTXOs by oldest first', () => {
        const sortedUtxos = sortUtxos(UTXOS, 'oldestFirst', ACCOUNT_TRANSACTIONS);
        expect(
            sortedUtxos.map(it => [
                it.blockHeight ?? findTx(it.txid)?.blockTime,
                `${it.txid}:${it.vout}`, // for stable sorting
            ]),
        ).toEqual([
            [undefined, 'txid1:0'],
            [1, 'txid2:0'],
            [1, 'txid2:1'],
            [2, 'txid3:0'],
        ]);
    });

    it('sorts by size, largest first', () => {
        const sortedUtxos = sortUtxos(UTXOS.slice(0, 2), 'largestFirst', ACCOUNT_TRANSACTIONS);
        expect(sortedUtxos.map(it => it.amount)).toEqual(['2', '1']);
    });

    it('sorts by size, smallest first', () => {
        const sortedUtxos = sortUtxos(UTXOS.slice(0, 2), 'smallestFirst', ACCOUNT_TRANSACTIONS);
        expect(sortedUtxos.map(it => it.amount)).toEqual(['1', '2']);
    });

    it('sorts by secondary sorting by `txid` and `vout` in case of same values', () => {
        const sortedUtxos = sortUtxos(UTXOS.slice(1, 4), 'smallestFirst', ACCOUNT_TRANSACTIONS);
        expect(sortedUtxos.map(it => `${it.txid}:${it.vout}`)).toEqual([
            'txid2:0',
            'txid2:1',
            'txid3:0',
        ]);
    });

    it('returns the original array if utxoSorting is undefined', () => {
        const sortedUtxos = sortUtxos(UTXOS, undefined, ACCOUNT_TRANSACTIONS);
        expect(sortedUtxos).toEqual(UTXOS);
    });
});
