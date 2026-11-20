import { type AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useSellFormContext } from '../../hooks/sell/useSellFormContext';
import { useSellSelectQuote } from '../../hooks/sell/useSellSelectQuote';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/sell/continue-button';

export const SellConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useSellFormContext();
    const { canProceed, selectQuote } = useSellSelectQuote(form);

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
                        <Translation id="moduleTrading.tradingScreen.buttons.continue" />
                    </Button>
                </AnimatedBox>
            )}
        </AnimatedBox>
    );
};
