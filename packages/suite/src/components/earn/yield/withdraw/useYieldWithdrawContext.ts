import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type YieldWithdrawContextValues } from './useYieldWithdraw';

export const YieldWithdrawContext = createContext<YieldWithdrawContextValues | null>(null);
YieldWithdrawContext.displayName = 'YieldWithdrawContext';

export const useYieldWithdrawContext = () =>
    useContext(YieldWithdrawContext) ?? throwError('YieldWithdrawContext used without Context');
