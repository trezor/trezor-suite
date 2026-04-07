import { useMemo } from 'react';

import { openModal } from '@suite/modal';
import { type YieldDto, useAllYieldOpportunities } from '@suite-common/earn-api';
import {
    type EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { selectEthValidatorsQueue, selectPoolStatsApy } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getUnstakingPeriodInDays } from '@suite-common/wallet-utils';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface UseEarnInANutshellProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
    account: Account;
    actionType?: EarnModalAction;
    yieldContext?: EarnYieldContext;
}

export const useEarnInANutshell = ({
    flow,
    provider,
    onCancel,
    account,
    actionType = 'continue',
    yieldContext,
}: UseEarnInANutshellProps) => {
    const validatorsQueueData = useSelector(selectEthValidatorsQueue);
    const apy = useSelector(state => selectPoolStatsApy(state, { account }));
    const unstakingPeriod = getUnstakingPeriodInDays(account.networkType, validatorsQueueData);

    const { yieldOpportunities } = useAllYieldOpportunities();

    const yieldContextId = yieldContext?.id;
    const vault: YieldDto | undefined = useMemo(
        () => yieldOpportunities.find(opportunity => opportunity.id === yieldContextId),
        [yieldOpportunities, yieldContextId],
    );

    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const handleAction = () => {
        onCancel();

        if (actionType === 'continue') {
            dispatch(
                openModal({
                    type: 'earn-provider-consent',
                    flow,
                    provider,
                    account,
                    yieldContext,
                }),
            );
        }

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: actionType,
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    const onCancelClick = () => {
        onCancel();

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'cancel',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return {
        unstakingPeriod,
        apy,
        vault,
        handleAction,
        onCancelClick,
    };
};
