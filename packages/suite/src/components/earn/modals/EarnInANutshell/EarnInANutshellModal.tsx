import { useEffect } from 'react';

import {
    type EarnAnalyticsStep,
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useAnalytics } from 'src/support/useAnalytics';

import { StakingEarnInANutshellModal } from './StakingEarnInANutshellModal';
import { UpdateEarnInANutshellModal } from './UpdateEarnInANutshellModal';
import { YieldEarnInANutshellModal } from './YieldEarnInANutshellModal';

type EarnInANutshellBaseProps = {
    provider: EarnProvider;
    account: Account;
    actionType?: EarnModalAction;
    yieldContext?: EarnYieldContext;
    onCancel: () => void;
};

type StakingEarnInANutshellModalProps = EarnInANutshellBaseProps & {
    flow: EarnFlow.Stake | EarnFlow.UpdateProvider;
    analyticsStep: Extract<EarnAnalyticsStep, 'staking-dashboard'>;
};

type YieldEarnInANutshellModalProps = EarnInANutshellBaseProps & {
    flow: EarnFlow.Yield;
    analyticsStep: Extract<EarnAnalyticsStep, 'earn-dashboard' | 'yield-supply' | 'yield-withdraw'>;
};

type EarnInANutshellModalProps = StakingEarnInANutshellModalProps | YieldEarnInANutshellModalProps;

export const EarnInANutshellModal = ({
    flow,
    provider,
    account,
    analyticsStep,
    actionType,
    yieldContext,
    onCancel,
}: EarnInANutshellModalProps) => {
    const analytics = useAnalytics();

    useEffect(() => {
        switch (flow) {
            case EarnFlow.Stake:
            case EarnFlow.UpdateProvider:
                analytics.report({
                    type: earnFlowToEventTypeMap[flow],
                    payload: {
                        action: 'continue',
                        step: analyticsStep,
                        networkSymbol: account.symbol,
                    },
                });
                break;
            case EarnFlow.Yield:
                analytics.report({
                    type: earnFlowToEventTypeMap[flow],
                    payload: {
                        action: 'continue',
                        step: analyticsStep,
                        networkSymbol: account.symbol,
                    },
                });
                break;
            default:
                exhaustive(flow);
        }
    }, [account.symbol, analytics, analyticsStep, flow]);

    switch (flow) {
        case EarnFlow.Stake:
            return (
                <StakingEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    actionType={actionType}
                    yieldContext={yieldContext}
                />
            );
        case EarnFlow.Yield:
            return (
                <YieldEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    actionType={actionType}
                    yieldContext={yieldContext}
                />
            );
        case EarnFlow.UpdateProvider:
            return (
                <UpdateEarnInANutshellModal
                    account={account}
                    onCancel={onCancel}
                    provider={provider}
                    actionType={actionType}
                    yieldContext={yieldContext}
                />
            );
        default:
            return exhaustive(flow);
    }
};
