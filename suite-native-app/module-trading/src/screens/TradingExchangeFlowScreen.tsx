import { useEffect } from 'react';

import { type TradingStackRoutes } from '@suite-native/navigation';
import { type TradingStackScreenProps } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { TradingExchangeApprovalStep } from '../components/exchange/Flow/TradingExchangeApprovalStep';
import { TradingExchangePreviewStep } from '../components/exchange/Flow/TradingExchangePreviewStep';
import { TradingExchangeRevokeStep } from '../components/exchange/Flow/TradingExchangeRevokeStep';
import { clearTradingStateThunk } from '../thunks';
import { getExchangeFlowStepCards } from '../utils/exchange/exchangeFlowSteps';

export type TradingExchangeFlowScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingExchangeFlow>;

export const TradingExchangeFlowScreen = ({
    navigation,
    route: { params },
}: TradingExchangeFlowScreenProps) => {
    const { approvalStatus } = params;
    const { dispatch } = useServices(injectDispatch);

    // Steps unmount while moving through the flow, so only leaving the whole flow clears the state.
    useEffect(() => () => dispatch(clearTradingStateThunk()), [dispatch]);

    const { currentStep } = getExchangeFlowStepCards({
        approvalStatus,
        currentStep: params.currentStep,
    });

    switch (currentStep) {
        case 'revoke':
            return <TradingExchangeRevokeStep approvalStatus={approvalStatus} />;
        case 'approval':
            return <TradingExchangeApprovalStep approvalStatus={approvalStatus} />;
        case 'preview':
            return (
                <TradingExchangePreviewStep
                    approvalStatus={approvalStatus}
                    onApprovalRequired={() => navigation.setParams({ currentStep: 'approval' })}
                />
            );
        default:
            return exhaustive(currentStep);
    }
};
