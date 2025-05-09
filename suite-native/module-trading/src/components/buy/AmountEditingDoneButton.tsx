import { Keyboard } from 'react-native';
import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

const AMOUNT_EDITING_DONE_BUTTON_TEST_ID = '@trading/buy/amount-editing-done-button';

export const AmountEditingDoneButton = () => (
    <AnimatedBox entering={FadeInDown} exiting={FadeOutDown}>
        <Button
            onPress={Keyboard.dismiss}
            colorScheme="tertiaryElevation0"
            testID={AMOUNT_EDITING_DONE_BUTTON_TEST_ID}
        >
            <Translation id="moduleTrading.tradingScreen.amountEditingDoneButton" />
        </Button>
    </AnimatedBox>
);
