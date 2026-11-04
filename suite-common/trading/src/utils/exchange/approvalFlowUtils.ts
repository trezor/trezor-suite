import { type ExchangeTrade } from 'invity-api';

import { type AllowanceStepState, type AllowanceStepVariant } from '@suite-common/wallet-types';
import { tokenSupportsIncreasingAllowance } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { parseCryptoId } from '../../utils';

export type ApprovalFlowStepType = AllowanceStepVariant | 'swap';

export type ApprovalFlowState = {
    steps: ApprovalFlowStepType[];
    completedSteps: ApprovalFlowStepType[];
};

export type ApprovalFlowStepStatus = AllowanceStepState | 'upcoming';

export type ApprovalFlowStep = {
    type: ApprovalFlowStepType;
    status: ApprovalFlowStepStatus;
};

const hasPreapprovedAmount = (quote: ExchangeTrade) =>
    new BigNumber(quote.preapprovedStringAmount ?? 0).gt(0);

export const getApprovalFlowSteps = (quote: ExchangeTrade): ApprovalFlowStepType[] => {
    if (!hasPreapprovedAmount(quote)) {
        return ['approve', 'swap'];
    }

    const contractAddress = quote.send ? parseCryptoId(quote.send).contractAddress : undefined;

    return tokenSupportsIncreasingAllowance(contractAddress)
        ? ['increase', 'swap']
        : ['revoke', 'approve', 'swap'];
};

const isApprovalConfirmed = (quote: ExchangeTrade) =>
    quote.status === 'CONFIRM' || quote.status === 'SIGN_DATA';

const isStepDone = (
    type: ApprovalFlowStepType,
    quote: ExchangeTrade,
    completedSteps: ApprovalFlowStepType[],
) => {
    if (type === 'swap') {
        return false;
    }

    if (completedSteps.includes(type)) {
        return true;
    }

    if (isApprovalConfirmed(quote)) {
        return true;
    }

    if (type === 'revoke') {
        const isSentRevokeConfirmed =
            quote.status === 'APPROVAL_REQ' &&
            quote.approvalType === 'ZERO' &&
            !!quote.approvalSendTxHash;

        return !hasPreapprovedAmount(quote) || isSentRevokeConfirmed;
    }

    return false;
};

const isStepPending = (type: ApprovalFlowStepType, quote: ExchangeTrade) =>
    quote.status === 'APPROVAL_PENDING' && (type === 'revoke') === (quote.approvalType === 'ZERO');

export const getApprovalFlowStepStatuses = (
    steps: ApprovalFlowStepType[],
    quote: ExchangeTrade | undefined,
    completedSteps: ApprovalFlowStepType[] = [],
): ApprovalFlowStep[] => {
    if (!quote) {
        return [];
    }

    const currentIndex = steps.findIndex(type => !isStepDone(type, quote, completedSteps));

    return steps.map((type, index): ApprovalFlowStep => {
        if (currentIndex === -1 || index < currentIndex) {
            return { type, status: 'done' };
        }

        if (index > currentIndex || type === 'swap') {
            return { type, status: 'upcoming' };
        }

        return { type, status: isStepPending(type, quote) ? 'pending' : 'active' };
    });
};
