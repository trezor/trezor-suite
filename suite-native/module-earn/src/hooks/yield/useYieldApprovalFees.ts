import { useMemo } from 'react';

import { type TokenAddress } from '@suite-common/tokens';
import { type ResolvedYieldFlowData, getApprovalContractAddress } from '@suite-common/wallet-core';
import { type AllowanceLimitType } from '@suite-common/wallet-types';

import { type YieldAllowanceFeeTransaction, useYieldAllowanceFees } from './useYieldAllowanceFees';
import { getYieldApprovalAllowanceAmount } from '../../utils/yield/yieldApprovalUtils';

type UseYieldApprovalFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    approvalLimitType: AllowanceLimitType;
    isEnabled: boolean;
    tokenContract: TokenAddress;
};

export const useYieldApprovalFees = ({
    amount,
    approvalLimitType,
    flowData,
    flowKey,
    isEnabled,
    tokenContract,
}: UseYieldApprovalFeesParams) => {
    const approvalTransaction = useMemo<YieldAllowanceFeeTransaction | null>(() => {
        if (!amount || !flowData) {
            return null;
        }

        const allowanceAmount = getYieldApprovalAllowanceAmount({
            amount,
            approvalLimitType,
            tokenContract,
            tokenDecimals: flowData.token.decimals,
            tokenSymbol: flowData.token.symbol,
        });
        const contractAddress = getApprovalContractAddress({
            flowType: 'deposit',
            flowData,
        });
        const spender = flowData.vault.outputToken?.address;

        if (!allowanceAmount || !contractAddress || !spender) {
            return null;
        }

        return {
            allowanceAmount,
            modalState: {
                amount,
                contractAddress,
                spender,
                txType: 'approve',
            },
        };
    }, [amount, approvalLimitType, flowData, tokenContract]);

    return useYieldAllowanceFees({
        flowData,
        flowKey,
        draftTransactionType: 'approve',
        isEnabled,
        transaction: approvalTransaction,
    });
};
