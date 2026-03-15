import { createContext, useContext } from 'react';

import type { YieldDto } from '@suite-common/earn-api';
import type { Account } from '@suite-common/wallet-types';

import type { AllowanceProvider } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/types';

import type { UseYieldSupplyFlowResult, YieldSupplyAvailableToken } from './types';

export type YieldSupplyContextValue = {
    account: Account;
    vault: YieldDto;
    yieldId: string;
    token: YieldSupplyAvailableToken;
    provider: AllowanceProvider;
    supply: UseYieldSupplyFlowResult;
};

export const YieldSupplyContext = createContext<YieldSupplyContextValue | null>(null);
YieldSupplyContext.displayName = 'YieldSupplyContext';

export const useYieldSupplyContext = () => {
    const context = useContext(YieldSupplyContext);

    if (context === null) {
        throw new Error('useYieldSupplyContext must be used within YieldSupplyContext');
    }

    return context;
};
