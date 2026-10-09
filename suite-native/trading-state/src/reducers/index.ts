import { type NetworksRootState } from '@suite-common/networks';
import { type AccountsRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TradingRootState } from '@suite-native/trading-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type { TradingState, TradingRootState } from '@suite-native/trading-types';
export { tradingInitialState } from '@suite-native/trading-consts';

export { tradingSlice, tradingActions } from './tradingSlice';
export { buyActions, buyReducer } from './buySlice';
export { exchangeActions, exchangeReducer } from './exchangeSlice';
export { sellActions, sellReducer } from './sellSlice';
export { residenceActions, residenceReducer } from './residenceSlice';

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
export const createMemoizedSelectorWithWalletSettings = createWeakMapSelector.withTypes<
    TradingRootState & WalletSettingsRootState
>();
export const createMemoizedSelectorWithAccounts = createWeakMapSelector.withTypes<
    TradingRootState & AccountsRootState
>();
export const createTradingWithFeatureFlagsMemoizedSelector = createWeakMapSelector.withTypes<
    TradingRootState & FeatureFlagsRootState & NetworksRootState
>();
