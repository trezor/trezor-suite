import { AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeLegalSheet } from './ExchangeLegalSheet';
import { useExchangeFlow } from '../../hooks/exchange/useExchangeFlow';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

export type ExchangeConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/exchange/continue-button';

export const ExchangeConfirmation = ({ enteringAnimation }: ExchangeConfirmationProps) => {
    const form = useExchangeFormContext();

    const {
        canProceed,
        approvalStatus,
        selectQuote,
        isConsentRequested,
        giveConsent,
        cancelConsent,
    } = useExchangeFlow(form);

    const quote = form.watch('quote');

    const { send = '', receive = '', exchange = '', isDex = false } = quote ?? {};

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
                        {approvalStatus === 'needs_approval' ? (
                            <Translation id="moduleTrading.tradingScreen.buttons.approveAndSwap" />
                        ) : (
                            <Translation id="moduleTrading.tradingScreen.buttons.swap" />
                        )}
                    </Button>
                </AnimatedBox>
            )}
            {quote && (
                <ExchangeLegalSheet
                    onDismiss={cancelConsent}
                    isVisible={isConsentRequested}
                    onConsent={giveConsent}
                    provider={exchange}
                    isDex={isDex}
                    send={send}
                    receive={receive}
                />
            )}
        </AnimatedBox>
    );
};
