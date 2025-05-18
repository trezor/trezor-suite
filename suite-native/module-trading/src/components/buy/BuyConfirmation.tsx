import { AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { BuyLegalSheet } from './BuyLegalSheet';
import { useTradingBuyFlow } from '../../hooks/buy/useBuyFlow';
import { useTradingBuyFormContext } from '../../hooks/buy/useBuyFormContext';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/buy/continue-button';

export const BuyConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useTradingBuyFormContext();

    const { canProceed, selectQuote, isConsentRequested, giveConsent, cancelConsent } =
        useTradingBuyFlow(form);

    const quote = form.watch('quote');

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
                        <Translation id="moduleTrading.tradingScreen.continueButton" />
                    </Button>
                </AnimatedBox>
            )}
            <BuyLegalSheet
                onDismiss={cancelConsent}
                isVisible={isConsentRequested}
                onConsent={giveConsent}
                tradeProvider={quote?.exchange ?? ''}
            />
        </AnimatedBox>
    );
};
