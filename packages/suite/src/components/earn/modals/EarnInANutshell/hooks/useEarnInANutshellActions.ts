import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';

import { openModal } from 'src/actions/suite/modalActions';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

interface UseEarnInANutshellActionsProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
}

export const useEarnInANutshellActions = ({
    flow,
    provider,
    onCancel,
}: UseEarnInANutshellActionsProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const account = useSelector(selectSelectedAccount);

    const handleContinue = () => {
        onCancel();
        dispatch(openModal({ type: 'earn-provider-consent', flow, provider }));

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: account?.symbol,
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
                networkSymbol: account?.symbol,
            },
        });
    };

    return {
        handleContinue,
        onCancelClick,
    };
};
