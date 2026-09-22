import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { NetworkNameFormatter } from '@suite-common/formatters';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    type AssetAccountsRootState,
    type FiatRatesRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    selectAssetAccountsByWallet,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectHiddenAssetAccountKeySet,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type RatesByKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isDustBalance, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode, type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import {
    type HomeAssetGrouping,
    getAssetDisplaySymbol,
    sumAssetAccounts,
} from './homeAssetTableUtils';

export type HomeAssetTableState = AssetAccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

export type AssetAccounts = readonly [AssetAccount, ...AssetAccount[]];

export const asAsset = (held: readonly AssetAccount[]): AssetAccounts | undefined =>
    held.length === 0 ? undefined : (held as unknown as AssetAccounts);

const ZERO_FIAT_VALUE = new BigNumber(0);

export type AssetBalance = {
    cryptoBalance: BigNumber;
    amount: string;
    tokenInfo: TokenInfo | undefined;
};

export const selectDeviceAssetGroups = createMemoizedSelector(
    [
        selectAssetAccountsByWallet,
        (_state: AssetAccountsRootState, deviceState: StaticSessionId) => deviceState,
        (
            _state: AssetAccountsRootState,
            _deviceState: StaticSessionId,
            symbols: readonly NetworkSymbol[],
        ) => symbols,
    ],
    (byWallet, deviceState, symbols): readonly (readonly AssetAccount[])[] => {
        const groups = new Map<WalletAssetKey, AssetAccount[]>();
        const byNetwork = byWallet.get(deviceState);

        symbols.forEach(symbol => {
            const held = byNetwork?.get(symbol);

            held?.forEach(assetAccount => {
                const group = groups.get(assetAccount.assetKey);

                if (group === undefined) {
                    groups.set(assetAccount.assetKey, [assetAccount]);
                } else {
                    group.push(assetAccount);
                }
            });
        });

        return returnStableArrayIfEmpty([...groups.values()]);
    },
);

export const isDustAsset = (
    assetAccounts: AssetAccounts,
    balance: AssetBalance | undefined,
    fiatValue: BigNumber | undefined,
): boolean => {
    const [asset] = assetAccounts;

    if (asset === undefined || asset.contractAddress === undefined || balance === undefined) {
        return false;
    }

    return isDustBalance({
        cryptoBalance: balance.cryptoBalance,
        decimals: balance.tokenInfo?.decimals ?? getNetworkDecimals(asset.symbol),
        fiatValue,
    });
};

const selectHomeAssets = createMemoizedSelector(
    [
        (state: HomeAssetTableState, deviceState: StaticSessionId) =>
            selectDeviceAssetGroups(state, deviceState, selectEnabledNetworks(state)),
        selectHiddenAssetAccountKeySet,
    ],
    (assetGroups, hidden): readonly AssetAccounts[] =>
        returnStableArrayIfEmpty(
            assetGroups.flatMap(assetAccounts => {
                const shown = asAsset(
                    assetAccounts.filter(
                        held => held.isAccountVisible && !hidden.has(held.assetAccountKey),
                    ),
                );

                return shown === undefined ? [] : [shown];
            }),
        ),
);

export const selectAssetBalances = createMemoizedSelector(
    [selectHomeAssets],
    (assets): ReadonlyMap<AssetAccounts, AssetBalance> =>
        new Map(
            assets.map(assetAccounts => {
                const { cryptoBalance, tokenInfo } = sumAssetAccounts(assetAccounts);

                return [
                    assetAccounts,
                    { cryptoBalance, amount: cryptoBalance.toFixed(), tokenInfo },
                ];
            }),
        ),
);

export const selectAssetBalance = createMemoizedSelector(
    [selectAssetBalances, (_state, _deviceState, assetAccounts: AssetAccounts) => assetAccounts],
    (balances, assetAccounts) => balances.get(assetAccounts),
);

const priceBalances = (
    balances: ReadonlyMap<AssetAccounts, AssetBalance>,
    rates: RatesByKey | undefined,
    baseCurrencyCode: BaseCurrencyCode,
): ReadonlyMap<AssetAccounts, BigNumber> => {
    const priced = new Map<AssetAccounts, BigNumber>();

    balances.forEach(({ cryptoBalance }, assetAccounts) => {
        const [asset] = assetAccounts;

        if (asset === undefined) {
            return;
        }

        const fiatRateKey = getFiatRateKey(asset.symbol, baseCurrencyCode, asset.contractAddress);
        const fiatValue = toFiatCurrency({
            amount: cryptoBalance.toFixed(),
            rate: rates?.[fiatRateKey]?.rate,
        });

        if (fiatValue !== null) {
            priced.set(assetAccounts, fiatValue);
        }
    });

    return priced;
};

const haveSameFiatValues = (
    left: ReadonlyMap<AssetAccounts, BigNumber>,
    right: ReadonlyMap<AssetAccounts, BigNumber>,
) =>
    left.size === right.size &&
    [...left].every(([assetAccounts, fiatValue]) => right.get(assetAccounts)?.eq(fiatValue));

const pricedOnce = { memoizeOptions: { resultEqualityCheck: haveSameFiatValues } };

export const selectAssetFiatValues = createMemoizedSelector(
    [selectAssetBalances, selectCurrentFiatRates, selectBaseCurrency],
    priceBalances,
    pricedOnce,
);

const selectAssetWeekAgoFiatValues = createMemoizedSelector(
    [selectAssetBalances, selectLastWeekFiatRates, selectBaseCurrency],
    priceBalances,
    pricedOnce,
);

export const selectHomeAssetRows = createMemoizedSelector(
    [selectHomeAssets, selectAssetBalances, selectAssetFiatValues],
    (assets, balances, fiatValues): readonly AssetAccounts[] => {
        const worth = (assetAccounts: AssetAccounts) =>
            fiatValues.get(assetAccounts) ?? ZERO_FIAT_VALUE;

        const names = new Map<AssetAccounts, string>();
        const nameOf = (assetAccounts: AssetAccounts) => {
            const named = names.get(assetAccounts);

            if (named !== undefined) {
                return named;
            }

            const [{ symbol }] = assetAccounts;
            const name = getAssetDisplaySymbol({
                symbol,
                tokenInfo: balances.get(assetAccounts)?.tokenInfo,
            });

            names.set(assetAccounts, name);

            return name;
        };

        return returnStableArrayIfEmpty(
            [...assets].sort(
                (left, right) =>
                    worth(right).comparedTo(worth(left)) ||
                    nameOf(left).localeCompare(nameOf(right)) ||
                    left[0].symbol.localeCompare(right[0].symbol),
            ),
        );
    },
    {
        memoizeOptions: {
            resultEqualityCheck: shallowEqual,
        },
    },
);

export type HomeAssetTotals = {
    fiatValue: BigNumber;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const selectHomeAssetTotals = createMemoizedSelector(
    [selectAssetFiatValues, selectAssetWeekAgoFiatValues],
    (fiatValues, weekAgoFiatValues): HomeAssetTotals => {
        const addUp = (priced: ReadonlyMap<AssetAccounts, BigNumber>) =>
            [...priced.values()].reduce((total, value) => total.plus(value), ZERO_FIAT_VALUE);

        const fiatValue = addUp(fiatValues);
        const weekAgoFiatValue = addUp(weekAgoFiatValues);

        if (weekAgoFiatValue.isZero()) {
            return { fiatValue, weekChange: undefined, weekChangePercent: undefined };
        }

        const weekChange = fiatValue.minus(weekAgoFiatValue);

        return {
            fiatValue,
            weekChange,
            weekChangePercent: weekChange.div(weekAgoFiatValue),
        };
    },
);

type HomeAssetNetworkGroup = {
    symbol: NetworkSymbol;
    name: string;
    fiatValue: BigNumber;
    rows: AssetAccounts[];
};

const groupAssetRowsByNetwork = (
    rows: readonly AssetAccounts[],
    fiatValues: ReadonlyMap<AssetAccounts, BigNumber>,
): HomeAssetNetworkGroup[] => {
    const groupsBySymbol = new Map<NetworkSymbol, HomeAssetNetworkGroup>();

    rows.forEach(assetAccounts => {
        const [{ symbol }] = assetAccounts;
        const fiatValue = fiatValues.get(assetAccounts) ?? ZERO_FIAT_VALUE;
        const group = groupsBySymbol.get(symbol);

        if (group === undefined) {
            groupsBySymbol.set(symbol, {
                symbol,
                name: NetworkNameFormatter.format(symbol),
                fiatValue,
                rows: [assetAccounts],
            });

            return;
        }

        group.fiatValue = group.fiatValue.plus(fiatValue);
        group.rows.push(assetAccounts);
    });

    return [...groupsBySymbol.values()].sort(
        (left, right) =>
            right.fiatValue.comparedTo(left.fiatValue) || left.name.localeCompare(right.name),
    );
};

export type HomeAssetSection = {
    key: string;
    heading: { name: string; fiatValue: BigNumber } | undefined;
    rows: readonly AssetAccounts[];
};

const selectPricedRows = createMemoizedSelector(
    [selectHomeAssetRows, selectAssetBalances, selectAssetFiatValues],
    (rows, balances, fiatValues): readonly AssetAccounts[] =>
        returnStableArrayIfEmpty(
            rows.filter(
                assetAccounts =>
                    !isDustAsset(
                        assetAccounts,
                        balances.get(assetAccounts),
                        fiatValues.get(assetAccounts),
                    ),
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectHomeAssetDustRows = createMemoizedSelector(
    [selectHomeAssetRows, selectAssetBalances, selectAssetFiatValues],
    (rows, balances, fiatValues): readonly AssetAccounts[] =>
        returnStableArrayIfEmpty(
            rows.filter(assetAccounts =>
                isDustAsset(
                    assetAccounts,
                    balances.get(assetAccounts),
                    fiatValues.get(assetAccounts),
                ),
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const selectDefaultSections = createMemoizedSelector(
    [selectPricedRows],
    (rows): readonly HomeAssetSection[] => [{ key: 'all', heading: undefined, rows }],
);

const selectNetworkSections = createMemoizedSelector(
    [selectPricedRows, selectAssetFiatValues],
    (rows, fiatValues): readonly HomeAssetSection[] =>
        groupAssetRowsByNetwork(rows, fiatValues).map(group => ({
            key: group.symbol,
            heading: { name: group.name, fiatValue: group.fiatValue },
            rows: group.rows,
        })),
);

export const selectHomeAssetSections = (grouping: HomeAssetGrouping) =>
    grouping === 'networks' ? selectNetworkSections : selectDefaultSections;
