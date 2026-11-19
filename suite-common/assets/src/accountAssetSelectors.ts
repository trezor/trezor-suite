import { shallowEqual } from 'react-redux';

import { selectCountedStakingPositionEntriesByAccount } from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    isSupportedStakingNetworkSymbol,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsTokenFiatRateDisallowed,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isPositiveBalance, isTestnet } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { selectAssetAccounts, selectHiddenAssetAccountKeySet } from './assetAccountsSelectors';
import {
    type HomeAssetTableState,
    selectAreHomeAssetSmallBalancesDisplayed,
    selectSmallBalanceThreshold,
} from './homeAssetTableSelectors';
import { type WalletAsset, groupWalletAssets } from './homeAssetTableUtils';
import {
    byFiatThenCryptoBalance,
    fiatValuesResultEquality,
    formatStakingTotal,
    getStakingRatio,
    pickRates,
    priceAssets,
    ratesResultEquality,
    smallBalanceSummaryResultEquality,
    sumStakingPositionAmounts,
    summarizeSmallBalances,
} from './walletAssetValueUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const ZERO = new BigNumber(0);

export type AccountAsset = WalletAsset & {
    kind: 'coin' | 'token';
    /** Undefined while nothing prices the asset. */
    fiatValue: BigNumber | undefined;
};

/**
 * The account's share of the wallet's assets, without the tokens the Home table hides. An asset
 * account keeps its identity while it is unchanged, so another account's sync hands back the same rows.
 */
const selectShownAccountAssetAccounts = createMemoizedSelector(
    [
        selectAssetAccounts,
        selectHiddenAssetAccountKeySet,
        (_state: HomeAssetTableState, accountKey: AccountKey) => accountKey,
    ],
    (assetAccounts, hiddenKeys, accountKey) =>
        returnStableArrayIfEmpty(
            assetAccounts.filter(
                assetAccount =>
                    assetAccount.accountKey === accountKey &&
                    !hiddenKeys.has(assetAccount.assetAccountKey),
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const selectAccountWalletAssets = createMemoizedSelector(
    [selectShownAccountAssetAccounts],
    groupWalletAssets,
);

const selectAccountAssetRates = createMemoizedSelector(
    [selectAccountWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
    pickRates,
    ratesResultEquality,
);

const selectAccountAssetValues = createMemoizedSelector(
    [selectAccountWalletAssets, selectAccountAssetRates],
    priceAssets,
    fiatValuesResultEquality,
);

/** One account's assets, sorted as the Home table sorts the wallet's. */
export const selectAccountAssets = createMemoizedSelector(
    [selectAccountWalletAssets, selectAccountAssetValues],
    (assets, values): readonly AccountAsset[] => {
        const compare = byFiatThenCryptoBalance(assets, values);

        return returnStableArrayIfEmpty(
            [...assets.values()]
                .sort((left, right) => compare(left.assetKey, right.assetKey))
                .map(asset => ({
                    ...asset,
                    kind: asset.contractAddress === undefined ? 'coin' : 'token',
                    fiatValue: values.get(asset.assetKey),
                })),
        );
    },
);

/** What the account's priced assets are worth together; undefined while none of them is priced. */
export const selectAccountFiatValue = createMemoizedSelector(
    [selectAccountAssetValues],
    (values): BigNumber | undefined =>
        values.size === 0
            ? undefined
            : [...values.values()].reduce((total, value) => total.plus(value), ZERO),
);

/**
 * Whether the asset's missing rate is still on its way. A testnet is never priced, a token whose
 * rate is not fetched never gets one, and a failed fetch has given up, so none of them is waited for.
 */
const isAccountAssetRatePending = (
    state: HomeAssetTableState,
    { networkSymbol, contractAddress }: AccountAsset,
) =>
    !isTestnet(networkSymbol) &&
    !selectIsTokenFiatRateDisallowed(state, networkSymbol, contractAddress) &&
    !selectCurrentFiatRates(state)?.[
        getFiatRateKey(networkSymbol, selectBaseCurrency(state), contractAddress)
    ]?.error;

/** Whether a rate the account still lacks is on its way, so its total is worth waiting for. */
export const selectIsAccountFiatRatePending = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
) =>
    selectAccountAssets(state, accountKey).some(
        asset => asset.fiatValue === undefined && isAccountAssetRatePending(state, asset),
    );

/**
 * Whether the account's total leaves out an asset it holds that has no rate to come. One still on
 * its way is not counted: the total is only short of it until it lands.
 */
export const selectIsAccountFiatTotalIncomplete = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
) => {
    const assets = selectAccountAssets(state, accountKey);

    return (
        assets.some(({ fiatValue }) => fiatValue !== undefined) &&
        assets.some(
            asset =>
                asset.fiatValue === undefined &&
                // An empty asset adds nothing whatever its rate.
                isPositiveBalance(asset.amount) &&
                !isAccountAssetRatePending(state, asset),
        )
    );
};

export type AccountEarnSplit = {
    networkSymbol: NetworkSymbol;
    availableAmount: string;
    stakingAmount: string;
    /** The share of the coin that is staked, from 0 to 1. */
    stakingRatio: number;
};

/**
 * How much of the account's coin is staked and how much is not, as the asset detail's Earn card
 * splits the wallet's; undefined where the network cannot be staked here or the account holds none.
 */
export const selectAccountEarnSplit = createMemoizedSelector(
    [selectAccountByKey, selectAccountWalletAssets, selectCountedStakingPositionEntriesByAccount],
    (account, assets, stakingEntries): AccountEarnSplit | undefined => {
        if (account === null || !isSupportedStakingNetworkSymbol(account.symbol)) {
            return undefined;
        }

        // The coin's amount counts its stake in, as the Home asset table's does.
        const amount =
            [...assets.values()].find(({ contractAddress }) => contractAddress === undefined)
                ?.amount ?? '0';

        if (!isPositiveBalance(amount)) {
            return undefined;
        }

        const stakingAmount = formatStakingTotal(
            sumStakingPositionAmounts(stakingEntries),
            account.symbol,
        );

        return {
            networkSymbol: account.symbol,
            availableAmount: new BigNumber(amount).minus(stakingAmount).toFixed(),
            stakingAmount,
            stakingRatio: getStakingRatio(amount, stakingAmount) ?? 0,
        };
    },
);

/**
 * The account's tokens worth under the small-balance line; none until the USD rate is known. The
 * coin is what the page is about, so it is never small.
 */
const selectSmallAccountAssets = createMemoizedSelector(
    [selectAccountAssets, selectSmallBalanceThreshold],
    (assets, threshold): readonly AccountAsset[] =>
        returnStableArrayIfEmpty(
            threshold === undefined
                ? []
                : assets.filter(
                      ({ kind, fiatValue }) =>
                          kind === 'token' && fiatValue?.lt(threshold) === true,
                  ),
        ),
);

export const selectAccountSmallBalanceSummary = createMemoizedSelector(
    [selectSmallAccountAssets],
    small => summarizeSmallBalances(small.map(({ fiatValue }) => fiatValue ?? ZERO)),
    smallBalanceSummaryResultEquality,
);

/** The rows the account's table draws: every asset, or all but the small ones while those are switched off. */
export const selectDisplayedAccountAssets = createMemoizedSelector(
    [selectAccountAssets, selectSmallAccountAssets, selectAreHomeAssetSmallBalancesDisplayed],
    (assets, small, areSmallBalancesShown): readonly AccountAsset[] =>
        areSmallBalancesShown || small.length === 0
            ? assets
            : returnStableArrayIfEmpty(assets.filter(asset => !small.includes(asset))),
);
