import { type YieldApprovalLimitType } from '../../types';

export const getYieldApprovalAnalyticsType = (
    approvalLimitType: YieldApprovalLimitType | undefined,
): 'INFINITE' | 'MINIMAL' | undefined => {
    if (approvalLimitType === undefined) {
        return undefined;
    }

    return approvalLimitType === 'unlimited' ? 'INFINITE' : 'MINIMAL';
};
