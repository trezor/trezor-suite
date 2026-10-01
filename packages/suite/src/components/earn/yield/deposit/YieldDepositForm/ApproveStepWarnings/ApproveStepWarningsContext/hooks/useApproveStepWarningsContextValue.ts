import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldGasReserve,
    type YieldNativeFeeStatus,
    splitYieldPendingTransaction,
} from '@suite-common/wallet-core';

import { useYieldDepositContext } from 'src/components/earn/yield/deposit/hooks/useYieldDepositContext';
import { type AmountIssue } from 'src/components/earn/yield/hooks/useYieldForm';

export type ApproveStepWarningsContextValue = {
    networkSymbol: NetworkSymbol;
    amountIssues: AmountIssue[];
    gasReserve: YieldGasReserve;
    nativeFeeStatus: YieldNativeFeeStatus;
    hasPendingTransaction: boolean;
};

export const useApproveStepWarningsContextValue = (): ApproveStepWarningsContextValue => {
    const { account, amountIssues, gasReserve, nativeFeeStatus, pendingTransaction } =
        useYieldDepositContext();
    const { approvalPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'deposit',
    );

    return {
        networkSymbol: account.symbol,
        amountIssues,
        gasReserve,
        nativeFeeStatus,
        hasPendingTransaction: !!approvalPendingTransaction,
    };
};
