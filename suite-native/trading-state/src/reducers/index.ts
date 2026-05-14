import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TradingRootState } from '@suite-native/trading-types';

export type { TradingState, TradingRootState } from '@suite-native/trading-types';
export { tradingInitialState } from '@suite-native/trading-consts';

export { tradingSlice, tradingActions } from './tradingSlice';
export { buyActions, buyReducer } from './buySlice';
export { exchangeActions, exchangeReducer } from './exchangeSlice';
export { sellActions, sellReducer } from './sellSlice';
export { residenceActions, residenceReducer } from './residenceSlice';

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
export const createMemoizedSelectorWithAccounts = createWeakMapSelector.withTypes<
    TradingRootState & AccountsRootState
>();
export const createTradingWithFeatureFlagsMemoizedSelector = createWeakMapSelector.withTypes<
    TradingRootState & FeatureFlagsRootState
>();
