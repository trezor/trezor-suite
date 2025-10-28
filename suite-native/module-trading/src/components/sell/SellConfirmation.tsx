import { AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { SellLegalSheet } from './SellLegalSheet';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { useSellSelectQuote } from '../../hooks/sell/useSellSelectQuote';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/sell/continue-button';

export const SellConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useSellFormContext();
    const {
        canProceed,
        isLegalTermsConsentRequested,
        cancelLegalTermsConsent,
        giveLegalTermsConsent,
        selectQuote,
    } = useSellSelectQuote(form);

    const [quote, sendAsset] = form.watch(['quote', 'sendAsset']);

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
                        <Translation id="moduleTrading.tradingScreen.buttons.continue" />
                    </Button>
                </AnimatedBox>
            )}
            <SellLegalSheet
                isVisible={isLegalTermsConsentRequested}
                onConsent={giveLegalTermsConsent}
                onDismiss={cancelLegalTermsConsent}
                tradeProvider={quote?.exchange ?? ''}
                sendSymbol={sendAsset?.symbol ?? ''}
            />
        </AnimatedBox>
    );
};
