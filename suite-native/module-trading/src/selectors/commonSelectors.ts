import {
    Feature,
    MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

import { TradingRootState } from '../tradingSlice';

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

// trade for opening in detail
export const selectTradeToBeOpened = (state: TradingRootState) => {
    const orderId = state.wallet.tradingNew.tradeOrderIdToBeOpened;
    if (!orderId) return undefined;

    return state.wallet.tradingNew.trades.find(trade => trade.data.orderId === orderId);
};
