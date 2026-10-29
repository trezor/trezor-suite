import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Transaction } from '@trezor/blockchain-link-types';
import { createMockDeps } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import { mockTransaction } from '../../mocks/mockTransaction';
import { testCreateTransactionStoreSqlite } from '../../mocks/testCreateTransactionStoreSqlite';
import { createTransactionRepository } from '../repository/createTransactionRepository';
import { migrateTransactionStoreSchema } from '../schema/migrateTransactionStoreSchema';
import type { FetchTransactionsPageParams } from '../source/transactionSource';
import type { TransactionStoreAccount } from '../transactionStoreTypes';
import {
    type SyncAccountTransactionsDeps,
    createSyncAccountTransactions,
} from './createSyncAccountTransactions';

const account: TransactionStoreAccount = {
    accountKey: 'btc-account',
    symbol: asNetworkSymbol('btc'),
    descriptor: 'xpub',
};

const toTransactions = (txids: string[]) =>
    txids.map((txid, index) => mockTransaction({ txid, blockHeight: 100 - index }));

/** The backend's history as pages, newest first. */
const setUp = async (pages: Transaction[][]) => {
    const sqlite = await testCreateTransactionStoreSqlite();
    migrateTransactionStoreSchema({ sqlite });
    const transactionRepository = createTransactionRepository({ sqlite });
    transactionRepository.replaceAccounts([account]);
    const deps = createMockDeps<SyncAccountTransactionsDeps>({
        transactionRepository,
        transactionSource: {
            fetchTransactionsPage: ({ page }: FetchTransactionsPageParams) =>
                Promise.resolve(
                    ok({ transactions: pages[page - 1] ?? [], hasNextPage: page < pages.length }),
                ),
        },
        now: () => 5000,
        onTransactionsStored: () => {},
    });

    return {
        sqlite,
        deps,
        transactionRepository,
        syncAccountTransactions: createSyncAccountTransactions(deps),
        getStoredTxids: () =>
            transactionRepository
                .selectTransactions({ accountKeys: [account.accountKey] })
                .map(({ txid }) => txid),
        getFetchedPages: () =>
            deps.transactionSource.fetchTransactionsPage.mock.calls.map(([{ page }]) => page),
    };
};

describe(createSyncAccountTransactions.name, () => {
    it('stores only the newest page the first time, so the account shows up fast', async () => {
        const { sqlite, syncAccountTransactions, transactionRepository, getFetchedPages, deps } =
            await setUp([toTransactions(['c', 'b']), toTransactions(['a'])]);

        const result = await syncAccountTransactions({ accountKey: 'btc-account', mode: 'latest' });

        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.onTransactionsStored).toHaveBeenCalledWith('btc-account');
        expect(getFetchedPages()).toEqual([1]);
        expect(deps.onTransactionsStored).toHaveBeenCalledWith('btc-account');
        expect(transactionRepository.selectSyncState('btc-account')).toMatchObject({
            isComplete: false,
            lastSyncedAt: 5000,
            lastError: null,
        });
        sqlite.dispose();
    });

    it('walks back only until it reaches history it already holds', async () => {
        const {
            sqlite,
            syncAccountTransactions,
            transactionRepository,
            getFetchedPages,
            getStoredTxids,
        } = await setUp([
            toTransactions(['e', 'd']),
            toTransactions(['c', 'b']),
            toTransactions(['a']),
        ]);
        transactionRepository.upsertTransactions({
            accountKey: 'btc-account',
            transactions: toTransactions(['c']),
        });
        transactionRepository.updateSyncState({
            accountKey: 'btc-account',
            isComplete: false,
            lastSyncedAt: 1,
            lastError: null,
        });

        await syncAccountTransactions({ accountKey: 'btc-account', mode: 'latest' });

        expect(getFetchedPages()).toEqual([1, 2]);
        expect(getStoredTxids()).toEqual(expect.arrayContaining(['e', 'd', 'c', 'b']));
        expect(getStoredTxids()).not.toContain('a');
        sqlite.dispose();
    });

    it('walks the whole history when asked for all of it, and marks it complete', async () => {
        const { sqlite, syncAccountTransactions, transactionRepository, getStoredTxids } =
            await setUp([toTransactions(['c', 'b']), toTransactions(['a'])]);

        await syncAccountTransactions({ accountKey: 'btc-account', mode: 'full' });

        expect(getStoredTxids()).toHaveLength(3);
        expect(transactionRepository.selectSyncState('btc-account').isComplete).toBe(true);
        sqlite.dispose();
    });

    it('asked for all of a complete history, only catches up with what is new', async () => {
        const { sqlite, syncAccountTransactions, getFetchedPages, deps } = await setUp([
            toTransactions(['c', 'b']),
            toTransactions(['a']),
        ]);
        await syncAccountTransactions({ accountKey: 'btc-account', mode: 'full' });
        deps.transactionSource.fetchTransactionsPage.mockClear();
        deps.onTransactionsStored.mockClear();

        const result = await syncAccountTransactions({ accountKey: 'btc-account', mode: 'full' });

        expect(getFetchedPages()).toEqual([1]);
        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.onTransactionsStored).not.toHaveBeenCalled();
        sqlite.dispose();
    });

    it('takes a backend that answers in one go as the whole history', async () => {
        const { sqlite, syncAccountTransactions, transactionRepository } = await setUp([
            toTransactions(['b', 'a']),
        ]);

        await syncAccountTransactions({ accountKey: 'btc-account', mode: 'latest' });

        expect(transactionRepository.selectSyncState('btc-account').isComplete).toBe(true);
        sqlite.dispose();
    });

    it("records the backend's failure and keeps what it holds", async () => {
        const { sqlite, syncAccountTransactions, transactionRepository, deps, getStoredTxids } =
            await setUp([toTransactions(['a'])]);
        await syncAccountTransactions({ accountKey: 'btc-account', mode: 'latest' });
        deps.transactionSource.fetchTransactionsPage.mockResolvedValue(err('BackendUnavailable'));

        const result = await syncAccountTransactions({ accountKey: 'btc-account', mode: 'latest' });

        expect(result).toEqual({ success: false, error: 'BackendUnavailable' });
        expect(getStoredTxids()).toEqual(['a']);
        expect(transactionRepository.selectSyncState('btc-account')).toMatchObject({
            isComplete: true,
            lastSyncedAt: 5000,
            lastError: 'BackendUnavailable',
        });
        sqlite.dispose();
    });

    it('writes nothing for an account removed while its page was on the way', async () => {
        const { sqlite, syncAccountTransactions, transactionRepository, deps } = await setUp([]);
        deps.transactionSource.fetchTransactionsPage.mockImplementation(() => {
            transactionRepository.replaceAccounts([]);

            return Promise.resolve(ok({ transactions: toTransactions(['a']), hasNextPage: false }));
        });

        const result = await syncAccountTransactions({ accountKey: 'btc-account', mode: 'latest' });

        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.onTransactionsStored).not.toHaveBeenCalled();
        expect(transactionRepository.selectTransactions({ accountKeys: ['btc-account'] })).toEqual(
            [],
        );
        sqlite.dispose();
    });
});
