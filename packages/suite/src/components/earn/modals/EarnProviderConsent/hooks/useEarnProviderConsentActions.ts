import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    DEFAULT_VOTING_OPTION,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { getEarnRouteParams } from 'src/components/earn/utils/getEarnRouteParams';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

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
    const analytics = useAnalytics();
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    const report = (action: EarnModalAction) => {
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

    const proceedToSupply = () => {
        onCancel();

        switch (flow) {
            case EarnFlow.Yield:
                if (yieldContext) {
                    dispatch(
                        goto({
                            routeName: 'earn-supply',
                            params: getEarnRouteParams({
                                account,
                                yieldId: yieldContext.id,
                                contractAddress: yieldContext.tokenContractAddress,
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

        dispatch(stakeActions.setVotingDelegationOption(DEFAULT_VOTING_OPTION));
        report('cancel');
    };

    return {
        proceedToSupply,
        onCancelClick,
    };
};
