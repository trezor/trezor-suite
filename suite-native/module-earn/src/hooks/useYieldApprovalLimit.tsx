import { useState } from 'react';

import { Translation } from '@suite-native/intl';

import { type YieldApprovalLimitType } from '../types';

export const useYieldApprovalLimit = () => {
    const [approvalLimitType, setApprovalLimitType] =
        useState<YieldApprovalLimitType>('per-supply');

    const approvalLimitTitleId =
        approvalLimitType === 'per-supply'
            ? 'earn.yieldSupplyFlowScreen.perSupply'
            : 'earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.title';

    return {
        approvalLimitTitle: <Translation id={approvalLimitTitleId} />,
        approvalLimitType,
        setApprovalLimitType,
    };
};
