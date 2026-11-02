import { createContext } from 'react';

import { type useAllowanceTxTracking } from '@suite-common/wallet-core';

import { type useTradingAllowanceState } from './useTradingAllowanceState';

export type TradingAllowanceContextValue = {
    tx: ReturnType<typeof useAllowanceTxTracking>;
    state: ReturnType<typeof useTradingAllowanceState>;
};

export const TradingAllowanceContext = createContext<TradingAllowanceContextValue | null>(null);
TradingAllowanceContext.displayName = 'TradingAllowanceContext';
