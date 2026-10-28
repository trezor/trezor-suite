import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mock } from '@trezor/dependency-injection';
import { ok } from '@trezor/type-utils';

import {
    type TransactionStoreCompositionRootDeps,
    createTransactionStoreCompositionRoot,
} from './createTransactionStoreCompositionRoot';
import { mockTransaction } from '../mocks/mockTransaction';
import { testCreateTransactionStoreSqlite } from '../mocks/testCreateTransactionStoreSqlite';
import type { TransactionSource } from './source/transactionSource';
import type { TransactionStoreAccount } from './transactionStoreTypes';

const btcAccount: TransactionStoreAccount = {
    accountKey: 'btc',
    symbol: asNetworkSymbol('btc'),
    descriptor: 'xpub-btc',
};
const ltcAccount: TransactionStoreAccount = {
    accountKey: 'ltc',
    symbol: asNetworkSymbol('ltc'),
    descriptor: 'xpub-ltc',
};

const setUp = async () => {
    const sqlite = await testCreateTransactionStoreSqlite();
    const fetchTransactionsPage = mock<TransactionSource['fetchTransactionsPage']>(({ account }) =>
        Promise.resolve(
            ok({
                transactions: [mockTransaction({ txid: `${account.accountKey}-tx` })],
                hasNextPage: true,
            }),
        ),
    );
    const deps: TransactionStoreCompositionRootDeps = {
        sqlite,
        transactionSource: { fetchTransactionsPage },
        now: () => 1000,
        maxConcurrentJobsPerNetwork: 2,
    };
    const started = createTransactionStoreCompositionRoot(deps);

    if (!started.success) throw new Error('The store did not start');

    const store = started.payload;
    await store.setAccounts([btcAccount, ltcAccount]);
    const getFetchedAccountKeys = () =>
        fetchTransactionsPage.mock.calls.map(([{ account }]) => account.accountKey);

    return { sqlite, store, getFetchedAccountKeys };
};

describe('the transaction store, lazily', () => {
    it('downloads nothing for the accounts it is only told about', async () => {
        const { sqlite, store, getFetchedAccountKeys } = await setUp();

        await store.whenIdle();

        expect(getFetchedAccountKeys()).toEqual([]);
        sqlite.dispose();
    });

    it('downloads an account the first time it is asked for, and resolves once stored', async () => {
        const { sqlite, store, getFetchedAccountKeys } = await setUp();

        const [status] = await store.ensureSynced(['btc']);

        expect(status).toMatchObject({ accountKey: 'btc', lastSyncedAt: 1000, isComplete: false });
        expect(await store.selectTransactions({ accountKeys: ['btc'] })).toMatchObject([
            { txid: 'btc-tx' },
        ]);

        await store.ensureSynced(['btc']);

        expect(getFetchedAccountKeys()).toEqual(['btc']);
        sqlite.dispose();
    });

    it('refreshes only the accounts it was asked for before', async () => {
        const { sqlite, store, getFetchedAccountKeys } = await setUp();
        await store.ensureSynced(['btc']);

        await store.refreshAccounts(['btc', 'ltc']);
        await store.whenIdle();

        expect(getFetchedAccountKeys()).toEqual(['btc', 'btc']);
        sqlite.dispose();
    });

    it('drops an account the app no longer has, with what it downloaded', async () => {
        const { sqlite, store } = await setUp();
        await store.ensureSynced(['btc']);

        await store.setAccounts([ltcAccount]);

        expect(await store.selectTransactions({ accountKeys: ['btc'] })).toEqual([]);
        expect(await store.ensureSynced(['btc'])).toMatchObject([{ lastSyncedAt: null }]);
        sqlite.dispose();
    });
});
