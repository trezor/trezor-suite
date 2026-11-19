import { shallowEqual } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    getWalletAssetKey,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectIsTokenFiatRateDisallowed,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isTestnet } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { type BigNumber } from '@trezor/utils';

import {
    selectDeviceAssetAccounts,
    selectHiddenAssetAccountKeySet,
} from './assetAccountsSelectors';
import {
    type HomeAssetTableState,
    groupWalletAssets,
    haveSameSmallBalanceSummary,
    pickRates,
    pickedOnce,
    priceAssets,
    pricedOnce,
    selectAllDisplayedAssetKeys,
    selectAreHomeAssetSmallBalancesDisplayed,
    selectHomeAssetTotals,
    selectShownWalletAssetKeys,
    selectSmallBalanceAssetKeySet,
    selectSmallBalanceSummary,
    selectUsdToBaseCurrencyRate,
    selectWalletAssetAvailableAmount,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
} from './homeAssetTableSelectors';

// The Home asset table's chain put together again over the holdings of one account: the same
// result functions, fed that account's assets where Home feeds the wallet's.

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const selectAccount = (state: HomeAssetTableState, accountKey: AccountKey) =>
    selectAccountByKey(state, accountKey);

const selectAccountAssets = createMemoizedSelector(
    [
        selectDeviceAssetAccounts,
        selectHiddenAssetAccountKeySet,
        (_state: HomeAssetTableState, accountKey: AccountKey) => accountKey,
    ],
    (assetAccounts, hiddenAccounts, accountKey) =>
        groupWalletAssets(
            assetAccounts.filter(
                assetAccount =>
                    assetAccount.accountKey === accountKey &&
                    !hiddenAccounts.has(assetAccount.assetAccountKey),
            ),
        ),
);

const selectAccountAssetRates = createMemoizedSelector(
    [selectAccountAssets, selectCurrentFiatRates, selectBaseCurrency],
    pickRates,
    pickedOnce,
);

const selectAccountAssetValues = createMemoizedSelector(
    [selectAccountAssets, selectAccountAssetRates],
    priceAssets,
    pricedOnce,
);

// An account is listed whatever networks the wallet has enabled: its own is the only one there is.
const selectAccountNetworkSymbols = createMemoizedSelector(
    [selectAccount],
    (account): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(account === null ? [] : [account.symbol]),
);

export const selectAccountAssetKeys = createMemoizedSelector(
    [selectAccountAssets, selectAccountAssetValues, selectAccountNetworkSymbols],
    selectShownWalletAssetKeys.resultFunc,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const selectAccountUsdToBaseCurrencyRate = createMemoizedSelector(
    [selectAccountAssetKeys, selectAccountAssets, selectCurrentFiatRates, selectBaseCurrency],
    selectUsdToBaseCurrencyRate.resultFunc,
);

const selectAccountSmallBalanceAssetKeySet = createMemoizedSelector(
    [selectAccountAssetKeys, selectAccountAssetValues, selectAccountUsdToBaseCurrencyRate],
    selectSmallBalanceAssetKeySet.resultFunc,
);

export const selectAccountSmallBalanceSummary = createMemoizedSelector(
    [selectAccountSmallBalanceAssetKeySet, selectAccountAssetValues],
    selectSmallBalanceSummary.resultFunc,
    { memoizeOptions: { resultEqualityCheck: haveSameSmallBalanceSummary } },
);

export const selectAccountDisplayedAssetKeys = createMemoizedSelector(
    [
        selectAccountAssetKeys,
        selectAccountSmallBalanceAssetKeySet,
        (state: HomeAssetTableState) => selectAreHomeAssetSmallBalancesDisplayed(state),
    ],
    selectAllDisplayedAssetKeys.resultFunc,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const NO_WEEK_AGO_VALUES: ReadonlyMap<WalletAssetKey, BigNumber> = new Map();

export const selectAccountAssetTotals = createMemoizedSelector(
    [selectAccountAssetKeys, selectAccountAssetValues, () => NO_WEEK_AGO_VALUES],
    selectHomeAssetTotals.resultFunc,
);

export const selectAccountAsset = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
    assetKey: WalletAssetKey | undefined,
) => (assetKey === undefined ? undefined : selectAccountAssets(state, accountKey).get(assetKey));

export const selectAccountAssetFiatValue = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
    assetKey: WalletAssetKey,
) => selectAccountAssetValues(state, accountKey).get(assetKey);

export const selectAccountCoinAssetKey = createMemoizedSelector([selectAccount], account =>
    account === null
        ? undefined
        : getWalletAssetKey({
              deviceState: account.deviceState,
              networkSymbol: account.symbol,
              contractAddress: undefined,
          }),
);

export const selectAccountCoinAmount = (state: HomeAssetTableState, accountKey: AccountKey) =>
    selectAccountAsset(state, accountKey, selectAccountCoinAssetKey(state, accountKey))?.amount;

const selectAccountAlone = createMemoizedSelector([selectAccount], (account): Account[] =>
    returnStableArrayIfEmpty(account === null ? [] : [account]),
);

export const selectAccountStakingAmount = createMemoizedSelector(
    [
        (state: HomeAssetTableState) => state,
        selectAccountAlone,
        (state: HomeAssetTableState, accountKey: AccountKey) =>
            selectAccount(state, accountKey)?.symbol,
        () => undefined,
    ],
    selectWalletAssetStakingAmount.resultFunc,
);

export const selectAccountStakingRatio = createMemoizedSelector(
    [selectAccountCoinAmount, selectAccountStakingAmount],
    selectWalletAssetStakingRatio.resultFunc,
);

export const selectAccountAvailableAmount = createMemoizedSelector(
    [selectAccountCoinAmount, selectAccountStakingAmount],
    selectWalletAssetAvailableAmount.resultFunc,
);

/**
 * Whether the asset's missing rate is still on its way. A testnet is never priced, a token whose
 * rate is not fetched never gets one, and a failed fetch has given up, so none of them is waited for.
 */
const isAssetRatePending = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
    assetKey: WalletAssetKey,
) => {
    const asset = selectAccountAsset(state, accountKey, assetKey);

    return (
        asset !== undefined &&
        !isTestnet(asset.networkSymbol) &&
        !selectIsTokenFiatRateDisallowed(state, asset.networkSymbol, asset.contractAddress) &&
        !selectCurrentFiatRates(state)?.[
            getFiatRateKey(asset.networkSymbol, selectBaseCurrency(state), asset.contractAddress)
        ]?.error
    );
};

const isAssetUnpriced = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
    assetKey: WalletAssetKey,
) => selectAccountAssetFiatValue(state, accountKey, assetKey) === undefined;

/** Whether a rate the account still lacks is on its way, so its total is worth waiting for. */
export const selectIsAccountAssetRatePending = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
) =>
    selectAccountAssetKeys(state, accountKey).some(
        assetKey =>
            isAssetUnpriced(state, accountKey, assetKey) &&
            isAssetRatePending(state, accountKey, assetKey),
    );

/**
 * Whether the total leaves out a held asset that has no rate to come. One still on its way is
 * not counted: the total is only short of it until it lands.
 */
export const selectIsAccountAssetTotalIncomplete = (
    state: HomeAssetTableState,
    accountKey: AccountKey,
) => {
    const assetKeys = selectAccountAssetKeys(state, accountKey);

    return (
        assetKeys.some(assetKey => !isAssetUnpriced(state, accountKey, assetKey)) &&
        assetKeys.some(
            assetKey =>
                isAssetUnpriced(state, accountKey, assetKey) &&
                !isAssetRatePending(state, accountKey, assetKey),
        )
    );
};
