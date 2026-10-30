import { useSelector } from 'react-redux';

import { selectIsTransactionStoreEnabled, suiteSettingsActions } from '@suite/settings';
import { useQuery } from '@suite-common/react-query';
import type { AccountSyncStatus } from '@suite-common/transaction-store';
import { selectAccounts } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { injectGetTransactionStoreService } from './createTransactionStoreService';
import {
    transactionStoreQueryKeys,
    useAccountSyncStatuses,
    useTransactionStoreInvalidation,
} from './transactionStoreQueries';
import { selectIsTransactionStoreActive } from './transactionStoreSelectors';

const useStoredTransactionCounts = (accountKeys: string[]) => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);

    return useQuery({
        // Under the transactions key but no account's, so it refetches whenever any rows change.
        queryKey: [...transactionStoreQueryKeys.allTransactions(), { counts: accountKeys }],
        queryFn: async () => {
            const { transactionStore } = getTransactionStoreService();
            const counts = await Promise.all(
                accountKeys.map(accountKey =>
                    transactionStore.countTransactions({ accountKeys: [accountKey] }),
                ),
            );

            return new Map(accountKeys.map((accountKey, index) => [accountKey, counts[index]]));
        },
    });
};

const describeStatus = (status: AccountSyncStatus | undefined, count: number | undefined) => {
    if (status === undefined) return 'Not registered';
    if (status.lastSyncedAt === null && status.status === 'idle') return 'Not asked for yet';

    const history = status.isComplete ? 'whole history' : 'newest part';
    const syncedAt =
        status.lastSyncedAt === null
            ? 'never synced'
            : `synced ${new Date(status.lastSyncedAt).toLocaleTimeString()}`;
    const error = status.lastError === null ? '' : ` · ${status.lastError}`;

    return `${status.status} · ${count ?? 0} transactions (${history}) · ${syncedAt}${error}`;
};

const getAccountTitle = (account: Account) =>
    `${account.symbol.toUpperCase()} #${account.index + 1} (${account.accountType})`;

/** What the worker holds and is doing, per account; mounted only while the store runs. */
const TransactionStoreAccounts = () => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const accounts = useSelector(selectAccounts).filter(account => account.visible);
    const accountKeys = accounts.map(({ key }) => key);
    const { data: statuses } = useAccountSyncStatuses(accountKeys);
    const { data: counts } = useStoredTransactionCounts(accountKeys);
    useTransactionStoreInvalidation();

    const requestFullHistory = (accountKey: string) =>
        getTransactionStoreService().transactionStore.requestFullHistory(accountKey);

    return (
        <>
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
                            onClick={() => requestFullHistory(account.key)}
                        >
                            Fetch all
                        </SectionItem.Button>
                    }
                />
            ))}
        </>
    );
};

export const TransactionStoreDebug = () => {
    const { dispatch } = useServices(injectDispatch);
    const isEnabled = useSelector(selectIsTransactionStoreEnabled);
    const isActive = useSelector(selectIsTransactionStoreActive);

    const handleChange = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isTransactionStoreEnabled: isChecked }));

    return (
        <>
            <SectionItem
                title="Transaction store"
                description="Keeps transaction history in SQLite in its own worker: an account is downloaded the first time its list is opened, then refreshed whenever the app refreshes it."
                actions={
                    <Switch
                        isChecked={isEnabled}
                        onChange={handleChange}
                        data-testid="@settings/debug/transaction-store/switch"
                    />
                }
            />
            {isActive && <TransactionStoreAccounts />}
        </>
    );
};
