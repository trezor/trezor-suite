import { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { LegalSheet } from './LegalSheet';
import { useTradingBuyFlow } from '../../hooks/useTradingBuyFlow';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

export type ConfirmationProps = {
    isFormMountedRecently?: boolean;
};

export const Confirmation = ({ isFormMountedRecently }: ConfirmationProps) => {
    const form = useTradingBuyFormContext();

    const { canProceed, selectQuote, isConsentRequested, giveConsent, cancelConsent } =
        useTradingBuyFlow(form);

    const quote = form.watch('quote');

    return (
        <AnimatedBox entering={isFormMountedRecently ? FadeIn : FadeInDown} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button onPress={selectQuote}>
                        <Translation id="moduleTrading.tradingScreen.continueButton" />
                    </Button>
                </AnimatedBox>
            )}
            <LegalSheet
                onDismiss={cancelConsent}
                isVisible={isConsentRequested}
                onConsent={giveConsent}
                tradeProvider={quote?.exchange ?? ''}
            />
        </AnimatedBox>
    );
};
