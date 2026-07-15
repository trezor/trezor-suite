import { createContext, useContext } from 'react';

import { type FormState } from '@suite-common/wallet-types';
import { type PrecomposeResultFinal } from '@trezor/connect';
import { throwError } from '@trezor/utils';

type CancelTxContextValues = {
    composedCancelTx: PrecomposeResultFinal | null;
    cancelFormState: FormState | null;
    isComposing: boolean;
};

export const CancelTxContext = createContext<CancelTxContextValues | null>(null);
CancelTxContext.displayName = 'CancelTxContext';

// Shares the composed cancel (RBF) transaction and its FormState between CancelTransactionModal
// and the components it renders below it (CancelTransaction, CancelTransactionButton).
export const useCancelTxContext = () =>
    useContext(CancelTxContext) ?? throwError('useCancelTxContext used without Context');
