import { useEffect, useRef, useState } from 'react';

import type { ExchangeTrade } from 'invity-api';

import type { AllowanceType } from '@suite-common/wallet-types';
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
    currentApprovalType: AllowanceType;
    quoteStatus: ExchangeTrade['status'] | undefined;
    refreshQuotes: () => Promise<void>;
}

export interface UseApprovalStepReturn {
    approvalStep: ApprovalStep | undefined;
}

export const useApprovalStep = ({
    tx,
    currentApprovalType,
    quoteStatus,
    refreshQuotes,
}: UseApprovalStepParams): UseApprovalStepReturn => {
    const [approvalStep, setApprovalStep] = useState<ApprovalStep | undefined>();
    const [txApprovalType, setTxApprovalType] = useState<AllowanceType | null>(null);

    const refreshQuotesRef = useCurrentRef(refreshQuotes);
    const effectRunIdRef = useRef(0);

    useEffect(() => {
        if (tx.approvalTxid && !txApprovalType) {
            setTxApprovalType(currentApprovalType);
        }
    }, [tx.approvalTxid, currentApprovalType, txApprovalType]);

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

        if (status.isConfirmed && txApprovalType) {
            setApprovalStep(txApprovalType === 'APPROVE' ? 'APPROVED' : 'REQUIRED');

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
                    setTxApprovalType(null);
                });
        }
    }, [tx, txApprovalType, refreshQuotesRef]);

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
