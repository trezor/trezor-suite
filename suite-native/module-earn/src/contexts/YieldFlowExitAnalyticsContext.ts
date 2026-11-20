import { createContext } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldPositionFlowType } from '@suite-common/wallet-core';

export type YieldFlowExitContext = {
    flowType: YieldPositionFlowType;
    networkSymbol?: NetworkSymbol;
    vaultId?: string;
    isCompleted: boolean;
};

export const YieldFlowExitAnalyticsContext = createContext<
    ((context: YieldFlowExitContext) => void) | null
>(null);
