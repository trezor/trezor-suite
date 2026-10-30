import {
    type TokenDefinition,
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import type { KnownTokens, TransactionStoreAccount } from '@suite-common/transaction-store';
import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectAccounts,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type TransactionStoreFeedState = AccountsRootState &
    WalletSettingsRootState &
    TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<TransactionStoreFeedState>();

const haveSameAccounts = (a: TransactionStoreAccount[], b: TransactionStoreAccount[]) =>
    a.length === b.length &&
    a.every(
        (account, index) =>
            account.accountKey === b[index]?.accountKey &&
            account.symbol === b[index]?.symbol &&
            account.descriptor === b[index]?.descriptor,
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
 * The contracts the fake-token detector takes as legit: the definitions' own plus those the
 * user showed, less those the user hid, as `isFakeTokenPhishing` decides. `null` until the
 * definitions have loaded, as the app flags no fake token before either.
 */
const toKnownContracts = (symbol: NetworkSymbol, definition: TokenDefinition | undefined) => {
    if (definition?.data === undefined) return null;

    const toKey = (contract: string) => getContractAddressForNetworkSymbol(symbol, contract);
    const hidden = new Set(definition.hide.map(toKey));

    return [...new Set([...definition.data, ...definition.show.map(toKey)])]
        .filter(contract => !hidden.has(contract))
        .sort();
};

const haveSameContracts = (a: string[] | null, b: string[] | null) =>
    a === b || (a !== null && b !== null && a.join() === b.join());

const haveSameKnownTokens = (a: KnownTokens[], b: KnownTokens[]) =>
    a.length === b.length &&
    a.every(
        (knownTokens, index) =>
            knownTokens.symbol === b[index]?.symbol &&
            haveSameContracts(knownTokens.coin, b[index]?.coin ?? null) &&
            haveSameContracts(knownTokens.nft, b[index]?.nft ?? null),
    );

/**
 * The token definitions of the enabled networks that have them, which hiding suspicious
 * transactions needs in the store. The same reference until a list actually changes.
 */
export const selectTransactionStoreKnownTokens = createMemoizedSelector(
    [selectTokenDefinitions, selectEnabledNetworks],
    (tokenDefinitions, enabledNetworks): KnownTokens[] =>
        enabledNetworks
            .filter(symbol => getNetworkFeatures(symbol).includes('coin-definitions'))
            .map(symbol => ({
                symbol,
                coin: toKnownContracts(symbol, tokenDefinitions?.[symbol]?.coin),
                nft: toKnownContracts(symbol, tokenDefinitions?.[symbol]?.nft),
            })),
    { memoizeOptions: { resultEqualityCheck: haveSameKnownTokens } },
);
