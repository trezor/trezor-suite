import { getTxsPerPage } from '@suite-common/suite-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type TokenAddress,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';

import { type TransactionsState } from '../transactionsReducerTypes';
import { type AccountsTransactions } from './accountsTransactionsSelectors';
import {
    type FetchAllTransactionsForAccount,
    type FetchTransactionsPage,
    type TransactionRetrieverDeps,
    createTransactionRetriever,
} from './createTransactionRetriever';

type FetchStatus = TransactionsState['fetchStatusDetail'][AccountKey];

const mockAccount = (descriptor: string) =>
    mockWalletAccount({
        symbol: asNetworkSymbol('btc'),
        descriptor: asAccountDescriptor(descriptor),
    });

const fresh = mockAccount('fresh');
const halfway = mockAccount('halfway');
const resized = mockAccount('resized');
const loaded = mockAccount('loaded');
const coinjoin = { ...mockAccount('coinjoin'), backendType: 'coinjoin' } as Account;
const ACCOUNTS: Account[] = [fresh, halfway, resized, loaded, coinjoin];
const GONE = 'gone' as AccountKey;

const PER_PAGE = getTxsPerPage(fresh.networkType);

const FETCH_STATUSES: Partial<Record<AccountKey, FetchStatus>> = {
    [halfway.key]: { status: 'idle', error: null, fetchedPages: { count: 2, perPage: PER_PAGE } },
    [resized.key]: {
        status: 'idle',
        error: null,
        fetchedPages: { count: 2, perPage: PER_PAGE * 2 },
    },
    [loaded.key]: { status: 'idle', error: null, areAllTransactionsLoaded: true },
};

type CreateDepsParams = {
    /** How many page fetches it takes until the store holds the asked page. */
    fetchesUntilReady?: number;
    fetchTransactionsPage?: FetchTransactionsPage;
    fetchAllTransactionsForAccount?: FetchAllTransactionsForAccount;
};

const createDeps = ({
    fetchesUntilReady = 0,
    fetchTransactionsPage = () => Promise.resolve('ALREADY_FETCHED'),
    fetchAllTransactionsForAccount = () => Promise.resolve([]),
}: CreateDepsParams = {}) => {
    let fetchCount = 0;

    return createMockDeps<TransactionRetrieverDeps>({
        getAccount: asGetter(
            (accountKey: AccountKey) =>
                ACCOUNTS.find(account => account.key === accountKey) ?? null,
        ),
        getTransactionsFetchStatus: asGetter(
            (accountKey: AccountKey) => FETCH_STATUSES[accountKey],
        ),
        getAccountsTransactions: asGetter(
            (_accountKeys: readonly AccountKey[], _contractAddress?: TokenAddress) =>
                ({
                    transactions: [],
                    confirmedCount: 0,
                    isComplete: fetchCount >= fetchesUntilReady,
                }) satisfies AccountsTransactions,
        ),
        fetchTransactionsPage: params => {
            fetchCount += 1;

            return fetchTransactionsPage(params);
        },
        fetchAllTransactionsForAccount,
    });
};

describe('retrievePage', () => {
    const retrievePageOf = (deps: TransactionRetrieverDeps, accountKeys: AccountKey[]) =>
        createTransactionRetriever(deps).retrievePage({ accountKeys, page: 1, perPage: PER_PAGE });

    it('fetches nothing while the page is already in the store', async () => {
        const deps = createDeps();

        await retrievePageOf(deps, [fresh.key]);

        expect(deps.fetchTransactionsPage).not.toHaveBeenCalled();
    });

    it('fetches the next page of each account still loading', async () => {
        const deps = createDeps({ fetchesUntilReady: 3 });

        await retrievePageOf(deps, [fresh.key, halfway.key, resized.key, loaded.key, GONE]);

        expect(deps.fetchTransactionsPage.mock.calls).toEqual([
            [{ accountKey: fresh.key, page: 1, perPage: PER_PAGE, noLoading: true }],
            [{ accountKey: halfway.key, page: 3, perPage: PER_PAGE, noLoading: true }],
            // Its pages were fetched at another size, so they do not count.
            [{ accountKey: resized.key, page: 1, perPage: PER_PAGE, noLoading: true }],
        ]);
    });

    it('keeps fetching until the page is in the store', async () => {
        const deps = createDeps({ fetchesUntilReady: 3 });

        await retrievePageOf(deps, [fresh.key]);

        expect(deps.fetchTransactionsPage).toHaveBeenCalledTimes(3);
    });

    it('shares a page request between walks running at once', async () => {
        let isStored = false;
        let settleFetch = () => {};
        const deps = createMockDeps<TransactionRetrieverDeps>({
            getAccount: asGetter(
                (accountKey: AccountKey) =>
                    ACCOUNTS.find(account => account.key === accountKey) ?? null,
            ),
            getTransactionsFetchStatus: asGetter(
                (accountKey: AccountKey) => FETCH_STATUSES[accountKey],
            ),
            getAccountsTransactions: asGetter(
                () =>
                    ({
                        transactions: [],
                        confirmedCount: 0,
                        isComplete: isStored,
                    }) satisfies AccountsTransactions,
            ),
            fetchTransactionsPage: () =>
                new Promise<'ALREADY_FETCHED'>(resolve => {
                    settleFetch = () => {
                        isStored = true;
                        resolve('ALREADY_FETCHED');
                    };
                }),
            fetchAllTransactionsForAccount: null,
        });
        const retriever = createTransactionRetriever(deps);

        const first = retriever.retrievePage({
            accountKeys: [fresh.key],
            page: 1,
            perPage: PER_PAGE,
        });
        const second = retriever.retrievePage({
            accountKeys: [fresh.key],
            page: 2,
            perPage: PER_PAGE,
        });
        settleFetch();
        await Promise.all([first, second]);

        expect(deps.fetchTransactionsPage).toHaveBeenCalledTimes(1);
    });

    it('stops once the caller aborts', async () => {
        const deps = createDeps({ fetchesUntilReady: 1 });
        const controller = new AbortController();
        controller.abort('left the screen');

        await expect(
            createTransactionRetriever(deps).retrievePage({
                accountKeys: [fresh.key],
                page: 1,
                perPage: PER_PAGE,
                signal: controller.signal,
            }),
        ).rejects.toBe('left the screen');
        expect(deps.fetchTransactionsPage).not.toHaveBeenCalled();
    });

    it('fails when a fetch fails', async () => {
        const failure = new Error('backend down');
        const deps = createDeps({
            fetchesUntilReady: 1,
            fetchTransactionsPage: () => Promise.reject(failure),
        });

        await expect(retrievePageOf(deps, [fresh.key])).rejects.toBe(failure);
    });
});

describe('retrieveAll', () => {
    it('loads the whole history of each account not loaded yet', async () => {
        const deps = createDeps();

        await createTransactionRetriever(deps).retrieveAll({
            accountKeys: [fresh.key, loaded.key, coinjoin.key, GONE],
        });

        expect(deps.fetchAllTransactionsForAccount.mock.calls).toEqual([
            [{ accountKey: fresh.key, noLoading: true }],
        ]);
    });

    it('fails when a load fails', async () => {
        const failure = new Error('backend down');
        const deps = createDeps({ fetchAllTransactionsForAccount: () => Promise.reject(failure) });

        await expect(
            createTransactionRetriever(deps).retrieveAll({ accountKeys: [fresh.key] }),
        ).rejects.toBe(failure);
    });
});
