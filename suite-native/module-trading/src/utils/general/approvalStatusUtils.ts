import type { ExchangeTrade } from 'invity-api';

export type ApprovalStatus = 'approved' | 'needs_approval' | 'needs_increase' | 'not_needed' | null;

export const getApprovalStatus = (candidateQuote?: ExchangeTrade): ApprovalStatus => {
    if (!candidateQuote) {
        return null;
    }

    if (!candidateQuote.isDex) {
        return 'not_needed';
    }

    const isApprovalTxPreApproved =
        candidateQuote.preapprovedStringAmount && candidateQuote.preapprovedStringAmount !== '0';

    if (isApprovalTxPreApproved && candidateQuote.status === 'APPROVAL_REQ') {
        return 'needs_increase';
    }

    if (isApprovalTxPreApproved) {
        return 'approved';
    }

    return 'needs_approval';
};
