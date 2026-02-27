import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { selectPoolStatsApyData, selectValidatorsQueueData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getUnstakingPeriodInDays } from '@suite-common/wallet-utils';

import { openModal } from 'src/actions/suite/modalActions';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface UseEarnInANutshellProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
    account: Account;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const useEarnInANutshell = ({
    flow,
    provider,
    onCancel,
    account,
    yieldId,
    tokenContractAddress,
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

    const handleContinue = () => {
        onCancel();
        dispatch(
            openModal({
                type: 'earn-provider-consent',
                flow,
                provider,
                account,
                yieldId,
                tokenContractAddress,
            }),
        );

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
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
        handleContinue,
        onCancelClick,
    };
};
