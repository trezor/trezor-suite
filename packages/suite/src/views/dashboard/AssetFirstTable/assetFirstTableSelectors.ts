import { type DeviceRootState, selectDeviceStaticSessionId } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetHolding,
    type AssetHoldingsRootState,
    type AssetKey,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    assetHoldingsIndex,
    parseAssetKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectLastWeekFiatRates,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import {
    type AssetFirstGrouping,
    type AssetFirstNetworkGroup,
    groupAssetRowsByNetwork,
} from './assetFirstTableGrouping';
import { getAssetDisplaySymbol, sumAssetHoldings } from './assetFirstTableUtils';

export type AssetFirstTableState = AssetHoldingsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

export type AssetRow = {
    assetKey: AssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string;
    cryptoBalance: BigNumber;
    tokenInfo: TokenInfo | undefined;
    fiatValue: BigNumber;
    weekAgoFiatValue: BigNumber;
};

const ZERO_FIAT_VALUE = new BigNumber(0);

const builtRows = new Map<AssetKey, AssetRow>();

const isSameRow = (previous: AssetRow, next: AssetRow) =>
    previous.cryptoBalance.eq(next.cryptoBalance) &&
    previous.fiatValue.eq(next.fiatValue) &&
    previous.weekAgoFiatValue.eq(next.weekAgoFiatValue) &&
    previous.tokenInfo === next.tokenInfo &&
    previous.displaySymbol === next.displaySymbol;

const settleRow = (next: AssetRow): AssetRow => {
    const previous = builtRows.get(next.assetKey);
    const row = previous && isSameRow(previous, next) ? previous : next;
    builtRows.set(next.assetKey, row);

    return row;
};

const compareRows = (left: AssetRow, right: AssetRow) =>
    right.fiatValue.comparedTo(left.fiatValue) ||
    left.displaySymbol.localeCompare(right.displaySymbol) ||
    left.symbol.localeCompare(right.symbol);

export const selectAssetFirstRows = createMemoizedSelector(
    [
        (state: AssetFirstTableState) => assetHoldingsIndex.read(state).groups.byAsset,
        selectDeviceStaticSessionId,
        selectEnabledNetworks,
        selectCurrentFiatRates,
        selectLastWeekFiatRates,
        selectBaseCurrency,
    ],
    (
        assetGroups,
        deviceStaticSessionId,
        enabledNetworks,
        currentFiatRates,
        lastWeekFiatRates,
        baseCurrencyCode,
    ): readonly AssetRow[] => {
        if (deviceStaticSessionId === null) {
            return returnStableArrayIfEmpty([]);
        }

        const rows: AssetRow[] = [];

        assetGroups.forEach((group, assetKey) => {
            const parts = parseAssetKey(assetKey);

            if (
                parts?.deviceState !== deviceStaticSessionId ||
                !enabledNetworks.includes(parts.symbol)
            ) {
                return;
            }

            const { symbol, contractAddress } = parts;

            const visibleHoldings = group.entities.filter(
                (holding: AssetHolding) => holding.isAccountVisible,
            );

            if (visibleHoldings.length === 0) {
                return;
            }

            const { cryptoBalance, tokenInfo } = sumAssetHoldings(visibleHoldings);
            const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
            const fiatValue =
                toFiatCurrency({
                    amount: cryptoBalance.toFixed(),
                    rate: currentFiatRates?.[fiatRateKey]?.rate,
                }) ?? ZERO_FIAT_VALUE;
            const displaySymbol = getAssetDisplaySymbol({ symbol, tokenInfo });

            rows.push(
                settleRow({
                    assetKey,
                    symbol,
                    contractAddress,
                    displaySymbol,
                    cryptoBalance,
                    tokenInfo,
                    fiatValue,
                    weekAgoFiatValue:
                        toFiatCurrency({
                            amount: cryptoBalance.toFixed(),
                            rate: lastWeekFiatRates?.[fiatRateKey]?.rate,
                        }) ?? ZERO_FIAT_VALUE,
                }),
            );
        });

        return returnStableArrayIfEmpty(rows.sort(compareRows));
    },
);

export type AssetFirstTotals = {
    fiatValue: BigNumber;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const getAssetFirstTotals = (rows: readonly AssetRow[]): AssetFirstTotals => {
    const fiatValue = rows.reduce((total, row) => total.plus(row.fiatValue), ZERO_FIAT_VALUE);

    if (!rows.some(row => row.weekAgoFiatValue.gt(0))) {
        return { fiatValue, weekChange: undefined, weekChangePercent: undefined };
    }

    const weekAgoFiatValue = rows.reduce(
        (total, row) => total.plus(row.weekAgoFiatValue),
        ZERO_FIAT_VALUE,
    );
    const weekChange = fiatValue.minus(weekAgoFiatValue);

    return {
        fiatValue,
        weekChange,
        weekChangePercent: weekChange.div(weekAgoFiatValue).times(100),
    };
};

export type AssetFirstTableView =
    | { grouping: 'default'; rows: readonly AssetRow[] }
    | { grouping: 'networks'; groups: readonly AssetFirstNetworkGroup[] };

const selectDefaultView = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): AssetFirstTableView => ({ grouping: 'default', rows }),
);

const selectNetworksView = createMemoizedSelector(
    [selectAssetFirstRows],
    (rows): AssetFirstTableView => ({
        grouping: 'networks',
        groups: groupAssetRowsByNetwork(rows),
    }),
);

export const selectAssetFirstTableView = (grouping: AssetFirstGrouping) =>
    grouping === 'networks' ? selectNetworksView : selectDefaultView;
