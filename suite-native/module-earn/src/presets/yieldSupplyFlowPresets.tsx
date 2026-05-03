import { type ReactNode } from 'react';

import { type YieldFlowStepId } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

type YieldSupplyFlowStep = {
    id: string;
    stepId: YieldFlowStepId;
    label: ReactNode;
};

export const yieldSupplyFlowSteps = [
    {
        id: 'approval',
        stepId: 'approve',
        label: <Translation id="earn.yieldSupplyFlowScreen.approvalStepTitle" />,
    },
    {
        id: 'supply',
        stepId: 'action',
        label: <Translation id="earn.yieldSupplyFlowScreen.supplyTransactionStepTitle" />,
    },
    {
        id: 'complete',
        stepId: 'complete',
        label: <Translation id="earn.yieldSupplyFlowScreen.supplyCompleteStepTitle" />,
    },
] satisfies YieldSupplyFlowStep[];
