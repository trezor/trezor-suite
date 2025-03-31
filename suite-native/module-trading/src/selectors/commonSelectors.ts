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
    selectIsFeatureEnabled(state, Feature.trading.buy, false);

export const selectIsTradingSwapEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingSwapEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.swap, false);

export const selectIsTradingSellEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsFeatureFlagEnabled(state, FeatureFlag.IsTradingSellEnabled) ||
    selectIsFeatureEnabled(state, Feature.trading.sell, false);

export const selectIsTradingEnabled = (state: MessageSystemRootState & FeatureFlagsRootState) =>
    selectIsTradingBuyEnabled(state) ||
    selectIsTradingSwapEnabled(state) ||
    selectIsTradingSellEnabled(state);
