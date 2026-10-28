import type { TransactionStoreAccount } from '@suite-common/transaction-store';
import {
    type AccountsRootState,
    type BlockchainRootState,
    type WalletSettingsRootState,
    selectAccounts,
    selectBlockchainState,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import type { CustomBackend } from '@suite-common/wallet-types';
import { getCustomBackends, getDefaultBackendType } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type TransactionStoreFeedState = AccountsRootState &
    BlockchainRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<TransactionStoreFeedState>();

const haveSameAccounts = (a: TransactionStoreAccount[], b: TransactionStoreAccount[]) =>
    a.length === b.length &&
    a.every(
        (account, index) =>
            account.accountKey === b[index]?.accountKey &&
            account.symbol === b[index]?.symbol &&
            account.descriptor === b[index]?.descriptor,
    );

const haveSameBackends = (a: CustomBackend[], b: CustomBackend[]) =>
    a.length === b.length &&
    a.every(
        (backend, index) =>
            backend.symbol === b[index]?.symbol &&
            backend.type === b[index]?.type &&
            backend.urls.join() === b[index]?.urls.join(),
    );

/**
 * The accounts the store syncs: visible ones of the enabled networks. The same reference while
 * they are the same accounts, however often balances change.
 */
export const selectTransactionStoreAccounts = createMemoizedSelector(
    [selectAccounts, selectEnabledNetworks],
    (accounts, enabledNetworks): TransactionStoreAccount[] =>
        accounts
            .filter(
                account =>
                    account.visible &&
                    // Coinjoin accounts are synced by their own backend, not blockchain-link.
                    account.backendType !== 'coinjoin' &&
                    enabledNetworks.includes(account.symbol),
            )
            .map(account => ({
                accountKey: account.key,
                symbol: account.symbol,
                descriptor: account.descriptor,
            })),
    { memoizeOptions: { resultEqualityCheck: haveSameAccounts } },
);

type AccountRevisions = ReadonlyMap<string, string>;

const haveSameRevisions = (a: AccountRevisions, b: AccountRevisions) =>
    a.size === b.size && [...a].every(([accountKey, revision]) => b.get(accountKey) === revision);

/**
 * What the app last learned of each synced account's history. The app's own refresh (its
 * interval, new blocks, mempool notifications) updates these, so a change is the store's cue to
 * sync that account, and an account the app found unchanged costs the store nothing.
 */
export const selectTransactionStoreAccountRevisions = createMemoizedSelector(
    [selectAccounts, selectTransactionStoreAccounts],
    (accounts, storeAccounts): AccountRevisions => {
        const storeAccountKeys = new Set(storeAccounts.map(({ accountKey }) => accountKey));

        return new Map(
            accounts
                .filter(account => storeAccountKeys.has(account.key))
                .map(({ key, history, balance }) => [
                    key,
                    // Counts include pending ones, so a confirmation is a change too.
                    `${history.total}:${history.unconfirmed}:${history.tokens ?? 0}:${balance}`,
                ]),
        );
    },
    { memoizeOptions: { resultEqualityCheck: haveSameRevisions } },
);

/**
 * Each enabled network's backend: the custom one, or its default type without URLs, which the
 * service fills in from Connect. The same reference while unchanged, though the blockchain state
 * changes on every block.
 */
export const selectTransactionStoreBackends = createMemoizedSelector(
    [selectBlockchainState, selectEnabledNetworks],
    (blockchain, enabledNetworks): CustomBackend[] =>
        enabledNetworks.map(
            symbol =>
                getCustomBackends(blockchain, [symbol])[0] ?? {
                    symbol,
                    type: getDefaultBackendType(symbol),
                    urls: [],
                },
        ),
    { memoizeOptions: { resultEqualityCheck: haveSameBackends } },
);
