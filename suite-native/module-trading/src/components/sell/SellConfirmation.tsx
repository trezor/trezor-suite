import { AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type ConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/sell/continue-button';

export const SellConfirmation = ({ enteringAnimation }: ConfirmationProps) => (
    <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
        <AnimatedBox entering={FadeIn}>
            <Button onPress={() => {}} testID={CONFIRMATION_TEST_ID}>
                <Translation id="moduleTrading.tradingScreen.buttons.continue" />
            </Button>
        </AnimatedBox>
    </AnimatedBox>
);
