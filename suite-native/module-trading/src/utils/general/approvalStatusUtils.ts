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

export const tokenSupportsIncreasingAllowance = (contractAddress?: string): boolean => {
    const ethereumUsdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

    if (!contractAddress) {
        return false;
    }

    return contractAddress.trim().toLowerCase() !== ethereumUsdtContractAddress.toLowerCase();
};
