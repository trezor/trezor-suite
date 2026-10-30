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
            account.descriptor === b[index]?.descriptor &&
            account.revision === b[index]?.revision,
    );

/**
 * The accounts the store may sync: visible ones of the enabled networks, each with what the app
 * last learned of its history. The app's own refresh (its interval, new blocks, mempool
 * notifications) changes the revision, which is the store's cue to sync the account. The same
 * reference while nothing of that changes.
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
            .map(({ key, symbol, descriptor, history, balance }) => ({
                accountKey: key,
                symbol,
                descriptor,
                // Counts include pending ones, so a confirmation is a change too.
                revision: `${history.total}:${history.unconfirmed}:${history.tokens ?? 0}:${balance}`,
            })),
    { memoizeOptions: { resultEqualityCheck: haveSameAccounts } },
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
