import { createContext, useContext } from 'react';

import { PrecomposeResultFinal } from '@trezor/connect';

type CancelTxContextValues = {
    composedCancelTx: PrecomposeResultFinal | null;
};

export const CancelTxContext = createContext<CancelTxContextValues | null>(null);
CancelTxContext.displayName = 'CancelTxContext';

// Used across rbf form components
// Provide combined context of `react-hook-form` with custom values as RbfContextValues
export const useCancelTxContext = () => {
    const ctx = useContext(CancelTxContext);
    if (ctx === null) throw Error('useCancelTxContext used without Context');

    return ctx;
};
