import { type DexApprovalType, type ExchangeTrade } from 'invity-api';

import { getAllowanceTransactionStatus } from '@suite-common/wallet-core';
import {
    type AllowanceLimitType,
    type AllowanceStepState,
    type AllowanceStepVariant,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    APPROVAL_TYPE_BY_LIMIT_TYPE,
    getErc20ApproveSpender,
    isEvmApprovalTx,
    isPending,
    tokenSupportsIncreasingAllowance,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { parseCryptoId } from '../../utils';

export type ApprovalFlowStepType = AllowanceStepVariant | 'swap';

export type ApprovalFlowSentTxids = Partial<Record<AllowanceStepVariant, string>>;

export type ApprovalFlowState = {
    steps: ApprovalFlowStepType[];
    sentTxids: ApprovalFlowSentTxids;
};

export type ApprovalFlowStepStatus = AllowanceStepState | 'upcoming';

export type ApprovalFlowStep = {
    type: ApprovalFlowStepType;
    status: ApprovalFlowStepStatus;
};

export const getExchangeApprovalType = (
    variant: AllowanceStepVariant,
    limitType: AllowanceLimitType,
): DexApprovalType => (variant === 'revoke' ? 'ZERO' : APPROVAL_TYPE_BY_LIMIT_TYPE[limitType]);

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

type SentTxOutcome = 'pending' | 'failed' | 'done';

const getSentTxOutcome = (tx: WalletAccountTransaction | undefined): SentTxOutcome => {
    const { isFailed, isConfirmed } = getAllowanceTransactionStatus(tx);

    if (!isFailed && !isConfirmed) {
        return 'pending';
    }

    return isConfirmed && isEvmApprovalTx(tx?.ethereumSpecific?.data) ? 'done' : 'failed';
};

const isApprovalConfirmed = (quote: ExchangeTrade) =>
    quote.status === 'CONFIRM' || quote.status === 'SIGN_DATA';

const isStepDone = (
    type: ApprovalFlowStepType,
    quote: ExchangeTrade,
    outcome: SentTxOutcome | undefined,
) => {
    if (type === 'swap') {
        return false;
    }

    if (isApprovalConfirmed(quote)) {
        return true;
    }

    if (outcome) {
        return outcome === 'done';
    }

    return type === 'revoke' && !hasPreapprovedAmount(quote);
};

const isStepPending = (
    type: ApprovalFlowStepType,
    quote: ExchangeTrade,
    hasPendingApprovalTx: boolean,
) =>
    hasPendingApprovalTx ||
    (quote.status === 'APPROVAL_PENDING' &&
        (type === 'revoke') === (quote.approvalType === 'ZERO'));

type GetApprovalFlowStepStatusesParams = {
    steps: ApprovalFlowStepType[];
    quote: ExchangeTrade | undefined;
    sentTxids: ApprovalFlowSentTxids;
    transactions: WalletAccountTransaction[];
    hasPendingApprovalTx: boolean;
};

export const getApprovalFlowStepStatuses = ({
    steps,
    quote,
    sentTxids,
    transactions,
    hasPendingApprovalTx,
}: GetApprovalFlowStepStatusesParams): ApprovalFlowStep[] => {
    if (!quote) {
        return [];
    }

    const outcomes = steps.map((type): SentTxOutcome | undefined => {
        const txid = type === 'swap' ? undefined : sentTxids[type];

        return txid
            ? getSentTxOutcome(transactions.find(transaction => transaction.txid === txid))
            : undefined;
    });

    const currentIndex = steps.findIndex(
        (type, index) => !isStepDone(type, quote, outcomes[index]),
    );

    return steps.map((type, index): ApprovalFlowStep => {
        if (currentIndex === -1 || index < currentIndex) {
            return { type, status: 'done' };
        }

        if (index > currentIndex || type === 'swap') {
            return { type, status: 'upcoming' };
        }

        const outcome = outcomes[index];

        if (outcome === 'pending') {
            return { type, status: 'pending' };
        }

        const isPendingByProvider = !outcome && isStepPending(type, quote, hasPendingApprovalTx);

        return { type, status: isPendingByProvider ? 'pending' : 'active' };
    });
};
