import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import {
    EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { selectEthValidatorsQueue, selectPoolStatsApy } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getUnstakingPeriodInDays } from '@suite-common/wallet-utils';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';

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

    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

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

        if (flow === EarnFlow.Yield) return;

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

        if (flow === EarnFlow.Yield) return;

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
        handleAction,
        onCancelClick,
    };
};
