import { AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { SellLegalSheet } from './SellLegalSheet';
import { useSellFlow } from '../../hooks/sell/useSellFlow';
import { useSellFormContext } from '../../hooks/sell/useSellFormContext';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/sell/continue-button';

export const SellConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useSellFormContext();
    const { canProceed, isConsentRequested, cancelConsent, giveConsent, selectQuote } =
        useSellFlow(form);

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
                isVisible={isConsentRequested}
                onConsent={giveConsent}
                onDismiss={cancelConsent}
                tradeProvider={quote?.exchange ?? ''}
                sendSymbol={sendAsset?.symbol ?? ''}
            />
        </AnimatedBox>
    );
};
