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

// `currentAllowance` is the allowance in token units read from the chain. Without it the
// provider-reported `preapprovedStringAmount` decides.
const hasExistingAllowance = (quote: ExchangeTrade, currentAllowance: string | undefined) =>
    new BigNumber(currentAllowance ?? quote.preapprovedStringAmount ?? 0).gt(0);

export const getApprovalFlowSteps = (
    quote: ExchangeTrade,
    currentAllowance?: string,
): ApprovalFlowStepType[] => {
    if (!hasExistingAllowance(quote, currentAllowance)) {
        return ['approve', 'swap'];
    }

    const contractAddress = quote.send ? parseCryptoId(quote.send).contractAddress : undefined;

    return tokenSupportsIncreasingAllowance(contractAddress)
        ? ['increase', 'swap']
        : ['revoke', 'approve', 'swap'];
};

const isApprovalConfirmed = (quote: ExchangeTrade) =>
    quote.status === 'CONFIRM' || quote.status === 'SIGN_DATA';

type IsStepDoneParams = {
    type: ApprovalFlowStepType;
    quote: ExchangeTrade;
    completedSteps: ApprovalFlowStepType[];
    currentAllowance: string | undefined;
};

const isStepDone = ({ type, quote, completedSteps, currentAllowance }: IsStepDoneParams) => {
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

        return !hasExistingAllowance(quote, currentAllowance) || isSentRevokeConfirmed;
    }

    return false;
};

const isStepPending = (type: ApprovalFlowStepType, quote: ExchangeTrade) =>
    quote.status === 'APPROVAL_PENDING' && (type === 'revoke') === (quote.approvalType === 'ZERO');

export const getApprovalFlowStepStatuses = (
    steps: ApprovalFlowStepType[],
    quote: ExchangeTrade | undefined,
    completedSteps: ApprovalFlowStepType[] = [],
    currentAllowance?: string,
): ApprovalFlowStep[] => {
    if (!quote) {
        return [];
    }

    const currentIndex = steps.findIndex(
        type => !isStepDone({ type, quote, completedSteps, currentAllowance }),
    );

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
