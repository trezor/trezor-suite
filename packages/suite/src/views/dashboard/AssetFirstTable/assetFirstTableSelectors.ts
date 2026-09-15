import { type DeviceRootState, selectDeviceStaticSessionId } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    isTokenDefinitionKnown,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountAssetKey,
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    accountsIndex,
    parseAccountAssetKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getAssetDisplaySymbol, getAssetFiatValue, getAssetHolding } from './assetFirstTableUtils';

export type AssetFirstTableState = AccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    TokenDefinitionsRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstTableState>();

type AssetRow = {
    assetKey: AccountAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    displaySymbol: string;
    fiatValue: BigNumber;
};

const ZERO_FIAT_VALUE = new BigNumber(0);

/**
 * Orders the rows the way the design reads: the assets a wallet holds most of first, and every
 * network holding the same asset together underneath it — Ether on Ethereum next to Ether on
 * Arbitrum, however little of it is on either.
 */
const compareRows = (
    left: AssetRow,
    right: AssetRow,
    fiatValueByDisplaySymbol: Map<string, BigNumber>,
) => {
    const leftAssetValue = fiatValueByDisplaySymbol.get(left.displaySymbol) ?? ZERO_FIAT_VALUE;
    const rightAssetValue = fiatValueByDisplaySymbol.get(right.displaySymbol) ?? ZERO_FIAT_VALUE;

    return (
        rightAssetValue.comparedTo(leftAssetValue) ||
        left.displaySymbol.localeCompare(right.displaySymbol) ||
        right.fiatValue.comparedTo(left.fiatValue) ||
        left.symbol.localeCompare(right.symbol)
    );
};

/**
 * Every asset the selected wallet holds, as one key per asset and network, ordered for display.
 *
 * Which assets exist comes from `accountsIndex`; what belongs on the dashboard is settled here,
 * because it depends on state the index knows nothing about — which networks the user enabled, and
 * which tokens have a definition. Memoized on the index's snapshot, so the ordering is done once
 * per write to the accounts rather than once per render.
 */
export const selectAssetFirstTableKeys = createMemoizedSelector(
    [
        (state: AssetFirstTableState) => accountsIndex.read(state).groups.byAsset,
        selectDeviceStaticSessionId,
        selectEnabledNetworks,
        selectCurrentFiatRates,
        selectBaseCurrency,
        selectTokenDefinitions,
    ],
    (
        assetGroups,
        deviceStaticSessionId,
        enabledNetworks,
        currentFiatRates,
        baseCurrencyCode,
        tokenDefinitions,
    ): readonly AccountAssetKey[] => {
        if (deviceStaticSessionId === null) {
            return returnStableArrayIfEmpty([]);
        }

        const rows: AssetRow[] = [];
        const fiatValueByDisplaySymbol = new Map<string, BigNumber>();

        assetGroups.forEach((group, assetKey) => {
            const parts = parseAccountAssetKey(assetKey);

            if (
                parts?.deviceState !== deviceStaticSessionId ||
                !enabledNetworks.includes(parts.symbol)
            ) {
                return;
            }

            const { symbol, contractAddress } = parts;

            // An unknown token is one nothing vouches for — the same rule the network-first table
            // applies before it adds a token to a network's balance.
            const isUnknownToken =
                contractAddress !== undefined &&
                !isTokenDefinitionKnown(
                    tokenDefinitions?.[symbol]?.coin?.data,
                    symbol,
                    contractAddress,
                );

            if (isUnknownToken) {
                return;
            }

            const visibleAccounts = group.entities.filter((account: Account) => account.visible);

            if (visibleAccounts.length === 0) {
                return;
            }

            const { cryptoBalance, tokenInfo } = getAssetHolding(visibleAccounts, contractAddress);
            const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, contractAddress);
            const fiatValue =
                getAssetFiatValue(cryptoBalance, currentFiatRates?.[fiatRateKey]?.rate) ??
                ZERO_FIAT_VALUE;
            const displaySymbol = getAssetDisplaySymbol({ symbol, tokenInfo });

            rows.push({ assetKey, symbol, contractAddress, displaySymbol, fiatValue });
            fiatValueByDisplaySymbol.set(
                displaySymbol,
                (fiatValueByDisplaySymbol.get(displaySymbol) ?? ZERO_FIAT_VALUE).plus(fiatValue),
            );
        });

        return returnStableArrayIfEmpty(
            rows
                .sort((left, right) => compareRows(left, right, fiatValueByDisplaySymbol))
                .map(row => row.assetKey),
        );
    },
);
