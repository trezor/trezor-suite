import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    DEFAULT_VOTING_OPTION,
    selectVotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';

import { openModal } from 'src/actions/suite/modalActions';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface UseEarnProviderConsentActionsProps {
    flow: EarnFlow;
    onCancel: () => void;
    includeVotingDelegation?: boolean;
    account: Account;
    networkSymbol?: NetworkSymbol;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const useEarnProviderConsentActions = ({
    flow,
    onCancel,
    includeVotingDelegation = false,
    account,
    networkSymbol,
    yieldId,
    tokenContractAddress,
}: UseEarnProviderConsentActionsProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    const report = (action: 'continue' | 'cancel') => {
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
        dispatch(
            openModal({
                type: 'supply',
                flow,
                account,
                yieldId,
                tokenContractAddress,
            }),
        );
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
