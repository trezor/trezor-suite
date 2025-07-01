import { createWeakMapSelector } from '@suite-common/redux-utils';
import { AccountsRootState } from '@suite-common/wallet-core';

import { TradingRootState } from './tradingSlice';

export type { TradingState, TradingRootState } from './tradingSlice';

export { initialState, tradingSlice, tradingActions } from './tradingSlice';
export { buyActions } from './buySlice';

export const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
export const createMemoizedSelectorWithAccounts = createWeakMapSelector.withTypes<
    TradingRootState & AccountsRootState
>();
