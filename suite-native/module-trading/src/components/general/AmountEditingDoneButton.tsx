import { Keyboard } from 'react-native';
import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type AmountEditingDoneButtonProps = {
    testID?: string;
};

export const AmountEditingDoneButton = ({ testID }: AmountEditingDoneButtonProps) => (
    <AnimatedBox entering={FadeInDown} exiting={FadeOutDown}>
        <Button onPress={Keyboard.dismiss} colorScheme="tertiaryElevation0" testID={testID}>
            <Translation id="moduleTrading.tradingScreen.amountEditingDoneButton" />
        </Button>
    </AnimatedBox>
);
