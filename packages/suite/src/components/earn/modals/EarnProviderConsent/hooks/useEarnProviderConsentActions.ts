import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVotingDelegationOption, stakeActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { getEarnRouteParams } from 'src/components/earn/utils/getEarnRouteParams';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useSelector } from 'src/hooks/suite';

interface UseEarnProviderConsentActionsProps {
    flow: EarnFlow;
    onCancel: () => void;
    includeVotingDelegation?: boolean;
    account: Account;
    networkSymbol?: NetworkSymbol;
    yieldContext?: EarnYieldContext;
}

export const useEarnProviderConsentActions = ({
    flow,
    onCancel,
    includeVotingDelegation = false,
    account,
    networkSymbol,
    yieldContext,
}: UseEarnProviderConsentActionsProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );

    const report = (action: EarnModalAction) => {
        if (flow === EarnFlow.Yield) return;

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action,
                step: 'funds-maintained-modal',
                networkSymbol,
                ...(includeVotingDelegation
                    ? { votingDelegation: selectedVotingDelegation.type }
                    : {}),
            },
        });
    };

    const proceedToEarnFlow = () => {
        onCancel();

        switch (flow) {
            case EarnFlow.Yield:
                if (yieldContext?.vaultAddress) {
                    dispatch(
                        goto({
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
