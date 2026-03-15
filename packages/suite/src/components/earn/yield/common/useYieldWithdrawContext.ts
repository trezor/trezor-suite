import { createContext, useContext } from 'react';

import type { YieldDto } from '@suite-common/earn-api';
import type { Account } from '@suite-common/wallet-types';

import type { AllowanceProvider } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/types';

import type {
    UseYieldWithdrawFlowResult,
    YieldWithdrawReceiptToken,
    YieldWithdrawToken,
} from './types';

export type YieldWithdrawContextValue = {
    account: Account;
    vault: YieldDto;
    yieldId: string;
    token: YieldWithdrawToken;
    receiptToken: YieldWithdrawReceiptToken;
    provider: AllowanceProvider;
    suppliedAmount: string;
    withdraw: UseYieldWithdrawFlowResult;
};

export const YieldWithdrawContext = createContext<YieldWithdrawContextValue | null>(null);
YieldWithdrawContext.displayName = 'YieldWithdrawContext';

export const useYieldWithdrawContext = () => {
    const context = useContext(YieldWithdrawContext);

    if (context === null) {
        throw new Error('useYieldWithdrawContext must be used within YieldWithdrawContext');
    }

    return context;
};
