import type { CryptoId } from 'invity-api';

import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    type TradingRootStateWithDeviceAndAccounts,
    type TradingTransaction,
    type TradingType,
    cryptoIdToSymbol,
    isFinalStatus,
    selectDeviceTradingTrades,
    selectTradingSupportedSymbols,
    toTokenCryptoId,
} from '@suite-common/trading';
import {
    getNetwork,
    getNetworkDisplaySymbolName,
    getNetworkType,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
    selectVisibleDeviceAccountsMap,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import {
    getAccountFiatBalance,
    getFiatRateKey,
    parseAccountKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { sortAccountsByNetworksAndAccountTypes } from '@suite-native/accounts';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';
import { type CombinedLabelingState, selectAccountLabel } from '@suite-native/labeling';
import { type TokensRootState } from '@suite-native/tokens';
import {
    type SectionListData,
    getSymbolFromTradeableAsset,
    toCaseAwareCryptoId,
} from '@suite-native/trading-atoms';
import { type MyAsset, type MyAssetRow, type TradeableAsset } from '@suite-native/trading-types';

import { selectIsTradingEnabledForCountry } from './residenceSelectors';
import { type TradingRootState } from '../reducers';

export type CombinedSelectorsRootState = TradingRootStateWithDeviceAndAccounts &
    TokenDefinitionsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokensRootState &
    FeatureFlagsRootState;

const createTradingWithDeviceAndAccountsMemoizedSelector =
    createWeakMapSelector.withTypes<TradingRootStateWithDeviceAndAccounts>();

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
    selectIsFeatureEnabled(state, Feature.trading.exchange, true);

export const selectIsTradingSellEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingSellEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.sell, true);

export const selectIsTradingConciergeEnabled = (
    state: MessageSystemRootState & FeatureFlagsRootState,
) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingConciergeEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.concierge, true);

export const selectIsTradingEnabled = (
    state: MessageSystemRootState & FeatureFlagsRootState & TradingRootState,
) => {
    if (!selectIsTradingEnabledForCountry(state)) {
        return false;
    }

    return (
        selectIsTradingBuyEnabled(state) ||
        selectIsTradingExchangeEnabled(state) ||
        selectIsTradingSellEnabled(state)
    );
};

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
            (state: CombinedSelectorsRootState, tradingType: TradingType) =>
                selectTradingSupportedSymbols(state, tradingType),
            (state: CombinedSelectorsRootState) =>
                selectIsFeatureFlagEnabled(state, FeatureFlag.IsCardanoSendEnabled),
            (_state, tradingType: TradingType) => tradingType,
        ],
        (
            accounts,
            tokenDefinitions,
            fiatRates,
            localCurrency,
            sellCryptoIds,
            isCardanoSendEnabled,
            tradingType,
        ) => {
            if (tradingType === 'buy') {
                return returnStableArrayIfEmpty([]);
            }
            const sellCryptoIdsSet = new Set(sellCryptoIds);

            // TODO: Remove this filter when Cardano send is implemented (#15068)
            // Currently filtering out Cardano accounts and tokens from trading until Cardano send is supported
            const filteredAccounts = accounts.filter(account => {
                const networkType = getNetworkType(account.symbol);

                return networkType !== 'cardano' || isCardanoSendEnabled;
            });

            const sortedAccounts = sortAccountsByNetworksAndAccountTypes(filteredAccounts);

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
                            const cryptoId = toCaseAwareCryptoId(
                                toTokenCryptoId(account.symbol, token.contract),
                            );

                            return {
                                symbol: account.symbol,
                                name: token.name ?? tokenSymbol ?? '',
                                balance: token.balance ?? '0',
                                fiatBalance,
                                tokenSymbol,
                                contract: token.contract as TokenAddress,
                                cryptoId,
                                isEnabled: sellCryptoIdsSet.has(cryptoId),
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

                    const cryptoId = toCaseAwareCryptoId(
                        getNetwork(account.symbol).tradeCryptoId as CryptoId,
                    );

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
                        isEnabled: sellCryptoIdsSet.has(cryptoId),
                    };

                    const assets: MyAsset[] = [
                        ...(parseFloat(account.balance) > 0 ? [accountAsset] : []),
                        ...tokens,
                    ];

                    return {
                        key: `section_${account.key}`,
                        // Todo: this is wrong, correct label is determined by `selectAccountLabel` selector
                        label: account.accountLabel ?? '',
                        sectionData: account,
                        data: assets,
                    };
                })
                .filter(section => section.data.length > 0);
        },
    );

export const selectAccountsWithTokensToSellSectionCondensedListByTradingType =
    createCombinedMemoizedSelector(
        [selectAccountsWithTokensToSellSectionListByTradingType],
        sectionListData =>
            sectionListData.map(section => {
                const data = section.data.filter(({ isEnabled }) => isEnabled) as MyAssetRow[];

                const nonTradeableAssetsCount = section.data.length - data.length;
                if (nonTradeableAssetsCount > 0) {
                    data.push({
                        count: nonTradeableAssetsCount,
                        name: 'non-tradeable-assets',
                        isEnabled: false,
                    });
                }

                return { ...section, data };
            }),
    );

export const selectTradesToWatchByAccount = createTradingWithDeviceAndAccountsMemoizedSelector(
    [selectDeviceTradingTrades, selectVisibleDeviceAccountsMap],
    (deviceTrades, visibleDeviceAccountsMap) => {
        const tradesToWatch = deviceTrades.filter(
            ({ tradeType, data }: TradingTransaction) =>
                data.status && !isFinalStatus(tradeType, data.status),
        );

        const tradesMap = tradesToWatch.reduce((grouped, trade) => {
            const tradeKey =
                'selectedAccountKey' in trade ? trade.selectedAccountKey : trade.sendAccountKey;

            const account = tradeKey ? visibleDeviceAccountsMap.get(tradeKey) : undefined;

            if (account) {
                const existingGroup = grouped.get(account.key);
                if (existingGroup) {
                    existingGroup.trades.push(trade);
                } else {
                    grouped.set(account.key, { account, trades: [trade] });
                }
            }

            return grouped;
        }, new Map<string, { account: Account; trades: TradingTransaction[] }>());

        return {
            tradesByAccount: returnStableArrayIfEmpty(Array.from(tradesMap.values())),
            tradesToWatch: returnStableArrayIfEmpty(tradesToWatch),
        };
    },
);

export const selectVisibleDeviceAccountsByNetworkSymbolSorted =
    createTradingWithDeviceAndAccountsMemoizedSelector(
        [selectVisibleDeviceAccountsByNetworkSymbol],
        accounts => {
            const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts);

            return returnStableArrayIfEmpty(sortedAccounts);
        },
    );

export const selectAccountLabelWithNetworkFallback = (
    state: AccountsRootState & CombinedLabelingState,
    accountKey?: AccountKey,
    cryptoId?: CryptoId,
) => {
    if (accountKey) {
        const {
            accountDescriptor,
            networkSymbol: accountNetworkSymbol,
            deviceStaticSessionId,
        } = parseAccountKey(accountKey);

        const accountLabel = selectAccountLabel(
            state,
            deviceStaticSessionId,
            accountDescriptor,
            accountNetworkSymbol,
        );

        if (accountLabel) {
            return accountLabel;
        }
    }

    if (cryptoId) {
        const networkSymbol = cryptoIdToSymbol(cryptoId);
        if (networkSymbol) {
            return getNetwork(networkSymbol).name;
        }
    }

    return undefined;
};

export const selectTradingProviderConfirmationStatus = (state: TradingRootState) =>
    state.wallet.trading.providerConfirmationStatus;
