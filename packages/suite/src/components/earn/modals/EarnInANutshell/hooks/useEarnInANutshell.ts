import { openModal } from '@suite/modal';
import {
    EarnFlow,
    EarnModalAction,
    EarnProvider,
    EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { selectPoolStatsApyData, selectValidatorsQueueData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
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
    const { validatorWithdrawTime, validatorExitTime } = useSelector(state =>
        selectValidatorsQueueData(state, account.symbol),
    );
    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const unstakingPeriod = getUnstakingPeriodInDays({
        networkType: account.networkType,
        validatorWithdrawTime,
        validatorExitTime,
    });

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
        handleAction,
        onCancelClick,
    };
};
