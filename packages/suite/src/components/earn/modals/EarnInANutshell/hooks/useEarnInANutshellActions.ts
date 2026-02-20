import { EarnAccountRef, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';

import { openModal } from 'src/actions/suite/modalActions';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

interface UseEarnInANutshellActionsProps {
    flow: EarnFlow;
    provider: EarnProvider;
    onCancel: () => void;
    accountRef?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const useEarnInANutshellActions = ({
    flow,
    provider,
    onCancel,
    accountRef,
    yieldId,
    tokenContractAddress,
}: UseEarnInANutshellActionsProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const selectedAccount = useSelector(selectSelectedAccount);

    const handleContinue = () => {
        onCancel();
        dispatch(
            openModal({
                type: 'earn-provider-consent',
                flow,
                provider,
                account: accountRef,
                yieldId,
                tokenContractAddress,
            }),
        );

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: selectedAccount?.symbol,
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
                networkSymbol: selectedAccount?.symbol,
            },
        });
    };

    return {
        handleContinue,
        onCancelClick,
    };
};
