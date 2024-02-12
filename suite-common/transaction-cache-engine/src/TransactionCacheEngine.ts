/* eslint-disable require-await */
import { A, D, pipe } from '@mobily/ts-belt';

import TrezorConnect, { AccountInfo, AccountTransaction } from '@trezor/connect';
import { getNetworkType } from '@suite-common/wallet-config';

import {
    EnsureSingleRunningInstance,
    TrackRunningTransactionFetches,
    WaitUntilFetchIsFinished,
    getAccountUniqueKey,
} from './utils/asyncUtils';
import { AccountUniqueKey, AccountUniqueParams, TransactionCacheEngineStorage } from './types';
import { getAccountBalanceHistory } from './utils/balanceHistory';

const DEBUG_ENABLED = false;
const debugLog = (...args: any[]) => {
    if (DEBUG_ENABLED) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
};

const TRANSACTION_ADD_ACCOUNT_PAGE_SIZE = 100;
const TRANSACTION_POLL_PAGE_SIZE = 3;
const TRANSACTION_INIT_PAGE_SIZE = 5;
const TRANSACTION_POLL_INTERVAL_MS = 60_000;

export class TransactionCacheEngine {
    private initPromise: Promise<void>;
    private storage: TransactionCacheEngineStorage;
    private periodicFetchesTimeoutIds: Record<AccountUniqueKey, ReturnType<typeof setTimeout>> = {};

    constructor({ storage }: { storage: TransactionCacheEngineStorage }) {
        this.storage = storage;
        this.initPromise = this.init();
    }

    private async init() {
        debugLog('Initializing TransactionCacheEngine');

        const accounts = await this.storage.getAccounts();

        // Refetch transactions that happened when app was closed.
        // Used allSettled because we don't need to care if some fetches will fail on init. We will fetch them by periodic checks.
        await Promise.allSettled(
            accounts.map(account =>
                this.fetchAndSaveAllMissingAccountTransactions({
                    ...account,
                    pageSize: TRANSACTION_INIT_PAGE_SIZE,
                }),
            ),
        );

        accounts.forEach(account => this.watchForNewTransactions(account));
    }

    @EnsureSingleRunningInstance()
    @TrackRunningTransactionFetches()
    async addAccount({ coin, descriptor }: AccountUniqueParams) {
        await this.initPromise;
        if (await this.accountExists({ coin, descriptor })) {
            return;
        }

        await this.storage.saveAccount({ coin, descriptor });
        await this.fetchAndSaveAllMissingAccountTransactions({
            coin,
            descriptor,
            pageSize: TRANSACTION_ADD_ACCOUNT_PAGE_SIZE,
        });
        this.watchForNewTransactions({ coin, descriptor });
    }

    async accountExists({ coin, descriptor }: AccountUniqueParams) {
        await this.initPromise;

        return this.storage.accountExist({ coin, descriptor });
    }

    async removeAccount({ coin, descriptor }: AccountUniqueParams) {
        await this.initPromise;
        await this.storage.removeAccount({ coin, descriptor });
        await this.stopWatchingForNewTransactions({ coin, descriptor });
    }

    @WaitUntilFetchIsFinished()
    public async getTransactions({ coin, descriptor }: AccountUniqueParams) {
        debugLog(`getTransactions for ${coin} - ${descriptor}`);
        await this.initPromise;

        return this.storage.getTransactions({ coin, descriptor });
    }

    @EnsureSingleRunningInstance()
    private async fetchAndSaveAllMissingAccountTransactions({
        coin,
        descriptor,
        pageSize,
    }: AccountUniqueParams & { pageSize: number }) {
        await this.initPromise;
        debugLog(`Fetching transactions for ${coin} - ${descriptor}`, { pageSize });
        if (!(await this.accountExists({ coin, descriptor }))) {
            throw new Error(
                'Account not registered. Please register it first using TransactionCacheEngine.addAccount',
            );
        }

        const allTransactions: AccountTransaction[] = [];

        let page = 0;
        // marker is used instead of page for ripple (cursor based pagination)
        let marker: AccountInfo['marker'] | undefined;
        const networkType = getNetworkType(coin);

        while (true) {
            page += 1;

            const result = await TrezorConnect.getAccountInfo({
                coin,
                descriptor,
                details: 'txs',
                page,
                pageSize,
                ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
            });
            if (!result.success) {
                throw new Error(result.payload.error);
            }

            marker = result.payload.marker;

            const pageTransactions = result.payload.history.transactions ?? [];

            allTransactions.push(...pageTransactions);

            const txids = pageTransactions.map(tx => tx.txid);
            const numberOfExistingTransactions = await this.storage.getNumberOfExistingTransactions(
                {
                    coin,
                    descriptor,
                    txids,
                },
            );

            // We check if all transactions from latest page are already saved in the storage.
            // If yes, We have fetched all transactions that are not already saved in the storage.
            if (numberOfExistingTransactions === txids.length) {
                break;
            }

            if (
                networkType !== 'ripple' &&
                result.payload.page?.total === result.payload.page?.index
            ) {
                break;
            }

            if (networkType === 'ripple' && !result.payload.marker) {
                break;
            }
        }

        if (!(await this.accountExists({ coin, descriptor }))) {
            console.warn('Account was removed while fetching transactions', coin, descriptor);
            return;
        }

        debugLog(
            `Sending ${allTransactions.length} transactions to storage for ${coin} - ${descriptor}`,
        );
        await this.storage.saveTransactions({
            account: { coin, descriptor },
            transactions: allTransactions,
        });
    }

    @WaitUntilFetchIsFinished()
    async getAccountBalanceHistory(account: AccountUniqueParams) {
        if (!(await this.accountExists(account))) {
            throw new Error(
                'Account not registered. Please register it first using TransactionCacheEngine.addAccount',
            );
        }

        const transactions = await this.getTransactions(account);

        return getAccountBalanceHistory({ transactions, coin: account.coin });
    }

    private watchForNewTransactions({ coin, descriptor }: AccountUniqueParams) {
        debugLog(`Watching for new transactions for ${coin} - ${descriptor}`);

        // We need to start periodic check first, because it's subscribing to new transactions isn't always reliable, but it's useful because it's instant.
        this.startPeriodicallyCheckNewTransactions({ coin, descriptor });

        // We don't need to pass specific account here, because it's easier to just resubscribe to all accounts.
        this.subscribeToNewTransactionsAllAccounts();
    }

    private stopWatchingForNewTransactions({ coin, descriptor }: AccountUniqueParams) {
        debugLog(`Stop watching for new transactions for ${coin} - ${descriptor}`);

        this.stopPeriodicallyCheckNewTransactions({ coin, descriptor });
        this.unsubscribeFromNewTransactions({ coin, descriptor });
    }

    private async startPeriodicallyCheckNewTransactions({ coin, descriptor }: AccountUniqueParams) {
        debugLog(`Start periodic check for new transactions for ${coin} - ${descriptor}`);

        const accountKey = getAccountUniqueKey({ coin, descriptor });

        const isCheckAlreadyRunning = !!this.periodicFetchesTimeoutIds[accountKey];
        const isAccountRegistered = await this.accountExists({ coin, descriptor });

        if (!isAccountRegistered || isCheckAlreadyRunning) {
            debugLog(
                `Periodic fetch of new transactions for ${coin} - ${descriptor} is already running`,
            );
            return;
        }

        this.periodicFetchesTimeoutIds[accountKey] = setTimeout(async () => {
            try {
                await this.fetchAndSaveAllMissingAccountTransactions({
                    coin,
                    descriptor,
                    pageSize: TRANSACTION_POLL_PAGE_SIZE,
                });
            } catch (error) {
                // We don't need to handle this error, because it will just run again in next interval.
                debugLog(
                    `Periodic fetch of new transactions error for ${coin} - ${descriptor} =>`,
                    error,
                );
            }

            if (!this.periodicFetchesTimeoutIds[accountKey]) {
                // Account was removed while fetching transactions.
                return;
            }

            delete this.periodicFetchesTimeoutIds[accountKey];
            await this.startPeriodicallyCheckNewTransactions({ coin, descriptor });
        }, TRANSACTION_POLL_INTERVAL_MS);
    }

    private async stopPeriodicallyCheckNewTransactions({ coin, descriptor }: AccountUniqueParams) {
        debugLog(`Stop periodic check for new transactions for ${coin} - ${descriptor}`);

        const accountKey = getAccountUniqueKey({ coin, descriptor });
        const timeoutId = this.periodicFetchesTimeoutIds[accountKey];

        if (timeoutId) {
            clearTimeout(timeoutId);
            delete this.periodicFetchesTimeoutIds[accountKey];
        }
    }

    private async subscribeToNewTransactionsAllAccounts() {
        await this.initPromise;

        const accounts = await this.storage.getAccounts();
        const accountsByCoin = A.groupBy(accounts, account => account.coin);

        pipe(
            accountsByCoin,
            D.keys,
            A.forEach(coin => {
                const accountDescriptors = accountsByCoin[coin]?.map(({ descriptor }) => ({
                    descriptor,
                }));

                TrezorConnect.blockchainSubscribe({
                    accounts: accountDescriptors,
                    coin,
                });
            }),
        );
    }

    private async unsubscribeFromNewTransactions({ coin, descriptor }: AccountUniqueParams) {
        await this.initPromise;

        TrezorConnect.blockchainUnsubscribe({
            accounts: [{ descriptor }],
            coin,
        });
    }
}
