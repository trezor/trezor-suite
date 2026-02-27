import { useEffect } from 'react';

import { EarnAnalyticsStep, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useAnalytics } from 'src/support/useAnalytics';

import { StakingEarnInANutshellModal } from './StakingEarnInANutshellModal';
import { UpdateEarnInANutshellModal } from './UpdateEarnInANutshellModal';
import { YieldEarnInANutshellModal } from './YieldEarnInANutshellModal';

interface EarnInANutshellModalProps {
    flow: EarnFlow;
    provider: EarnProvider;
    account: Account;
    analyticsStep: EarnAnalyticsStep;
    yieldId?: string;
    tokenContractAddress?: string;
    onCancel: () => void;
}

export const EarnInANutshellModal = ({
    flow,
    provider,
    account,
    analyticsStep,
    yieldId,
    tokenContractAddress,
    onCancel,
}: EarnInANutshellModalProps) => {
    const analytics = useAnalytics();

    useEffect(() => {
        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                step: analyticsStep,
                networkSymbol: account.symbol,
            },
        });
    }, [account.symbol, analytics, analyticsStep, flow]);

    switch (flow) {
        case EarnFlow.Stake:
            return (
                <StakingEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    yieldId={yieldId}
                    tokenContractAddress={tokenContractAddress}
                />
            );
        default:
            return exhaustive(flow);
    }
};
