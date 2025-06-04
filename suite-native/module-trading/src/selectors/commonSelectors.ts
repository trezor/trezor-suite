import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { TradingType } from '@suite-common/trading';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

import { TradingRootState } from '../tradingSlice';

const createFeatureFlagsMemoizedSelector = createWeakMapSelector.withTypes<
    MessageSystemRootState & FeatureFlagsRootState
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
