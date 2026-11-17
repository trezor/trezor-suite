import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AssetSymbol } from '@suite-native/assets';
import { Translation } from '@suite-native/intl';

import { type YieldFlowStep, YieldFlowStepCard } from './YieldFlowStepCard';

type YieldDepositStepId = 'wrap' | 'approval' | 'deposit';

const getWrapStep = (
    networkSymbol: NetworkSymbol,
    wrappedTokenContract: TokenAddress | undefined,
    isSkipped: boolean,
): YieldFlowStep<YieldDepositStepId> => ({
    id: 'wrap',
    isSkipped,
    label: (
        <Translation
            id="earn.yieldDepositFlowScreen.wrapStepTitle"
            values={{
                nativeSymbol: <AssetSymbol networkSymbol={networkSymbol} />,
                tokenSymbol: (
                    <AssetSymbol
                        networkSymbol={networkSymbol}
                        contractAddress={wrappedTokenContract}
                    />
                ),
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
    /** The vault's wrapped native token, which the wrap step produces from the native coin. */
    wrappedTokenContract: TokenAddress | undefined;
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
    wrappedTokenContract,
    onEditStep,
}: YieldDepositStepCardProps) => (
    <YieldFlowStepCard
        currentStepId={currentStepId}
        modalTitle="earn.yieldDepositFlowScreen.modalTitle"
        onEditStep={onEditStep}
        steps={
            hasWrapStep
                ? [
                      getWrapStep(networkSymbol, wrappedTokenContract, isWrapStepSkipped),
                      ...getBaseSteps(isApprovalStepSkipped),
                  ]
                : getBaseSteps(isApprovalStepSkipped)
        }
    />
);
