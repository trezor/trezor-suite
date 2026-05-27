import { type EarnParams } from '@suite/router';
import {
    type YieldFlowCompleteValue,
    getConvertedOutputTokenBalanceToInputTokenAmount,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
};

export type YieldWithdrawContextValues = YieldFlowContextValues & {
    completedInput: YieldFlowCompleteValue;
    completedOutput?: YieldFlowCompleteValue;
};

export const useYieldWithdraw = ({
    account,
    routeParams,
}: UseYieldWithdrawProps): YieldWithdrawContextValues | null => {
    const flowResult = useYieldFlow({ account, routeParams, flowType: 'withdraw' });
    const { vault, token, receiptToken } = flowResult;

    if (!token || !receiptToken || !vault) {
        return null;
    }

    const { completedAmount, withdrawInputUnit } = flowResult;
    const isSharesInput = withdrawInputUnit === 'shares';
    const pricePerShareState = vault.state?.pricePerShareState;
    const completedInput = {
        token: isSharesInput ? receiptToken : token,
        amount: completedAmount,
    };
    const completedOutput = isSharesInput
        ? {
              token,
              amount: pricePerShareState
                  ? getConvertedOutputTokenBalanceToInputTokenAmount({
                        networkSymbol: token.networkSymbol,
                        token,
                        outputToken: receiptToken,
                        outputTokenBalance: completedAmount,
                        pricePerShareState,
                    })
                  : completedAmount,
          }
        : undefined;

    return {
        ...flowResult,
        token,
        receiptToken,
        vault,
        completedInput,
        completedOutput,
    };
};
