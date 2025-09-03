import { CryptoId } from 'invity-api';

import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    TradingType,
    selectTradingExchangeSellCryptoIds,
    selectTradingSellSellCryptoIds,
    toTokenCryptoId,
} from '@suite-common/trading';
import { getNetwork, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { getAccountFiatBalance, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { sortAccountsByNetworksAndAccountTypes } from '@suite-native/accounts/src/utils';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { TokensRootState } from '@suite-native/tokens';

import { SectionListData } from '../hooks/general/useSectionList';
import { TradingRootState } from '../reducers';
import { MyAsset, TradeableAsset } from '../types/general';
import { getSymbolFromTradeableAsset } from '../utils/general/tradeableAssetUtils';

export type CombinedSelectorsRootState = TradingRootState &
    AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokensRootState;

const createCombinedMemoizedSelector =
    createWeakMapSelector.withTypes<CombinedSelectorsRootState>();

const createFeatureFlagsMemoizedSelector = createWeakMapSelector.withTypes<
    MessageSystemRootState & FeatureFlagsRootState
>();

const createFiatRatesMemoizedSelector = createWeakMapSelector.withTypes<
    FiatRatesRootState & WalletSettingsRootState & TradingRootState
>();

export const selectTradingEnvironment = (state: TradingRootState) =>
    state.wallet.trading.tradingEnvironment;

export const selectIsTradingBuyEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingBuyEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.buy, true);

export const selectIsTradingExchangeEnabled = (
    state: MessageSystemRootState & FeatureFlagsRootState,
) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingExchangeEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.exchange, false);

export const selectIsTradingSellEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingSellEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.sell, false);

export const selectIsTradingEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsTradingBuyEnabled(state) ||
    selectIsTradingExchangeEnabled(state) ||
    selectIsTradingSellEnabled(state);

export const selectEnabledTradingTypes = createFeatureFlagsMemoizedSelector(
    [selectIsTradingBuyEnabled, selectIsTradingExchangeEnabled, selectIsTradingSellEnabled],
    (isTradingBuyEnabled, isTradingExchangeEnabled, isTradingSellEnabled) => {
        const enabledTypes: TradingType[] = [];

        if (isTradingBuyEnabled) {
            enabledTypes.push('buy');
        }
        if (isTradingExchangeEnabled) {
            enabledTypes.push('exchange');
        }
        if (isTradingSellEnabled) {
            enabledTypes.push('sell');
        }

        return enabledTypes;
    },
);

export const selectIsTradingBlacklisted = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.trading.restrictions.blacklist, false);

// trade for opening in detail
export const selectTradeToBeOpened = (state: TradingRootState) => {
    const orderId = state.wallet.trading.tradeOrderIdToBeOpened;
    if (!orderId) return undefined;

    return state.wallet.trading.trades.find(trade => trade.data.orderId === orderId);
};

export const selectIsAmountInputActive = (state: TradingRootState) =>
    state.wallet.trading.isAmountInputActive;

export const selectActiveTradingType = (state: TradingRootState) =>
    state.wallet.trading.activeTradingType;

export const selectAmountInBaseFiatCurrency = createFiatRatesMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectBaseCurrency,
        (_state, asset: TradeableAsset) => asset,
        (_state, _symbol, amount: string) => amount,
    ],
    (fiatRates, localCurrency, asset, amount) => {
        const symbol = getSymbolFromTradeableAsset(asset);

        if (!symbol || !fiatRates) {
            return undefined;
        }

        const fiatRateKey = getFiatRateKey(symbol, localCurrency, asset.contractAddress);
        const rate = fiatRates[fiatRateKey]?.rate;

        if (!rate) {
            return undefined;
        }

        return toFiatCurrency({ amount, rate }) || undefined;
    },
);

export const selectAccountsWithTokensToSellSectionListByTradingType =
    createCombinedMemoizedSelector(
        [
            selectVisibleDeviceAccounts,
            selectTokenDefinitions,
            selectCurrentFiatRates,
            selectBaseCurrency,
            selectTradingSellSellCryptoIds,
            selectTradingExchangeSellCryptoIds,
            (_state, tradingType: TradingType) => tradingType,
        ],
        (
            accounts,
            tokenDefinitions,
            fiatRates,
            localCurrency,
            sellSellCryptoIds,
            exchangeSellCryptoIds,
            tradingType,
        ) => {
            if (tradingType === 'buy') {
                return returnStableArrayIfEmpty([]);
            }

            const sellCryptoIds =
                tradingType === 'sell' ? sellSellCryptoIds : exchangeSellCryptoIds;

            const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts);

            return sortedAccounts
                .map<SectionListData<MyAsset, Account>[number]>((account: Account) => {
                    const networkTokenDefinitions = getSimpleCoinDefinitionsByNetwork(
                        tokenDefinitions,
                        account.symbol,
                    );

                    const knownTokens = filterKnownTokens(
                        networkTokenDefinitions,
                        account.symbol,
                        account.tokens ?? [],
                    );

                    const tokensWithBalance = knownTokens.filter(
                        token => parseFloat(token?.balance ?? '0') > 0,
                    );

                    const tokens: MyAsset[] = tokensWithBalance
                        .map(token => {
                            const fiatRateKey = getFiatRateKey(
                                account.symbol,
                                localCurrency,
                                token.contract as TokenAddress,
                            );
                            const rate = fiatRates?.[fiatRateKey]?.rate;
                            const fiatBalance =
                                rate && token.balance
                                    ? toFiatCurrency({ amount: token.balance, rate })
                                    : null;

                            const tokenSymbol =
                                (token.symbol?.toUpperCase() as TokenSymbol) ?? null;
                            const cryptoId = toTokenCryptoId(account.symbol, token.contract);

                            return {
                                symbol: account.symbol,
                                name: token.name ?? token.symbol ?? '',
                                balance: token.balance ?? '0',
                                fiatBalance,
                                tokenSymbol,
                                contract: token.contract as TokenAddress,
                                cryptoId,
                                isEnabled: sellCryptoIds.includes(cryptoId),
                                fiatRateKey,
                                rate,
                            };
                        })
                        .sort((a, b) => {
                            // sellable (isEnabled) assets first
                            if (a.isEnabled !== b.isEnabled) {
                                return a.isEnabled ? -1 : 1;
                            }

                            // bigger fiatBalance first
                            const aFiatBalance = a.fiatBalance ? Number(a.fiatBalance) : 0;
                            const bFiatBalance = b.fiatBalance ? Number(b.fiatBalance) : 0;

                            return bFiatBalance - aFiatBalance;
                        });

                    const cryptoId = getNetwork(account.symbol).tradeCryptoId as CryptoId;

                    const accountAsset = {
                        symbol: account.symbol,
                        name: getNetworkDisplaySymbolName(account.symbol),
                        balance: account.formattedBalance,
                        fiatBalance: getAccountFiatBalance({
                            account,
                            baseCurrencyCode: localCurrency,
                            rates: fiatRates,
                            shouldIncludeStaking: false,
                            shouldIncludeTokens: false,
                        }),
                        cryptoId,
                        isEnabled: sellCryptoIds.includes(cryptoId),
                    };

                    const assets: MyAsset[] = [
                        ...(parseFloat(account.balance) > 0 ? [accountAsset] : []),
                        ...tokens,
                    ];

                    return {
                        key: `section_${account.key}`,
                        label: account.accountLabel ?? '',
                        sectionData: account,
                        data: assets,
                    };
                })
                .filter(section => section.data.length > 0);
        },
    );
