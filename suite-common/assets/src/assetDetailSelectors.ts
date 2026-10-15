import { shallowEqual } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type TransactionsRootState,
    type WalletAssetKey,
    getWalletAssetKey,
    selectDeviceAssetAccounts,
    selectTransactions,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { sortByBlockHeight } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
} from './homeAssetTableSelectors';

export type AssetDetailState = HomeAssetTableState & TransactionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetDetailState>();

const NO_ACCOUNT_KEYS: readonly AccountKey[] = [];

/** The asset the detail screen shows: the one the route names, on the wallet on screen. */
export const selectAssetDetailKey = (
    state: AssetDetailState,
    symbol: NetworkSymbol,
    contractAddress?: TokenAddress,
): WalletAssetKey | undefined => {
    const deviceState = selectSelectedDevice(state)?.state?.staticSessionId;

    return deviceState === undefined
        ? undefined
        : getWalletAssetKey({ deviceState, symbol, contractAddress });
};

type AssetAccountKeys = {
    /** Every account the asset can be on, empty ones included: they can still have a history. */
    all: readonly AccountKey[];
    /** The accounts holding some of it, which is what "on N accounts" counts. */
    holding: readonly AccountKey[];
};

const selectAccountKeysByAssetKey = createMemoizedSelector(
    [selectDeviceAssetAccounts],
    (assetAccounts): ReadonlyMap<WalletAssetKey, AssetAccountKeys> => {
        const byAssetKey = new Map<WalletAssetKey, { all: AccountKey[]; holding: AccountKey[] }>();

        assetAccounts.forEach(({ assetKey, accountKey, cryptoBalance }) => {
            const keys = byAssetKey.get(assetKey) ?? { all: [], holding: [] };

            keys.all.push(accountKey);
            if (new BigNumber(cryptoBalance).gt(0)) {
                keys.holding.push(accountKey);
            }
            byAssetKey.set(assetKey, keys);
        });

        return byAssetKey;
    },
);

export const selectWalletAssetAccountKeys = (state: AssetDetailState, assetKey: WalletAssetKey) =>
    selectAccountKeysByAssetKey(state).get(assetKey)?.all ?? NO_ACCOUNT_KEYS;

export const selectWalletAssetHoldingAccountCount = (
    state: AssetDetailState,
    assetKey: WalletAssetKey,
) => selectAccountKeysByAssetKey(state).get(assetKey)?.holding.length ?? 0;

const isTransferOf = (transaction: WalletAccountTransaction, contractAddress: TokenAddress) =>
    transaction.tokens.some(
        token => token.contract.toLowerCase() === contractAddress.toLowerCase(),
    );

/**
 * The asset's transactions across every account it can be on, newest first: for a coin, the
 * accounts' whole history; for a token, the transactions that move it.
 */
export const selectWalletAssetTransactions = createMemoizedSelector(
    [
        selectWalletAssetAccountKeys,
        selectTransactions,
        (state: AssetDetailState, assetKey: WalletAssetKey) =>
            selectWalletAssetContractAddress(state, assetKey),
    ],
    (accountKeys, transactionsByAccount, contractAddress): readonly WalletAccountTransaction[] =>
        returnStableArrayIfEmpty(
            accountKeys
                .flatMap(accountKey =>
                    (transactionsByAccount[accountKey] ?? []).filter(
                        (transaction): transaction is WalletAccountTransaction =>
                            !!transaction &&
                            (contractAddress === undefined ||
                                isTransferOf(transaction, contractAddress)),
                    ),
                )
                .sort(sortByBlockHeight),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);
