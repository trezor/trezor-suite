import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { TradingType } from '@suite-common/trading';
import {
    FiatRatesRootState,
    WalletSettingsRootState,
    selectCurrentFiatRates,
    selectLocalCurrency,
} from '@suite-common/wallet-core';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

import { TradingRootState } from '../reducers';
import { TradeableAsset } from '../types/general';
import { getSymbolFromTradeableAsset } from '../utils/general/tradeableAssetUtils';

const createFeatureFlagsMemoizedSelector = createWeakMapSelector.withTypes<
    MessageSystemRootState & FeatureFlagsRootState
>();

const createFiatRatesMemoizedSelector = createWeakMapSelector.withTypes<
    FiatRatesRootState & WalletSettingsRootState & TradingRootState
>();

export const selectTradingEnvironment = (state: TradingRootState) =>
    state.wallet.tradingNew.tradingEnvironment;

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
    const orderId = state.wallet.tradingNew.tradeOrderIdToBeOpened;
    if (!orderId) return undefined;

    return state.wallet.tradingNew.trades.find(trade => trade.data.orderId === orderId);
};

export const selectIsAmountInputActive = (state: TradingRootState) =>
    state.wallet.tradingNew.isAmountInputActive;

export const selectActiveTradingType = (state: TradingRootState) =>
    state.wallet.tradingNew.activeTradingType;

export const selectAmountInBaseFiatCurrency = createFiatRatesMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectLocalCurrency,
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
