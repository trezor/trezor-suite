import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { getWrappedNativeSymbol } from '@trezor/network-ethereum-suite-common';

import { type YieldFlowStep, YieldFlowStepCard } from './YieldFlowStepCard';

type YieldWithdrawStepId = 'withdraw' | 'unwrap';

const withdrawStep = {
    id: 'withdraw',
    label: <Translation id="earn.yieldWithdrawFlowScreen.withdrawStepTitle" />,
} as const satisfies YieldFlowStep<YieldWithdrawStepId>;

const getUnwrapStep = (networkSymbol: NetworkSymbol): YieldFlowStep<YieldWithdrawStepId> => ({
    id: 'unwrap',
    label: (
        <Translation
            id="earn.yieldWithdrawFlowScreen.unwrapStepTitle"
            values={{
                nativeSymbol: getNetworkDisplaySymbol(networkSymbol),
                tokenSymbol: getWrappedNativeSymbol(networkSymbol) ?? '',
            }}
        />
    ),
});

type YieldWithdrawStepCardProps = {
    networkSymbol: NetworkSymbol;
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
}: YieldWithdrawStepCardProps) => (
    <YieldFlowStepCard
        currentStepId={currentStepId}
        modalTitle="earn.yieldWithdrawFlowScreen.modalTitle"
        steps={hasUnwrapStep ? [withdrawStep, getUnwrapStep(networkSymbol)] : [withdrawStep]}
    />
);
