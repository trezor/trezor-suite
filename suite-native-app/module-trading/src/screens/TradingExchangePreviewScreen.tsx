import { useEffect } from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';
import { Footer } from '@suite-native/trading-provider-utils';
import { type TradingStackScreenProps } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    ExchangePreviewFooter,
    ExchangePreviewScreenHeader,
    ExchangePreviewSimulationInfo,
    ExchangePreviewView,
} from '../components/exchange/ExchangePreview';
import { ExchangeFlowStepsLayout } from '../components/exchange/Flow/ExchangeFlowStepsLayout';
import { ExchangeFlowSwapStepContent } from '../components/exchange/Flow/ExchangeFlowSwapStepContent';
import { useExchangePreviewStep } from '../hooks/exchange/useExchangePreviewStep';
import { clearTradingStateThunk } from '../thunks';

export type TradingExchangePreviewScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingExchangePreview>;

export const TradingExchangePreviewScreen = ({
    navigation,
    route: { params },
}: TradingExchangePreviewScreenProps) => {
    const { isApproved } = params;
    const { dispatch } = useServices(injectDispatch);
    const { quote, errorString, handleConfirmTrade, onSignTransactionNavigation } =
        useExchangePreviewStep({
            onApprovalRequired: () =>
                navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {}),
        });

    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    const footer = (
        <ExchangePreviewFooter
            isContinueDisabled={!!errorString}
            onSignTransactionNavigation={onSignTransactionNavigation}
        />
    );

    // TradingConfirmingScreen passes only isApproved, so a preceding revoke step is not shown yet.
    if (isApproved) {
        return (
            <ExchangeFlowStepsLayout
                approvalStatus="needs_approval"
                currentStep="preview"
                header={<ExchangePreviewScreenHeader />}
                footer={footer}
            >
                <ExchangeFlowSwapStepContent
                    quote={quote}
                    txnErrorString={errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                    onSlippageConfirmed={handleConfirmTrade}
                />
            </ExchangeFlowStepsLayout>
        );
    }

    return (
        <Screen header={<ExchangePreviewScreenHeader />} footer={footer}>
            <VStack spacing="sp16" flex={1}>
                <ExchangePreviewSimulationInfo />
                <ExchangePreviewView
                    quote={quote}
                    txnErrorString={errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                    onSlippageConfirmed={handleConfirmTrade}
                />
                <Footer />
            </VStack>
        </Screen>
    );
};
