import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type YieldFlowContextValues } from '../hooks/useYieldFlow';

export const YieldDepositContext = createContext<YieldFlowContextValues | null>(null);
YieldDepositContext.displayName = 'YieldDepositContext';

export const useYieldDepositContext = () =>
    useContext(YieldDepositContext) ?? throwError('YieldDepositContext used without Context');
