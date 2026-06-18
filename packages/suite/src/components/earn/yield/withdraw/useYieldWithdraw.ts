import { useCallback, useState } from 'react';

import { type EarnParams } from '@suite/router';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import {
    type YieldFlowCompleteValue,
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
    vault: YieldDto;
};

export type YieldWithdrawContextValues = Omit<YieldFlowContextValues, 'flowType'> & {
    flowType: YieldWithdrawFlowType;
    completedInput: YieldFlowCompleteValue;
    completedOutput?: YieldFlowCompleteValue;
    toggleWithdrawFlowType: () => void;
};

export const useYieldWithdraw = ({
    account,
    routeParams,
    vault,
}: UseYieldWithdrawProps): YieldWithdrawContextValues | null => {
    const [flowType, setFlowType] = useState<YieldWithdrawFlowType>('withdraw');

    const flowResult = useYieldFlow({
        account,
        routeParams,
        vault,
        flowType,
    });
    const { token, receiptToken } = flowResult;

    const toggleWithdrawFlowType = useCallback(() => {
        setFlowType(prev => (prev === 'redeem' ? 'withdraw' : 'redeem'));
    }, []);

    if (!token || !receiptToken) {
        return null;
    }

    const { completedAmount } = flowResult;
    const isSharesInput = flowType === 'redeem';
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
        flowType,
        token,
        receiptToken,
        vault,
        completedInput,
        completedOutput,
        toggleWithdrawFlowType,
    };
};
