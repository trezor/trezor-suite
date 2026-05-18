import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type YieldFlowContextValues } from '../hooks/useYieldFlow';

export const YieldWithdrawContext = createContext<YieldFlowContextValues | null>(null);
YieldWithdrawContext.displayName = 'YieldWithdrawContext';

export const useYieldWithdrawContext = () =>
    useContext(YieldWithdrawContext) ?? throwError('YieldWithdrawContext used without Context');
