import { useEffect, useRef, useState } from 'react';

import type { ExchangeTrade } from 'invity-api';

import type { AllowanceTransactionType } from '@suite-common/wallet-types';
import { useCurrentRef } from '@trezor/react-utils';

export type ApprovalStep = 'REQUIRED' | 'APPROVED' | 'LOADING' | 'ERROR';

export interface ApprovalTxState {
    approvalTxid: string | null;
    setApprovalTxid: (txid: string | null) => void;
    status: {
        isPending: boolean;
        isConfirmed: boolean;
        isFailed: boolean;
    };
}

export interface UseApprovalStepParams {
    tx: ApprovalTxState;
    currentTransactionType: AllowanceTransactionType;
    quoteStatus: ExchangeTrade['status'] | undefined;
    refreshQuotes: () => Promise<void>;
}

export interface UseApprovalStepReturn {
    approvalStep: ApprovalStep | undefined;
}

export const useApprovalStep = ({
    tx,
    currentTransactionType,
    quoteStatus,
    refreshQuotes,
}: UseApprovalStepParams): UseApprovalStepReturn => {
    const [approvalStep, setApprovalStep] = useState<ApprovalStep | undefined>();
    const [trackedTransactionType, setTrackedTransactionType] =
        useState<AllowanceTransactionType | null>(null);

    const refreshQuotesRef = useCurrentRef(refreshQuotes);
    const effectRunIdRef = useRef(0);

    useEffect(() => {
        if (tx.approvalTxid && !trackedTransactionType) {
            setTrackedTransactionType(currentTransactionType);
        }
    }, [tx.approvalTxid, currentTransactionType, trackedTransactionType]);

    useEffect(() => {
        const thisRunId = ++effectRunIdRef.current;

        const { approvalTxid, status, setApprovalTxid } = tx;
        if (!approvalTxid) {
            return;
        }

        if (status.isPending) {
            setApprovalStep('LOADING');

            return;
        }

        if (status.isFailed) {
            setApprovalStep('REQUIRED');

            return;
        }

        if (status.isConfirmed && trackedTransactionType) {
            setApprovalStep(trackedTransactionType === 'approve' ? 'APPROVED' : 'REQUIRED');

            refreshQuotesRef
                .current()
                .catch(error => {
                    console.error('Failed to refresh quotes after approval:', error);
                })
                .finally(() => {
                    if (effectRunIdRef.current !== thisRunId) {
                        return;
                    }
                    setApprovalTxid(null);
                    setTrackedTransactionType(null);
                });
        }
    }, [tx, trackedTransactionType, refreshQuotesRef]);

    useEffect(() => {
        if (tx.approvalTxid) return;

        switch (quoteStatus) {
            case 'ERROR':
                return setApprovalStep('ERROR');
            case 'APPROVAL_REQ':
                return setApprovalStep('REQUIRED');
            case 'CONFIRM':
            case 'SIGN_DATA':
                return setApprovalStep('APPROVED');
            default:
                setApprovalStep(undefined);
        }
    }, [quoteStatus, tx.approvalTxid]);

    return {
        approvalStep,
    };
};
