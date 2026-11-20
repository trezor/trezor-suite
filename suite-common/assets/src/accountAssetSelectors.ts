import {
    type WalletAssetKey,
    getWalletAssetKey,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsTokenFiatRateDisallowed,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isTestnet } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

import {
    type HomeAssetTableState,
    selectShownWalletAssetKeys,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetNetworkSymbol,
} from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

export const selectAccountCoinAssetKey = createMemoizedSelector(
    [(state: HomeAssetTableState, accountKey: AccountKey) => selectAccountByKey(state, accountKey)],
    account =>
        account === null
            ? undefined
            : getWalletAssetKey({
                  deviceState: account.deviceState,
                  networkSymbol: account.symbol,
                  contractAddress: undefined,
              }),
);

/**
 * Whether the asset's missing rate is still on its way. A testnet is never priced, a token whose
 * rate is not fetched never gets one, and a failed fetch has given up, so none of them is waited for.
 */
const isAssetRatePending = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    accountKey: AccountKey | undefined,
) => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey, false, accountKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey, false, accountKey);

    return (
        networkSymbol !== undefined &&
        !isTestnet(networkSymbol) &&
        !selectIsTokenFiatRateDisallowed(state, networkSymbol, contractAddress) &&
        !selectCurrentFiatRates(state)?.[
            getFiatRateKey(networkSymbol, selectBaseCurrency(state), contractAddress)
        ]?.error
    );
};

const isAssetUnpriced = (
    state: HomeAssetTableState,
    assetKey: WalletAssetKey,
    accountKey: AccountKey | undefined,
) => selectWalletAssetFiatValue(state, assetKey, false, accountKey) === undefined;

/** Whether a rate the table still lacks is on its way, so its total is worth waiting for. */
export const selectIsAssetTableRatePending = (
    state: HomeAssetTableState,
    accountKey?: AccountKey,
) =>
    selectShownWalletAssetKeys(state, accountKey).some(
        assetKey =>
            isAssetUnpriced(state, assetKey, accountKey) &&
            isAssetRatePending(state, assetKey, accountKey),
    );

/**
 * Whether the total leaves out a held asset that has no rate to come. One still on its way is
 * not counted: the total is only short of it until it lands.
 */
export const selectIsAssetTableTotalIncomplete = (
    state: HomeAssetTableState,
    accountKey?: AccountKey,
) => {
    const assetKeys = selectShownWalletAssetKeys(state, accountKey);

    return (
        assetKeys.some(assetKey => !isAssetUnpriced(state, assetKey, accountKey)) &&
        assetKeys.some(
            assetKey =>
                isAssetUnpriced(state, assetKey, accountKey) &&
                !isAssetRatePending(state, assetKey, accountKey),
        )
    );
};
