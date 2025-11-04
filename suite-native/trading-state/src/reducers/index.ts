import { createWeakMapSelector } from '@suite-common/redux-utils';
import { AccountsRootState } from '@suite-common/wallet-core';

import { TradingRootState } from './tradingSlice';

export type { TradingState, TradingRootState } from './tradingSlice';

export { tradingInitialState, tradingSlice, tradingActions } from './tradingSlice';
export { buyActions } from './buySlice';
export { exchangeActions } from './exchangeSlice';
export { sellActions } from './sellSlice';
export { residenceActions } from './residenceSlice';

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
export const createMemoizedSelectorWithAccounts = createWeakMapSelector.withTypes<
    TradingRootState & AccountsRootState
>();
