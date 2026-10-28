import { useSelector } from 'react-redux';

import { useQuery } from '@suite-common/react-query';
import type { AccountSyncStatus } from '@suite-common/transaction-store';
import { selectAccounts } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';

import { injectGetTransactionStoreService } from './createTransactionStoreService';
import { useAccountSyncStatuses, useTransactionStoreInvalidation } from './transactionStoreQueries';

const useStoredTransactionCounts = () => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);

    return useQuery({
        // Under the transactions key, so it refetches whenever rows change.
        queryKey: ['transaction-store', 'transactions', 'counts'],
        queryFn: async () => {
            const result = await getTransactionStoreService().transactionStore.query({
                sql: 'SELECT account_key, COUNT(*) AS count FROM transactions GROUP BY account_key',
                parameters: [],
            });

            return new Map(
                result.success ? result.payload.map(row => [row.account_key, row.count]) : [],
            );
        },
    });
};

const describeStatus = (status: AccountSyncStatus | undefined, count: unknown) => {
    if (status === undefined) return 'Not registered';

    const history = status.isComplete ? 'whole history' : 'newest part';
    const syncedAt =
        status.lastSyncedAt === null
            ? 'never synced'
            : `synced ${new Date(status.lastSyncedAt).toLocaleTimeString()}`;
    const error = status.lastError === null ? '' : ` · ${status.lastError}`;

    return `${status.status} · ${String(count ?? 0)} transactions (${history}) · ${syncedAt}${error}`;
};

const getAccountTitle = (account: Account) =>
    `${account.symbol.toUpperCase()} #${account.index + 1} (${account.accountType})`;

/** What the transaction store's worker holds and is doing, per account. */
export const TransactionStoreDebug = () => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const accounts = useSelector(selectAccounts).filter(account => account.visible);
    const { data: statuses } = useAccountSyncStatuses(accounts.map(({ key }) => key));
    const { data: counts } = useStoredTransactionCounts();
    useTransactionStoreInvalidation();

    const requestFullSync = (accountKeys: string[]) =>
        getTransactionStoreService().transactionStore.requestSync({ accountKeys, mode: 'full' });

    return (
        <>
            <SectionItem
                title="Transaction store"
                description="Runs in its own worker while debug mode is on: syncs every account of the enabled networks into SQLite (OPFS) and refreshes on new blocks."
                actions={
                    <SectionItem.Button
                        size="small"
                        onClick={() => requestFullSync(accounts.map(({ key }) => key))}
                    >
                        Fetch all history
                    </SectionItem.Button>
                }
            />
            {accounts.map(account => (
                <SectionItem
                    key={account.key}
                    title={getAccountTitle(account)}
                    description={describeStatus(
                        statuses?.find(({ accountKey }) => accountKey === account.key),
                        counts?.get(account.key),
                    )}
                    actions={
                        <SectionItem.Button
                            size="small"
                            priority="secondary"
                            onClick={() => requestFullSync([account.key])}
                        >
                            Fetch all
                        </SectionItem.Button>
                    }
                />
            ))}
        </>
    );
};
