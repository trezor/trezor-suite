import { useEffect, useState } from 'react';

import { type AllowanceLimitType } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

export const useYieldApprovalLimit = (defaultApprovalLimitType: AllowanceLimitType = 'minimal') => {
    const [approvalLimitType, setApprovalLimitType] =
        useState<AllowanceLimitType>(defaultApprovalLimitType);

    useEffect(() => {
        setApprovalLimitType(defaultApprovalLimitType);
    }, [defaultApprovalLimitType]);

    const approvalLimitTitleId =
        approvalLimitType === 'minimal'
            ? 'earn.yieldDepositFlowScreen.perDeposit'
            : 'earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title';

    return {
        approvalLimitTitle: <Translation id={approvalLimitTitleId} />,
        approvalLimitType,
        setApprovalLimitType,
    };
};
