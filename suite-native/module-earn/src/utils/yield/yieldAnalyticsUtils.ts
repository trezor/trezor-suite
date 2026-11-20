import { type AllowanceLimitType } from '@suite-common/wallet-types';

export const getYieldApprovalAnalyticsType = (
    approvalLimitType: AllowanceLimitType | undefined,
): 'INFINITE' | 'MINIMAL' | undefined => {
    if (approvalLimitType === undefined) {
        return undefined;
    }

    return approvalLimitType === 'unlimited' ? 'INFINITE' : 'MINIMAL';
};
