import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TradingRootState } from '@suite-native/trading-types';

export type { TradingState, TradingRootState } from '@suite-native/trading-types';
export { tradingInitialState } from '@suite-native/trading-consts';

export { tradingSlice, tradingActions } from './tradingSlice';
export { buyActions } from './buySlice';
export { exchangeActions } from './exchangeSlice';
export { sellActions } from './sellSlice';
export { residenceActions } from './residenceSlice';

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
export const createMemoizedSelectorWithAccounts = createWeakMapSelector.withTypes<
    TradingRootState & AccountsRootState
>();
export const createTradingWithFeatureFlagsMemoizedSelector = createWeakMapSelector.withTypes<
    TradingRootState & FeatureFlagsRootState
>();
