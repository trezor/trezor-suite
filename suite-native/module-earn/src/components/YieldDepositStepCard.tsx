import { Translation } from '@suite-native/intl';

import { type YieldFlowStep, YieldFlowStepCard } from './YieldFlowStepCard';

type YieldDepositStepId = 'approval' | 'deposit';

const steps = [
    {
        id: 'approval',
        label: <Translation id="earn.yieldDepositFlowScreen.approvalStepTitle" />,
    },
    {
        id: 'deposit',
        label: <Translation id="earn.yieldDepositFlowScreen.depositTransactionStepTitle" />,
    },
] as const satisfies YieldFlowStep<YieldDepositStepId>[];

type YieldDepositStepCardProps = {
    currentStepId: YieldDepositStepId;
};

export const YieldDepositStepCard = ({ currentStepId }: YieldDepositStepCardProps) => (
    <YieldFlowStepCard
        currentStepId={currentStepId}
        modalTitle="earn.yieldDepositFlowScreen.modalTitle"
        steps={steps}
    />
);
