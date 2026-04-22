import { useState } from 'react';

import { Translation } from '@suite-native/intl';

import { type YieldApprovalLimitType } from '../types';

export const useYieldApprovalLimit = () => {
    const [approvalLimitType, setApprovalLimitType] =
        useState<YieldApprovalLimitType>('per-supply');

    const approvalLimitTitle =
        approvalLimitType === 'per-supply' ? (
            <Translation id="earn.yieldSupplyFlowScreen.perSupply" />
        ) : (
            <Translation id="earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.title" />
        );

    return {
        approvalLimitTitle,
        approvalLimitType,
        setApprovalLimitType,
    };
};
