import { useEffect, useState } from 'react';

import { Translation } from '@suite-native/intl';

import { type YieldApprovalLimitType } from '../../types';

export const useYieldApprovalLimit = (
    defaultApprovalLimitType: YieldApprovalLimitType = 'per-deposit',
) => {
    const [approvalLimitType, setApprovalLimitType] =
        useState<YieldApprovalLimitType>(defaultApprovalLimitType);

    useEffect(() => {
        setApprovalLimitType(defaultApprovalLimitType);
    }, [defaultApprovalLimitType]);

    const approvalLimitTitleId =
        approvalLimitType === 'per-deposit'
            ? 'earn.yieldDepositFlowScreen.perDeposit'
            : 'earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title';

    return {
        approvalLimitTitle: <Translation id={approvalLimitTitleId} />,
        approvalLimitType,
        setApprovalLimitType,
    };
};
