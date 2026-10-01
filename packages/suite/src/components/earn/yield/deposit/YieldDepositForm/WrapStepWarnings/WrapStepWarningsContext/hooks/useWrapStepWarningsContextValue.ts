import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldNativeFeeStatus } from '@suite-common/wallet-core';

import { useYieldDepositContext } from 'src/components/earn/yield/deposit/hooks/useYieldDepositContext';
import { type AmountIssue } from 'src/components/earn/yield/hooks/useYieldForm';

export type WrapStepWarningsContextValue = {
    networkSymbol: NetworkSymbol;
    /** Native coin balance in display units. */
    nativeBalance: string;
    amount: string;
    amountIssues: AmountIssue[];
    /**
     * The recommended fee reserve. Max keeps it aside and the step blocks until the balance exceeds
     * it, so it is the only tier the wrap step quotes.
     */
    reserve: string;
    nativeFeeStatus: YieldNativeFeeStatus;
    hasPendingTransaction: boolean;
};

export const useWrapStepWarningsContextValue = (): WrapStepWarningsContextValue => {
    const { account, liveAmount, amountIssues, gasReserve, nativeFeeStatus, pendingTransaction } =
        useYieldDepositContext();

    return {
        networkSymbol: account.symbol,
        nativeBalance: account.formattedBalance,
        amount: liveAmount,
        amountIssues,
        reserve: gasReserve.recommended,
        nativeFeeStatus,
        hasPendingTransaction: pendingTransaction?.type === 'wrap',
    };
};
