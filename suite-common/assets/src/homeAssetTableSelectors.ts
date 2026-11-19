import { shallowEqual } from 'react-redux';

import {
    type DeviceRootState,
    selectDeviceStaticSessionId,
    selectHasBitcoinOnlyFirmware,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import { selectCountedStakingPositionEntriesByAccount } from '@suite-common/earn-staking';
import {
    type NetworksRootState,
    selectNetworkNamesMap,
    selectSupportedNetworkSymbols,
} from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getWalletAssetKey,
    selectAreHomeAssetSmallBalancesShown,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledSupportedNetworks,
    selectHomeAssetsTableGrouping,
    selectIsTokenFiatRateDisallowed,
    selectLastWeekFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    hasNetworkFeatures,
    isPositiveBalance,
    isTestnet,
} from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import {
    type AssetAccount,
    type AssetAccountsRootState,
    type HiddenTokenReason,
    selectDeviceAssetAccounts,
    selectHiddenAssetAccountKeySet,
    selectHiddenTokenReasons,
} from './assetAccountsSelectors';
import { type WalletAsset, groupWalletAssets } from './homeAssetTableUtils';
import {
    type SmallBalanceSummary,
    byFiatThenCryptoBalance,
    byValue,
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

export type { SmallBalanceSummary } from './walletAssetValueUtils';

export type HomeAssetTableState = AssetAccountsRootState &
    DeviceRootState &
    NetworksRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const ZERO = new BigNumber(0);

// Enabled networks are what discovery looks for on a device. The Portfolio Tracker discovers
// nothing: its accounts are imported one by one, on networks that setting may not hold.
const selectAllowedNetworkSymbols = (state: HomeAssetTableState): readonly NetworkSymbol[] =>
    selectIsPortfolioTrackerDevice(state)
        ? selectSupportedNetworkSymbols(state)
        : selectEnabledSupportedNetworks(state);

const SMALL_BALANCE_USD_VALUE = new BigNumber(1);

export const selectIsHomeAssetTableMenuAvailable = (state: HomeAssetTableState) =>
    !selectHasBitcoinOnlyFirmware(state);

/** The saved grouping, or the default one while the menu that sets it is not offered. */
export const selectHomeAssetGrouping = (state: HomeAssetTableState): HomeAssetGrouping =>
    selectIsHomeAssetTableMenuAvailable(state) ? selectHomeAssetsTableGrouping(state) : 'default';

/**
 * The saved switch, or shown while the menu holding it is not offered: nothing else could bring
 * small balances back.
 */
export const selectAreHomeAssetSmallBalancesDisplayed = (state: HomeAssetTableState) =>
    !selectIsHomeAssetTableMenuAvailable(state) || selectAreHomeAssetSmallBalancesShown(state);

/** How many rows the table may show before it folds, `HOME_ASSET_ROW_LIMIT` on both platforms. */
const selectRowLimit = (_state: HomeAssetTableState, rowLimit?: number) => rowLimit;

export type HomeAssetGrouping = 'default' | 'networks';

const haveSameGrouping = <Group>(
    left: ReadonlyMap<Group, readonly WalletAssetKey[]>,
    right: ReadonlyMap<Group, readonly WalletAssetKey[]>,
) =>
    left.size === right.size &&
    [...left].every(([group, assetKeys]) => {
        const held = right.get(group);

        return (
            held?.length === assetKeys.length &&
            assetKeys.every((assetKey, index) => held[index] === assetKey)
        );
    });

const groupAssetKeysByNetwork = (
    assets: ReadonlyMap<WalletAssetKey, WalletAsset>,
    assetKeys: readonly WalletAssetKey[],
): ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]> => {
    const byNetwork = new Map<NetworkSymbol, WalletAssetKey[]>();

    assetKeys.forEach(assetKey => {
        const networkSymbol = assets.get(assetKey)?.networkSymbol;

        if (networkSymbol === undefined) {
            return;
        }

        const grouped = byNetwork.get(networkSymbol) ?? [];

        grouped.push(assetKey);
        byNetwork.set(networkSymbol, grouped);
    });

    return byNetwork;
};

export const selectNetworkName = createMemoizedSelector(
    [selectNetworkNamesMap, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (names, symbol) => names?.[symbol],
);

export const selectWalletAssetKey = createMemoizedSelector(
    [
        selectDeviceStaticSessionId,
        (_state: HomeAssetTableState, networkSymbol: NetworkSymbol) => networkSymbol,
        (
            _state: HomeAssetTableState,
            _networkSymbol: NetworkSymbol,
            tokenContract?: TokenAddress,
        ) => tokenContract,
    ],
    (deviceState, networkSymbol, tokenContract) =>
        deviceState === null
            ? undefined
            : getWalletAssetKey({
                  deviceState,
                  networkSymbol,
                  contractAddress: tokenContract,
              }),
);

const selectHomeAssetTableState = (state: HomeAssetTableState) => state;

const getAccountStakingAmount = (state: HomeAssetTableState, account: Account) =>
    sumStakingPositionAmounts(selectCountedStakingPositionEntriesByAccount(state, account.key));

export type HomeAssetTotals = {
    /** Undefined while nothing the wallet holds can be priced; zero once it holds nothing at all. */
    fiatValue: BigNumber | undefined;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

/**
 * Whether the asset's missing rate is still on its way. A testnet is never priced, a token whose
 * rate is not fetched never gets one, and a failed fetch has given up, so none of them is waited for.
 */
const isAssetRatePending = (
    state: HomeAssetTableState,
    { networkSymbol, contractAddress }: WalletAsset,
) =>
    !isTestnet(networkSymbol) &&
    !selectIsTokenFiatRateDisallowed(state, networkSymbol, contractAddress) &&
    !selectCurrentFiatRates(state)?.[
        getFiatRateKey(networkSymbol, selectBaseCurrency(state), contractAddress)
    ]?.error;

export type AssetTableScope = {
    selectAccounts: (state: HomeAssetTableState) => readonly Account[];
    selectAssetAccounts: (state: HomeAssetTableState) => readonly AssetAccount[];
    isSingleAccount?: boolean;
};

export const createAssetTableSelectors = ({
    selectAccounts,
    selectAssetAccounts,
    isSingleAccount = false,
}: AssetTableScope) => {
    const isAlwaysListed = ({ contractAddress }: WalletAsset) =>
        isSingleAccount && contractAddress === undefined;

    const selectPartitionedAssetAccounts = createMemoizedSelector(
        [selectAssetAccounts, selectHiddenAssetAccountKeySet],
        (assetAccounts, hiddenAccounts) => {
            const shown: AssetAccount[] = [];
            const hidden: AssetAccount[] = [];

            assetAccounts.forEach(assetAccount => {
                (hiddenAccounts.has(assetAccount.assetAccountKey) ? hidden : shown).push(
                    assetAccount,
                );
            });

            return { shown, hidden };
        },
    );

    const selectWalletAssets = createMemoizedSelector(
        [selectPartitionedAssetAccounts],
        ({ shown }) => groupWalletAssets(shown),
    );

    const selectHiddenWalletAssets = createMemoizedSelector(
        [selectPartitionedAssetAccounts],
        ({ hidden }) => groupWalletAssets(hidden),
    );

    const selectWalletAssetRates = createMemoizedSelector(
        [selectWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
        pickRates,
        ratesResultEquality,
    );

    const selectWalletAssetWeekAgoRates = createMemoizedSelector(
        [selectWalletAssets, selectLastWeekFiatRates, selectBaseCurrency],
        pickRates,
        ratesResultEquality,
    );

    const selectHiddenWalletAssetRates = createMemoizedSelector(
        [selectHiddenWalletAssets, selectCurrentFiatRates, selectBaseCurrency],
        pickRates,
        ratesResultEquality,
    );

    const selectWalletAssetValues = createMemoizedSelector(
        [selectWalletAssets, selectWalletAssetRates],
        priceAssets,
        fiatValuesResultEquality,
    );

    const selectWalletAssetWeekAgoValues = createMemoizedSelector(
        [selectWalletAssets, selectWalletAssetWeekAgoRates],
        priceAssets,
        fiatValuesResultEquality,
    );

    const selectHiddenWalletAssetValues = createMemoizedSelector(
        [selectHiddenWalletAssets, selectHiddenWalletAssetRates],
        priceAssets,
        fiatValuesResultEquality,
    );

    const selectShownWalletAssetKeys = createMemoizedSelector(
        [selectWalletAssets, selectWalletAssetValues, selectAllowedNetworkSymbols],
        (assets, values, allowedNetworks): readonly WalletAssetKey[] =>
            returnStableArrayIfEmpty(
                [...assets.values()]
                    .filter(
                        asset =>
                            (isSingleAccount || allowedNetworks.includes(asset.networkSymbol)) &&
                            (asset.cryptoBalance.gt(0) || isAlwaysListed(asset)),
                    )
                    .map(asset => asset.assetKey)
                    .sort(byValue(values)),
            ),
        { memoizeOptions: { resultEqualityCheck: shallowEqual } },
    );

    /** Whether there is anything to draw at all: a boolean, so a reorder of the rows is no re-render. */
    const selectHasShownWalletAssets = createMemoizedSelector(
        [selectShownWalletAssetKeys],
        (assetKeys): boolean => assetKeys.length > 0,
    );

    /**
     * What a dollar is in the chosen currency, as one plain number. Every current rate carries its dollar
     * rate (see `CurrentFiatRatesResult`) and a provider prices everything through one exchange-rate
     * table, so `rate / usdRate` is the same for every asset it holds — one asset's pair is enough, and
     * nothing need be priced twice. Two providers can sit on slightly different snapshots, so an asset
     * worth almost exactly a dollar may fall on either side of the line; for a switch that hides dust
     * that is nothing. The most valuable priced asset is asked first: its rates are the ones most watched.
     */
    const selectUsdToBaseCurrencyRate = createMemoizedSelector(
        [
            selectShownWalletAssetKeys,
            selectWalletAssets,
            selectCurrentFiatRates,
            selectBaseCurrency,
        ],
        (assetKeys, assets, rates, baseCurrencyCode): number | undefined => {
            if (baseCurrencyCode === 'usd') {
                return 1;
            }

            for (const assetKey of assetKeys) {
                const asset = assets.get(assetKey);
                const entry =
                    asset &&
                    rates?.[
                        getFiatRateKey(asset.networkSymbol, baseCurrencyCode, asset.contractAddress)
                    ];

                if (entry?.rate && entry.usdRate) {
                    return entry.rate / entry.usdRate;
                }
            }

            return undefined;
        },
    );

    /** What a small balance is worth at most in the chosen currency; nothing until the USD rate is known. */
    const selectSmallBalanceThreshold = createMemoizedSelector(
        [selectUsdToBaseCurrencyRate],
        (usdToBaseCurrencyRate): BigNumber | undefined =>
            usdToBaseCurrencyRate === undefined
                ? undefined
                : SMALL_BALANCE_USD_VALUE.times(usdToBaseCurrencyRate),
    );

    /**
     * Assets worth under $1 in the selected currency. An unpriced asset is never small, and nothing is
     * small until the USD rate is known, so nothing is hidden by mistake.
     */
    const selectSmallBalanceAssetKeySet = createMemoizedSelector(
        [
            selectShownWalletAssetKeys,
            selectWalletAssets,
            selectWalletAssetValues,
            selectSmallBalanceThreshold,
        ],
        (assetKeys, assets, values, threshold): ReadonlySet<WalletAssetKey> => {
            const small = new Set<WalletAssetKey>();

            if (threshold === undefined) {
                return small;
            }

            assetKeys.forEach(assetKey => {
                const asset = assets.get(assetKey);

                // Rates and balances are never negative, so neither is a value: no `abs` needed.
                if (
                    asset !== undefined &&
                    !isAlwaysListed(asset) &&
                    values.get(assetKey)?.lt(threshold)
                ) {
                    small.add(assetKey);
                }
            });

            return small;
        },
    );

    const selectSmallBalanceSummary = createMemoizedSelector(
        [selectSmallBalanceAssetKeySet, selectWalletAssetValues],
        (small, values): SmallBalanceSummary | undefined =>
            summarizeSmallBalances([...small].map(assetKey => values.get(assetKey) ?? ZERO)),
        smallBalanceSummaryResultEquality,
    );

    const selectAllDisplayedAssetKeys = createMemoizedSelector(
        [
            selectShownWalletAssetKeys,
            selectSmallBalanceAssetKeySet,
            selectAreHomeAssetSmallBalancesDisplayed,
        ],
        (assetKeys, small, areSmallBalancesShown): readonly WalletAssetKey[] =>
            areSmallBalancesShown
                ? assetKeys
                : returnStableArrayIfEmpty(assetKeys.filter(assetKey => !small.has(assetKey))),
        { memoizeOptions: { resultEqualityCheck: shallowEqual } },
    );

    /** Whether the table has more to show than the limit allows: a boolean, so a reorder below it is no re-render. */
    const selectIsHomeAssetTableFoldable = createMemoizedSelector(
        [selectAllDisplayedAssetKeys, selectRowLimit],
        (assetKeys, rowLimit): boolean => rowLimit !== undefined && assetKeys.length > rowLimit,
    );

    /** The rows to draw, cut to `rowLimit` while the table is folded; every row when none is given. */
    const selectDisplayedWalletAssetKeys = createMemoizedSelector(
        [selectAllDisplayedAssetKeys, selectRowLimit],
        (assetKeys, rowLimit): readonly WalletAssetKey[] =>
            returnStableArrayIfEmpty(
                rowLimit === undefined ? assetKeys : assetKeys.slice(0, rowLimit),
            ),
        { memoizeOptions: { resultEqualityCheck: shallowEqual } },
    );

    /**
     * Which rows belong to which network. It is rebuilt whenever an account is written, but a rebuild
     * that lands on the same grouping is thrown away, so a balance or a rate leaves every section
     * holding the very array it was handed.
     */
    const selectShownAssetKeysByNetwork = createMemoizedSelector(
        [selectWalletAssets, selectShownWalletAssetKeys],
        groupAssetKeysByNetwork,
        { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
    );

    const selectDisplayedAssetKeysByNetwork = createMemoizedSelector(
        [selectWalletAssets, selectAllDisplayedAssetKeys],
        groupAssetKeysByNetwork,
        { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
    );

    /**
     * What each network is worth. Only this is redone when a balance or a rate moves. A network nothing
     * can price — a testnet, or rates that have yet to land — is left out: a total of zero would be a lie.
     */
    const selectNetworkFiatValues = createMemoizedSelector(
        [selectShownAssetKeysByNetwork, selectWalletAssetValues],
        (byNetwork, values): ReadonlyMap<NetworkSymbol, BigNumber> => {
            const worth = new Map<NetworkSymbol, BigNumber>();

            byNetwork.forEach((assetKeys, symbol) => {
                const priced = assetKeys.filter(assetKey => values.has(assetKey));

                if (priced.length === 0) {
                    return;
                }

                worth.set(
                    symbol,
                    priced.reduce(
                        (total, assetKey) => total.plus(values.get(assetKey) ?? ZERO),
                        ZERO,
                    ),
                );
            });

            return worth;
        },
    );

    /** The networks the shown assets are held on, the most valuable network first. */
    const selectSortedNetworkSymbols = createMemoizedSelector(
        [selectDisplayedAssetKeysByNetwork, selectNetworkFiatValues],
        (byNetwork, worth): readonly NetworkSymbol[] =>
            returnStableArrayIfEmpty(
                [...byNetwork.keys()].sort(
                    (left, right) =>
                        (worth.get(right) ?? ZERO).comparedTo(worth.get(left) ?? ZERO) ?? 0,
                ),
            ),
        { memoizeOptions: { resultEqualityCheck: shallowEqual } },
    );

    const selectCappedAssetKeysByNetwork = createMemoizedSelector(
        [selectSortedNetworkSymbols, selectDisplayedAssetKeysByNetwork, selectRowLimit],
        (symbols, byNetwork, rowLimit): ReadonlyMap<NetworkSymbol, readonly WalletAssetKey[]> => {
            if (rowLimit === undefined) {
                return byNetwork;
            }

            const capped = new Map<NetworkSymbol, readonly WalletAssetKey[]>();
            let budget = rowLimit;

            symbols.forEach(symbol => {
                const taken = (byNetwork.get(symbol) ?? []).slice(0, budget);

                if (taken.length === 0) {
                    return;
                }

                capped.set(symbol, taken);
                budget -= taken.length;
            });

            return capped;
        },
        { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
    );

    const selectCappedNetworkSymbols = createMemoizedSelector(
        [selectCappedAssetKeysByNetwork],
        (byNetwork): readonly NetworkSymbol[] => returnStableArrayIfEmpty([...byNetwork.keys()]),
        { memoizeOptions: { resultEqualityCheck: shallowEqual } },
    );

    const selectDisplayedNetworkSymbols = createMemoizedSelector(
        [selectSortedNetworkSymbols, selectCappedNetworkSymbols, selectRowLimit],
        (sorted, capped, rowLimit): readonly NetworkSymbol[] =>
            rowLimit === undefined ? sorted : capped,
    );

    // No `resultEqualityCheck` on purpose: reselect keeps one previous result per selector rather than
    // one per argument, so with a section per network each would be compared against its neighbour's
    // list and none would ever match. Handing back the array the grouping already holds needs no check.
    const selectDisplayedWalletAssetKeysOfNetwork = createMemoizedSelector(
        [
            // The limit is this selector's third argument and the grouping's second; the grouping is
            // already uncapped when none is given.
            (state: HomeAssetTableState, _symbol: NetworkSymbol, rowLimit?: number) =>
                selectCappedAssetKeysByNetwork(state, rowLimit),
            (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol,
        ],
        (byNetwork, symbol): readonly WalletAssetKey[] =>
            returnStableArrayIfEmpty(byNetwork.get(symbol) ?? []),
    );

    const selectNetworkFiatValue = createMemoizedSelector(
        [selectNetworkFiatValues, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
        (worth, symbol) => worth.get(symbol)?.toFixed(),
    );

    const selectWalletAsset = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden = false,
    ) => {
        if (assetKey === undefined) {
            return undefined;
        }

        const hiddenAsset = () => selectHiddenWalletAssets(state).get(assetKey);

        return isHidden
            ? hiddenAsset()
            : (selectWalletAssets(state).get(assetKey) ?? hiddenAsset());
    };

    const selectWalletAssetNetworkSymbol = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden?: boolean,
    ) => selectWalletAsset(state, assetKey, isHidden)?.networkSymbol;

    const selectWalletAssetContractAddress = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden?: boolean,
    ) => selectWalletAsset(state, assetKey, isHidden)?.contractAddress;

    const selectWalletAssetAmount = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden?: boolean,
    ) => selectWalletAsset(state, assetKey, isHidden)?.amount;

    const selectWalletAssetAccountCount = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden?: boolean,
    ) => selectWalletAsset(state, assetKey, isHidden)?.accountCount ?? 0;

    const selectWalletAssetHoldings = createMemoizedSelector(
        [
            selectAssetAccounts,
            (_state: HomeAssetTableState, assetKey: WalletAssetKey | undefined) => assetKey,
        ],
        (assetAccounts, assetKey): readonly AssetAccount[] =>
            returnStableArrayIfEmpty(
                assetAccounts.filter(
                    assetAccount =>
                        assetAccount.assetKey === assetKey &&
                        isPositiveBalance(assetAccount.cryptoBalance),
                ),
            ),
    );

    const selectWalletAssetSignVerifyAccounts = createMemoizedSelector(
        [selectAccounts, selectWalletAssetNetworkSymbol],
        (accounts, networkSymbol) =>
            returnStableArrayIfEmpty(
                accounts.filter(
                    account =>
                        account.symbol === networkSymbol &&
                        hasNetworkFeatures(account, 'sign-verify'),
                ),
            ),
    );

    const selectWalletAssetStakingAmount = createMemoizedSelector(
        [
            selectHomeAssetTableState,
            selectAccounts,
            selectWalletAssetNetworkSymbol,
            selectWalletAssetContractAddress,
        ],
        (state, accounts, networkSymbol, contractAddress): string => {
            if (networkSymbol === undefined || contractAddress !== undefined) {
                return '0';
            }

            const stakingAmount = accounts.reduce(
                (total, account) =>
                    account.symbol === networkSymbol
                        ? total.plus(getAccountStakingAmount(state, account))
                        : total,
                ZERO,
            );

            return formatStakingTotal(stakingAmount, networkSymbol);
        },
    );

    const selectWalletAssetStakingRatio = createMemoizedSelector(
        [selectWalletAssetAmount, selectWalletAssetStakingAmount],
        (totalAmount, stakingAmount) =>
            totalAmount === undefined ? undefined : getStakingRatio(totalAmount, stakingAmount),
    );

    const selectWalletAssetAvailableAmount = createMemoizedSelector(
        [selectWalletAssetAmount, selectWalletAssetStakingAmount],
        (totalAmount, stakingAmount) =>
            totalAmount === undefined
                ? undefined
                : new BigNumber(totalAmount).minus(stakingAmount).toFixed(),
    );

    const selectWalletAssetTokenSymbol = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden?: boolean,
    ) => selectWalletAsset(state, assetKey, isHidden)?.tokenSymbol ?? null;

    const selectWalletAssetTokenDecimals = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
        isHidden?: boolean,
    ) => selectWalletAsset(state, assetKey, isHidden)?.tokenDecimals;

    const selectHiddenWalletAssetKeysByReason = createMemoizedSelector(
        [
            selectHiddenWalletAssets,
            selectHiddenWalletAssetValues,
            selectHiddenTokenReasons,
            selectAllowedNetworkSymbols,
        ],
        (
            assets,
            values,
            reasons,
            allowedNetworks,
        ): ReadonlyMap<HiddenTokenReason, readonly WalletAssetKey[]> => {
            const byReason = new Map<HiddenTokenReason, WalletAssetKey[]>();

            assets.forEach((asset, assetKey) => {
                if (
                    asset.contractAddress === undefined ||
                    !allowedNetworks.includes(asset.networkSymbol)
                ) {
                    return;
                }

                const reason = reasons.get(asset.networkSymbol)?.get(asset.contractAddress);

                if (reason === undefined) {
                    return;
                }

                const grouped = byReason.get(reason) ?? [];

                grouped.push(assetKey);
                byReason.set(reason, grouped);
            });

            byReason.forEach(assetKeys => assetKeys.sort(byFiatThenCryptoBalance(assets, values)));

            return byReason;
        },
        // Rebuilt on every account write, so a rebuild that lands on the same lists is thrown away and
        // each group keeps the array it was handed; the per-reason selector below must stay unchecked.
        { memoizeOptions: { resultEqualityCheck: haveSameGrouping } },
    );

    const selectHiddenWalletAssetKeys = createMemoizedSelector(
        [
            selectHiddenWalletAssetKeysByReason,
            (_state: HomeAssetTableState, reason: HiddenTokenReason) => reason,
        ],
        (byReason, reason): readonly WalletAssetKey[] =>
            returnStableArrayIfEmpty(byReason.get(reason) ?? []),
    );

    const selectHiddenWalletAssetCount = createMemoizedSelector(
        [selectHiddenWalletAssetKeysByReason],
        byReason =>
            [...byReason.values()].reduce((count, assetKeys) => count + assetKeys.length, 0),
    );

    const selectHasHiddenWalletAssets = createMemoizedSelector(
        [selectHiddenWalletAssetKeysByReason],
        byReason => byReason.size > 0,
    );

    const selectWalletAssetHiddenReason = (
        state: HomeAssetTableState,
        assetKey: WalletAssetKey | undefined,
    ): HiddenTokenReason | undefined => {
        const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);
        const contractAddress = selectWalletAssetContractAddress(state, assetKey);

        return networkSymbol === undefined || contractAddress === undefined
            ? undefined
            : selectHiddenTokenReasons(state).get(networkSymbol)?.get(contractAddress);
    };

    const selectWalletAssetFiatValue = createMemoizedSelector(
        [
            selectWalletAssetValues,
            selectHiddenWalletAssetValues,
            (_state: HomeAssetTableState, assetKey: WalletAssetKey | undefined) => assetKey,
        ],
        (values, hiddenValues, assetKey): BaseCurrencyAmount | undefined => {
            if (assetKey === undefined) {
                return undefined;
            }

            const fiatValue = values.get(assetKey) ?? hiddenValues.get(assetKey);

            return fiatValue === undefined ? undefined : asBaseCurrencyAmount(fiatValue);
        },
    );

    const selectHomeAssetTotals = createMemoizedSelector(
        [selectShownWalletAssetKeys, selectWalletAssetValues, selectWalletAssetWeekAgoValues],
        (assetKeys, values, weekAgoValues): HomeAssetTotals => {
            if (assetKeys.length === 0) {
                return { fiatValue: ZERO, weekChange: ZERO, weekChangePercent: ZERO };
            }

            const addUp = (
                priced: ReadonlyMap<WalletAssetKey, BigNumber>,
                keys: readonly WalletAssetKey[],
            ) => keys.reduce((total, assetKey) => total.plus(priced.get(assetKey) ?? ZERO), ZERO);

            const priced = assetKeys.filter(assetKey => values.has(assetKey));
            const fiatValue = priced.length === 0 ? undefined : addUp(values, priced);

            // An asset priced in only one of the two weeks would read as a gain or a loss it never
            // made, so the change is over the assets both weeks could price.
            const comparable = assetKeys.filter(
                assetKey => values.has(assetKey) && weekAgoValues.has(assetKey),
            );
            const weekAgoFiatValue = addUp(weekAgoValues, comparable);

            if (weekAgoFiatValue.isZero()) {
                return { fiatValue, weekChange: undefined, weekChangePercent: undefined };
            }

            const weekChange = addUp(values, comparable).minus(weekAgoFiatValue);

            return {
                fiatValue,
                weekChange,
                weekChangePercent: weekChange.div(weekAgoFiatValue),
            };
        },
    );

    const selectUnpricedShownAssets = createMemoizedSelector(
        [selectShownWalletAssetKeys, selectWalletAssets, selectWalletAssetValues],
        (assetKeys, assets, values): readonly WalletAsset[] =>
            returnStableArrayIfEmpty(
                assetKeys
                    .filter(assetKey => !values.has(assetKey))
                    .flatMap(assetKey => assets.get(assetKey) ?? []),
            ),
    );

    /** Whether a rate the table still lacks is on its way, so its total is worth waiting for. */
    const selectIsFiatRatePending = (state: HomeAssetTableState) =>
        selectUnpricedShownAssets(state).some(asset => isAssetRatePending(state, asset));

    /**
     * Whether the total leaves out a held asset that has no rate to come. One still on its way is
     * not counted: the total is only short of it until it lands.
     */
    const selectIsFiatTotalIncomplete = (state: HomeAssetTableState) => {
        const unpriced = selectUnpricedShownAssets(state);

        return (
            unpriced.length < selectShownWalletAssetKeys(state).length &&
            unpriced.some(
                asset =>
                    // An empty asset adds nothing whatever its rate.
                    isPositiveBalance(asset.amount) && !isAssetRatePending(state, asset),
            )
        );
    };

    return {
        selectIsFiatRatePending,
        selectIsFiatTotalIncomplete,
        selectShownWalletAssetKeys,
        selectHasShownWalletAssets,
        selectSmallBalanceSummary,
        selectIsHomeAssetTableFoldable,
        selectDisplayedWalletAssetKeys,
        selectCappedAssetKeysByNetwork,
        selectDisplayedNetworkSymbols,
        selectDisplayedWalletAssetKeysOfNetwork,
        selectNetworkFiatValue,
        selectWalletAssetNetworkSymbol,
        selectWalletAssetContractAddress,
        selectWalletAssetAmount,
        selectWalletAssetAccountCount,
        selectWalletAssetHoldings,
        selectWalletAssetSignVerifyAccounts,
        selectWalletAssetStakingAmount,
        selectWalletAssetStakingRatio,
        selectWalletAssetAvailableAmount,
        selectWalletAssetTokenSymbol,
        selectWalletAssetTokenDecimals,
        selectHiddenWalletAssetKeys,
        selectHiddenWalletAssetCount,
        selectHasHiddenWalletAssets,
        selectWalletAssetHiddenReason,
        selectWalletAssetFiatValue,
        selectHomeAssetTotals,
    };
};

export type AssetTableSelectors = ReturnType<typeof createAssetTableSelectors>;

export const homeAssetTableSelectors = createAssetTableSelectors({
    selectAccounts: selectVisibleDeviceAccounts,
    selectAssetAccounts: selectDeviceAssetAccounts,
});

export const {
    selectShownWalletAssetKeys,
    selectHasShownWalletAssets,
    selectSmallBalanceSummary,
    selectIsHomeAssetTableFoldable,
    selectDisplayedWalletAssetKeys,
    selectCappedAssetKeysByNetwork,
    selectDisplayedNetworkSymbols,
    selectDisplayedWalletAssetKeysOfNetwork,
    selectNetworkFiatValue,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetContractAddress,
    selectWalletAssetAmount,
    selectWalletAssetAccountCount,
    selectWalletAssetHoldings,
    selectWalletAssetSignVerifyAccounts,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
    selectWalletAssetAvailableAmount,
    selectWalletAssetTokenSymbol,
    selectWalletAssetTokenDecimals,
    selectHiddenWalletAssetKeys,
    selectHiddenWalletAssetCount,
    selectHasHiddenWalletAssets,
    selectWalletAssetHiddenReason,
    selectWalletAssetFiatValue,
    selectHomeAssetTotals,
} = homeAssetTableSelectors;
