import { useCallback, useEffect, useState } from 'react';

import { type EarnParams } from '@suite/router';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type YieldFlowCompleteValue, type YieldWithdrawFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { getYieldWithdrawCompletedValues } from './getYieldWithdrawCompletedValues';
import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
    vault: YieldDtoV2;
};

export type YieldWithdrawContextValues = Omit<YieldFlowContextValues, 'flowType'> & {
    flowType: YieldWithdrawFlowType;
    completedInput: YieldFlowCompleteValue;
    completedOutput: YieldFlowCompleteValue;
    toggleWithdrawFlowType: () => void;
    selectMaxWithdraw: () => void;
    isMaxWithdrawInfoVisible: boolean;
};

export const useYieldWithdraw = ({
    account,
    routeParams,
    vault,
}: UseYieldWithdrawProps): YieldWithdrawContextValues | null => {
    const [flowType, setFlowType] = useState<YieldWithdrawFlowType>('withdraw');
    const [isMaxWithdrawSelectionPending, setIsMaxWithdrawSelectionPending] = useState(false);
    const [maxWithdrawInfoAmount, setMaxWithdrawInfoAmount] = useState<string | null>(null);

    const flowResult = useYieldFlow({
        account,
        routeParams,
        vault,
        flowType,
    });
    const { token, receiptToken, depositedSharesAmount, setAmountInput, liveAmount, flow } =
        flowResult;

    const toggleWithdrawFlowType = useCallback(() => {
        setIsMaxWithdrawSelectionPending(false);
        setMaxWithdrawInfoAmount(null);
        setFlowType(prev => (prev === 'redeem' ? 'withdraw' : 'redeem'));
    }, []);

    const selectMaxWithdraw = useCallback(() => {
        if (flowType === 'redeem') {
            setAmountInput(depositedSharesAmount);

            return;
        }

        setIsMaxWithdrawSelectionPending(true);
        setFlowType('redeem');
    }, [depositedSharesAmount, flowType, setAmountInput]);

    // The flow resets the form while switching units, so fill it only after redeem is ready.
    useEffect(() => {
        if (
            !isMaxWithdrawSelectionPending ||
            flowType !== 'redeem' ||
            flow.currentStep !== 'action'
        ) {
            return;
        }

        setAmountInput(depositedSharesAmount);
        setMaxWithdrawInfoAmount(depositedSharesAmount);
        setIsMaxWithdrawSelectionPending(false);
    }, [
        depositedSharesAmount,
        flow.currentStep,
        flowType,
        isMaxWithdrawSelectionPending,
        setAmountInput,
    ]);

    useEffect(() => {
        if (maxWithdrawInfoAmount !== null && liveAmount !== maxWithdrawInfoAmount) {
            setMaxWithdrawInfoAmount(null);
        }
    }, [liveAmount, maxWithdrawInfoAmount]);

    if (!token || !receiptToken) {
        return null;
    }

    const { completedAmount, unwrappedAmount } = flowResult;
    const { input: completedInput, output: completedOutput } = getYieldWithdrawCompletedValues({
        networkSymbol: account.symbol,
        flowType,
        completedAmount,
        unwrappedAmount,
        token,
        receiptToken,
        pricePerShareState: vault.state?.pricePerShareState,
    });

    return {
        ...flowResult,
        flowType,
        token,
        receiptToken,
        vault,
        completedInput,
        completedOutput,
        toggleWithdrawFlowType,
        selectMaxWithdraw,
        isMaxWithdrawInfoVisible: maxWithdrawInfoAmount !== null,
    };
};
