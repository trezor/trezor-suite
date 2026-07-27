import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type CoinEnablingInitFooterProps = {
    onSubmit: () => void;
};

export const CoinEnablingInitFooter = ({ onSubmit }: CoinEnablingInitFooterProps) => (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
        <ScreenFooterGradient />
        <Box marginHorizontal="sp16" marginBottom="sp16">
            <Button onPress={onSubmit} testID="@coin-enabling/button-save">
                <Translation id="generic.buttons.confirm" />
            </Button>
        </Box>
    </Animated.View>
);
