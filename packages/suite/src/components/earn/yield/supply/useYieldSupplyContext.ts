import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type YieldFlowContextValues } from '../hooks/useYieldFlow';

export const YieldSupplyContext = createContext<YieldFlowContextValues | null>(null);
YieldSupplyContext.displayName = 'YieldSupplyContext';

export const useYieldSupplyContext = () =>
    useContext(YieldSupplyContext) ?? throwError('YieldSupplyContext used without Context');
