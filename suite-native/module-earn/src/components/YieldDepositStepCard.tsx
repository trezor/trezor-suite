import {
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getWrappedNativeSymbol,
} from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';

import { type YieldFlowStep, YieldFlowStepCard } from './YieldFlowStepCard';

type YieldDepositStepId = 'wrap' | 'approval' | 'deposit';

const getWrapStep = (
    networkSymbol: NetworkSymbol,
    isSkipped: boolean,
): YieldFlowStep<YieldDepositStepId> => ({
    id: 'wrap',
    isSkipped,
    label: (
        <Translation
            id="earn.yieldDepositFlowScreen.wrapStepTitle"
            values={{
                nativeSymbol: getNetworkDisplaySymbol(networkSymbol),
                tokenSymbol: getWrappedNativeSymbol(networkSymbol) ?? '',
            }}
        />
    ),
});

const getBaseSteps = (isApprovalSkipped: boolean) =>
    [
        {
            id: 'approval',
            isSkipped: isApprovalSkipped,
            label: <Translation id="earn.yieldDepositFlowScreen.approvalStepTitle" />,
        },
        {
            id: 'deposit',
            label: <Translation id="earn.yieldDepositFlowScreen.depositTransactionStepTitle" />,
        },
    ] as const satisfies YieldFlowStep<YieldDepositStepId>[];

type YieldDepositStepCardProps = {
    /** Set once the approve step was resolved without approving, i.e. the allowance covered it. */
    isApprovalStepSkipped?: boolean;
    /** Set once the wrap step was resolved without wrapping anything. */
    isWrapStepSkipped?: boolean;
    networkSymbol: NetworkSymbol;
    /** Handlers returning to an already finished step, keyed by the step it belongs to. */
    onEditStep?: Partial<Record<YieldDepositStepId, () => void>>;
} & (
    | {
          currentStepId: 'wrap';
          hasWrapStep: true;
      }
    | {
          currentStepId: Exclude<YieldDepositStepId, 'wrap'>;
          hasWrapStep?: boolean;
      }
);

export const YieldDepositStepCard = ({
    currentStepId,
    hasWrapStep = false,
    isApprovalStepSkipped = false,
    isWrapStepSkipped = false,
    networkSymbol,
    onEditStep,
}: YieldDepositStepCardProps) => (
    <YieldFlowStepCard
        currentStepId={currentStepId}
        modalTitle="earn.yieldDepositFlowScreen.modalTitle"
        onEditStep={onEditStep}
        steps={
            hasWrapStep
                ? [
                      getWrapStep(networkSymbol, isWrapStepSkipped),
                      ...getBaseSteps(isApprovalStepSkipped),
                  ]
                : getBaseSteps(isApprovalStepSkipped)
        }
    />
);
