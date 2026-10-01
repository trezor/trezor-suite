import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldGasReserve,
    type YieldNativeFeeStatus,
    splitYieldPendingTransaction,
} from '@suite-common/wallet-core';

import { useModifyApprovalHandler } from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useModifyApprovalHandler';
import { useYieldDepositContext } from 'src/components/earn/yield/deposit/hooks/useYieldDepositContext';
import { type AmountIssue } from 'src/components/earn/yield/hooks/useYieldForm';

export type ActionStepWarningsContextValue = {
    networkSymbol: NetworkSymbol;
    amountIssues: AmountIssue[];
    gasReserve: YieldGasReserve;
    nativeFeeStatus: YieldNativeFeeStatus;
    isApprovalInsufficient: boolean;
    hasPendingTransaction: boolean;
    onModifyApproval: () => void;
};

export const useActionStepWarningsContextValue = (): ActionStepWarningsContextValue => {
    const {
        account,
        amountIssues,
        gasReserve,
        nativeFeeStatus,
        isApprovalInsufficient,
        pendingTransaction,
    } = useYieldDepositContext();
    const onModifyApproval = useModifyApprovalHandler();
    const { actionPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'deposit',
    );

    return {
        networkSymbol: account.symbol,
        amountIssues,
        gasReserve,
        nativeFeeStatus,
        isApprovalInsufficient,
        hasPendingTransaction: !!actionPendingTransaction,
        onModifyApproval,
    };
};
