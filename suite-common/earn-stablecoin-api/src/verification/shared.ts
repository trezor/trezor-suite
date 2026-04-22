export type VerificationStatus = 'success' | 'failure' | 'skipped';
export type TransactionVerificationStatus = 'verified' | 'failed' | 'skipped';

export const toStatus = (isValid: boolean): TransactionVerificationStatus =>
    isValid ? 'verified' : 'failed';

export const aggregateStatuses = (
    statuses: TransactionVerificationStatus[],
): VerificationStatus => {
    if (statuses.length === 0) return 'skipped';
    if (statuses.some(s => s === 'failed')) return 'failure';
    if (statuses.every(s => s === 'verified')) return 'success';

    return 'skipped';
};
