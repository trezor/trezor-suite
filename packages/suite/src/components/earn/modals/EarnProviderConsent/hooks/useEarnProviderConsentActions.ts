import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { openModal } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    earnOnboardingActions,
    getEarnOpportunityKey,
    getYieldEarnOpportunityKey,
    stakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { getEarnRouteParams } from 'src/components/earn/utils/getEarnRouteParams';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';

interface UseEarnProviderConsentActionsProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
    account: Account;
    networkSymbol?: NetworkSymbol;
    yieldContext?: EarnYieldContext;
}

export const useEarnProviderConsentActions = ({
    flow,
    provider,
    onCancel,
    account,
    networkSymbol,
    yieldContext,
}: UseEarnProviderConsentActionsProps) => {
    const { analytics, dispatch } = useServices(selectDesktopAnalyticsDep, selectDispatch);

    const report = (action: EarnModalAction) => {
        if (flow === EarnFlow.Yield) return;

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action,
                step: 'funds-maintained-modal',
                networkSymbol,
            },
        });
    };

    const proceedToEarnFlow = () => {
        const opportunity =
            flow === EarnFlow.Yield
                ? getYieldEarnOpportunityKey(yieldContext?.vaultAddress)
                : getEarnOpportunityKey({ type: 'staking', provider });

        if (opportunity) {
            dispatch(
                earnOnboardingActions.confirmEarnOnboarding({
                    accountKey: account.key,
                    opportunity,
                }),
            );
        }

        onCancel();

        switch (flow) {
            case EarnFlow.Yield:
                if (yieldContext?.vaultAddress) {
                    dispatch(
                        gotoThunk({
                            routeName: 'earn-yield-deposit',
                            params: getEarnRouteParams({
                                account,
                                vaultAddress: yieldContext.vaultAddress,
                            }),
                        }),
                    );
                }
                break;
            case EarnFlow.Stake:
            case EarnFlow.UpdateProvider:
                dispatch(
                    openModal({
                        type: 'stake',
                        flow,
                        account,
                    }),
                );
                break;
            default:
                exhaustive(flow);
        }

        report('continue');
    };

    const onCancelClick = () => {
        onCancel();

        dispatch(stakeActions.clearAccountVotingDelegation());
        report('cancel');
    };

    return {
        proceedToEarnFlow,
        onCancelClick,
    };
};
