import { useState } from 'react';
import { FadeIn } from 'react-native-reanimated';

import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen, ScreenHeader } from '@suite-native/navigation';
import {
    ProviderConfirmationStatusInfo,
    ProviderStatusDevButtons,
} from '@suite-native/trading-browser-auth';
import { Footer } from '@suite-native/trading-provider-utils';

import { LastErrorMessage } from '../components/general/Error/LastErrorMessage';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { TradingPreviewErrorScreen } from '../components/general/TradingPreview/TradingPreviewErrorScreen';
import { SellCompletionConfirmButton } from '../components/sell/SellCompletion/SellCompletionConfirmButton';
import { SellCompletionView } from '../components/sell/SellCompletion/SellCompletionView';
import { useSellCompletionScreenControls } from '../hooks/sell/useSellCompletionScreenControls';

const TradingSellCompletionScreenContent = () => {
    const controls = useSellCompletionScreenControls();
    const [shouldShowHeader, setShouldShowHeader] = useState(false);

    if (!controls.hasRequiredData) {
        return <TradingPreviewErrorScreen screenName="TradingSellCompletionScreen" />;
    }

    const {
        quote,
        companyName,
        cryptoSymbol,
        errorString,
        shouldShowConfirmButton,
        shouldShowFee,
    } = controls;

    const handleConfirmationComplete = (status: 'success' | 'error') => {
        setShouldShowHeader(status === 'success');
    };

    const header =
        shouldShowFee && shouldShowHeader ? (
            <DynamicScreenHeader
                title={
                    <Translation
                        id="moduleTrading.tradingSellCompletionScreen.sendTitle"
                        values={{ cryptoSymbol, companyName }}
                    />
                }
                subtitle={
                    <Translation id="moduleTrading.tradingSellCompletionScreen.sendSubtitle" />
                }
                closeActionType="back"
                contentEnteringAnimation={FadeIn.delay(300)}
            />
        ) : (
            <ScreenHeader closeActionType="back" />
        );

    return (
        <Screen
            header={header}
            footer={
                shouldShowConfirmButton ? <SellCompletionConfirmButton quote={quote} /> : undefined
            }
        >
            <VStack spacing="sp16" flex={1}>
                <ProviderStatusDevButtons />
                <LastErrorMessage tradingType="sell" />
                <ProviderConfirmationStatusInfo
                    quoteStatus={quote.status}
                    companyName={companyName}
                    onConfirmationComplete={handleConfirmationComplete}
                />
                <SellCompletionView
                    quote={quote}
                    txnErrorString={errorString}
                    shouldShowFee={shouldShowFee}
                />
                <Footer />
            </VStack>
        </Screen>
    );
};

export const TradingSellCompletionScreen = () => (
    <TradingDeviceConnectionGuard>
        <TradingSellCompletionScreenContent />
    </TradingDeviceConnectionGuard>
);
