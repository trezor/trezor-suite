import { useSelector } from 'react-redux';

import { selectIsTransactionStoreEnabled, suiteSettingsActions } from '@suite/settings';
import {
    type TransactionStoreRow,
    createTransactionStoreQuery,
} from '@suite-common/transaction-store';
import { selectAccounts } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { injectEnsureTransactionStore } from './createEnsureTransactionStore';
import { selectIsTransactionStoreActive } from './transactionStoreSelectors';
import { useTransactionStoreQuery } from './useTransactionStoreQuery';

/** Every stored account with its sync state and how many transactions it holds. */
const STORED_ACCOUNTS_QUERY = createTransactionStoreQuery(db =>
    db
        .selectFrom('accounts as a')
        .leftJoin('sync_state as s', 's.account_key', 'a.account_key')
        .select(eb => [
            'a.account_key',
            's.is_syncing',
            's.is_complete',
            's.last_synced_at',
            's.last_error',
            eb
                .selectFrom('transactions as t')
                .select(tb => tb.fn.countAll<number>().as('count'))
                .whereRef('t.account_key', '=', 'a.account_key')
                .as('count'),
        ]),
);

type StoredAccount = TransactionStoreRow<typeof STORED_ACCOUNTS_QUERY>;

const describeStatus = (storedAccount: StoredAccount | undefined) => {
    if (storedAccount === undefined) return 'Not registered';
    if (storedAccount.last_synced_at === null && storedAccount.is_syncing !== 1) {
        return storedAccount.last_error === null
            ? 'Not asked for yet'
            : `error · ${storedAccount.last_error}`;
    }

    const activity = storedAccount.is_syncing === 1 ? 'syncing' : 'idle';
    const history = storedAccount.is_complete === 1 ? 'whole history' : 'newest part';
    const syncedAt =
        storedAccount.last_synced_at === null
            ? 'never synced'
            : `synced ${new Date(storedAccount.last_synced_at).toLocaleTimeString()}`;
    const error = storedAccount.last_error === null ? '' : ` · ${storedAccount.last_error}`;

    return `${activity} · ${storedAccount.count ?? 0} transactions (${history}) · ${syncedAt}${error}`;
};

const getAccountTitle = (account: Account) =>
    `${account.symbol.toUpperCase()} #${account.index + 1} (${account.accountType})`;

/** What the worker holds and is doing, per account; mounted only while the store runs. */
const TransactionStoreAccounts = () => {
    const { ensureTransactionStore } = useServices(injectEnsureTransactionStore);
    const accounts = useSelector(selectAccounts).filter(account => account.visible);
    const storedAccounts = useTransactionStoreQuery(STORED_ACCOUNTS_QUERY);

    const requestFullHistory = (accountKey: string) =>
        ensureTransactionStore().transactionStore.requestFullHistory(accountKey);

    return (
        <>
            {accounts.map(account => (
                <SectionItem
                    key={account.key}
                    title={getAccountTitle(account)}
                    description={describeStatus(
                        storedAccounts?.find(({ account_key }) => account_key === account.key),
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
