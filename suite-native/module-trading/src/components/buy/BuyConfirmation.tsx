import { type AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useBuyFlow } from '../../hooks/buy/useBuyFlow';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/buy/continue-button';

export const BuyConfirmation = ({ enteringAnimation }: ConfirmationProps) => {
    const form = useBuyFormContext();

    const { canProceed, selectQuote } = useBuyFlow(form);

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
