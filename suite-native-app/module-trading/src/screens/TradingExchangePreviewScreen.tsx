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
    ExchangePreviewView,
} from '../components/exchange/ExchangePreview';
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

    useEffect(() => () => dispatch(clearTradingStateThunk()), [dispatch]);

    return (
        <Screen
            header={<ExchangePreviewScreenHeader />}
            footer={
                <ExchangePreviewFooter
                    isContinueDisabled={!!errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                />
            }
        >
            <VStack spacing="sp16" flex={1}>
                <ExchangePreviewView
                    quote={quote}
                    txnErrorString={errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                    onSlippageConfirmed={handleConfirmTrade}
                    isApproved={isApproved}
                />
                <Footer />
            </VStack>
        </Screen>
    );
};
