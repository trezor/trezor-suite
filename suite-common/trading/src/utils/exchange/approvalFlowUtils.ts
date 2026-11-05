import { type ExchangeTrade } from 'invity-api';

import {
    type AllowanceStepState,
    type AllowanceStepVariant,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getErc20ApproveSpender,
    isPending,
    tokenSupportsIncreasingAllowance,
} from '@suite-common/wallet-utils';

import { hasExistingAllowance } from './exchangeAllowanceUtils';
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

const isSameAddress = (address: string, otherAddress: string | undefined) =>
    address.toLowerCase() === otherAddress?.toLowerCase();

export const findPendingApprovalTxid = (
    transactions: WalletAccountTransaction[],
    quote: ExchangeTrade | undefined,
): string | undefined => {
    const contractAddress = quote?.send ? parseCryptoId(quote.send).contractAddress : undefined;
    const spender = getErc20ApproveSpender(quote?.dexTx?.data);

    if (!contractAddress || !spender) {
        return undefined;
    }

    return transactions.find(
        tx =>
            isPending(tx) &&
            isSameAddress(spender, getErc20ApproveSpender(tx.ethereumSpecific?.data)) &&
            tx.details.vout.some(output =>
                output.addresses?.some(address => isSameAddress(contractAddress, address)),
            ),
    )?.txid;
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

const isStepPending = (
    type: ApprovalFlowStepType,
    quote: ExchangeTrade,
    hasPendingApprovalTx: boolean,
) =>
    hasPendingApprovalTx ||
    (quote.status === 'APPROVAL_PENDING' &&
        (type === 'revoke') === (quote.approvalType === 'ZERO'));

type ApprovalFlowStepStatusOptions = {
    currentAllowance?: string;
    hasPendingApprovalTx?: boolean;
};

export const getApprovalFlowStepStatuses = (
    steps: ApprovalFlowStepType[],
    quote: ExchangeTrade | undefined,
    completedSteps: ApprovalFlowStepType[] = [],
    { currentAllowance, hasPendingApprovalTx = false }: ApprovalFlowStepStatusOptions = {},
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

        return {
            type,
            status: isStepPending(type, quote, hasPendingApprovalTx) ? 'pending' : 'active',
        };
    });
};
