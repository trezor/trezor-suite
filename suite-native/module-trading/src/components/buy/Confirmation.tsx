import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { LegalSheet } from './LegalSheet';
import { useTradingBuyFlow } from '../../hooks/useTradingBuyFlow';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

export const Confirmation = () => {
    const form = useTradingBuyFormContext();

    const { canProceed, selectQuote, isConsentRequested, giveConsent, cancelConsent } =
        useTradingBuyFlow(form);

    const provider = form.watch('provider');

    return (
        <AnimatedBox entering={FadeInDown} exiting={FadeOutDown}>
            {canProceed && (
                <Button onPress={selectQuote} disabled={!canProceed}>
                    <Translation id="moduleTrading.tradingScreen.continueButton" />
                </Button>
            )}
            <LegalSheet
                onClose={cancelConsent}
                isVisible={isConsentRequested}
                onConsent={giveConsent}
                tradeProviderName={provider}
            />
        </AnimatedBox>
    );
};
