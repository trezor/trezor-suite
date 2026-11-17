import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AssetSymbol } from '@suite-native/assets';
import { Translation } from '@suite-native/intl';

import { type YieldFlowStep, YieldFlowStepCard } from './YieldFlowStepCard';

type YieldWithdrawStepId = 'withdraw' | 'unwrap';

const withdrawStep = {
    id: 'withdraw',
    label: <Translation id="earn.yieldWithdrawFlowScreen.withdrawStepTitle" />,
} as const satisfies YieldFlowStep<YieldWithdrawStepId>;

const getUnwrapStep = (
    networkSymbol: NetworkSymbol,
    wrappedTokenContract: TokenAddress | undefined,
): YieldFlowStep<YieldWithdrawStepId> => ({
    id: 'unwrap',
    label: (
        <Translation
            id="earn.yieldWithdrawFlowScreen.unwrapStepTitle"
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

type YieldWithdrawStepCardProps = {
    networkSymbol: NetworkSymbol;
    /** The vault's wrapped native token, which the unwrap step turns into the native coin. */
    wrappedTokenContract: TokenAddress | undefined;
} & (
    | {
          currentStepId: 'unwrap';
          hasUnwrapStep: true;
      }
    | {
          currentStepId: 'withdraw';
          hasUnwrapStep?: boolean;
      }
);

export const YieldWithdrawStepCard = ({
    currentStepId,
    hasUnwrapStep = false,
    networkSymbol,
    wrappedTokenContract,
}: YieldWithdrawStepCardProps) => (
    <YieldFlowStepCard
        currentStepId={currentStepId}
        modalTitle="earn.yieldWithdrawFlowScreen.modalTitle"
        steps={
            hasUnwrapStep
                ? [withdrawStep, getUnwrapStep(networkSymbol, wrappedTokenContract)]
                : [withdrawStep]
        }
    />
);
