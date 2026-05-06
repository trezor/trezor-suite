import { fromWei, toWei } from 'web3-utils';

import { tokenSupportsIncreasingAllowance } from '@suite-common/trading';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { YIELD_FLOW_STEPS, type YieldFlowStepId } from '@suite-common/wallet-core';
import { type FeeInfo } from '@suite-common/wallet-types';
import { calculateTotalGasCost } from '@suite-common/wallet-utils';
import type { BulletListItemState } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

interface AmountComparisonParams {
    amount?: string;
    threshold?: string;
}

interface YieldModifyAmountInputParams {
    liveAmount?: string;
    actionAmount?: string | null;
    maxAmount: string;
}

type GetYieldApprovalActionParams = {
    liveAmount: string;
    allowanceAmount?: string | null;
    isModifyMode: boolean;
    isRevokeRequired: boolean;
    tokenContractAddress?: string | null;
};

export type YieldApprovalAction = 'approve' | 'continue' | 'increase' | 'revoke';

export type YieldNetworkFeeWarning = {
    availableAmount: string;
    networkDisplaySymbol: string;
};

export const isAmountGreaterThan = ({ amount, threshold }: AmountComparisonParams): boolean =>
    !!amount && !!threshold && new BigNumber(amount).gt(threshold);

type GetYieldNetworkFeeWarningParams = {
    availableBalance: string;
    requiredFee: BigNumber;
    networkDisplaySymbol: string;
};

export const getYieldNetworkFeeWarning = ({
    availableBalance,
    requiredFee,
    networkDisplaySymbol,
}: GetYieldNetworkFeeWarningParams): YieldNetworkFeeWarning | null => {
    if (requiredFee.isZero() || new BigNumber(availableBalance || '0').gte(requiredFee)) {
        return null;
    }

    return {
        availableAmount: fromWei(availableBalance || '0', 'ether'),
        networkDisplaySymbol,
    };
};

export const getYieldEstimatedContractCallFee = (feeInfo: FeeInfo): BigNumber | null => {
    const feeLevel = feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];
    const gasPrice = feeLevel?.maxFeePerGas || feeLevel?.feePerUnit;

    if (!gasPrice) {
        return null;
    }

    return new BigNumber(
        calculateTotalGasCost(toWei(gasPrice, 'gwei'), ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT),
    );
};

export const getYieldApprovalAction = ({
    liveAmount,
    allowanceAmount,
    isModifyMode,
    isRevokeRequired,
    tokenContractAddress,
}: GetYieldApprovalActionParams): YieldApprovalAction => {
    if (!isModifyMode) {
        return 'approve';
    }

    const allowanceAmountValue = new BigNumber(allowanceAmount || '0');
    const liveAmountValue = new BigNumber(liveAmount || '0');
    const hasAllowanceAmount = !!allowanceAmount && !allowanceAmountValue.isZero();
    const isIncreasing = hasAllowanceAmount && liveAmountValue.gt(allowanceAmountValue);
    const needsZeroApprovalReset =
        !!tokenContractAddress && !tokenSupportsIncreasingAllowance(tokenContractAddress);

    if (isRevokeRequired || (isIncreasing && needsZeroApprovalReset)) {
        return 'revoke';
    }

    if (isIncreasing) {
        return 'increase';
    }

    if (hasAllowanceAmount) {
        return 'continue';
    }

    return 'approve';
};

export const getYieldModifyAmountInput = ({
    liveAmount,
    actionAmount,
    maxAmount,
}: YieldModifyAmountInputParams) => {
    const nextAmount = liveAmount || actionAmount || '';

    return isAmountGreaterThan({ amount: nextAmount, threshold: maxAmount })
        ? maxAmount
        : nextAmount;
};

export const getBulletListItemStates = (
    currentStep: YieldFlowStepId,
): Record<YieldFlowStepId, BulletListItemState> => {
    const currentStepIndex = YIELD_FLOW_STEPS.indexOf(currentStep);

    const getStepState = (stepId: YieldFlowStepId): BulletListItemState => {
        const stepIndex = YIELD_FLOW_STEPS.indexOf(stepId);

        if (stepIndex < currentStepIndex) {
            return 'done';
        }

        if (stepIndex === currentStepIndex) {
            return 'active';
        }

        return 'pending';
    };

    const stepStates = {
        approve: getStepState('approve'),
        action: getStepState('action'),
        complete: getStepState('complete'),
    } satisfies Record<YieldFlowStepId, BulletListItemState>;

    return stepStates;
};
