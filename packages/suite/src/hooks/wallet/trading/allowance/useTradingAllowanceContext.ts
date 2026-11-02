import { useContext } from 'react';

import { throwError } from '@trezor/utils';

import { TradingAllowanceContext } from './TradingAllowanceContext';

export const useTradingAllowanceContext = () =>
    useContext(TradingAllowanceContext) ??
    throwError('useTradingAllowanceContext must be used within TradingAllowanceContext.Provider');
