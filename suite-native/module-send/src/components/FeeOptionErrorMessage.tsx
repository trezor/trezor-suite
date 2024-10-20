import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Text, HStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

type FeeOptionErrorMessageProps = {
    isVisible: boolean;
};

const ERROR_HEIGHT = 40;

const errorStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp12,
    justifyContent: 'center',
    backgroundColor: utils.colors.backgroundAlertRedSubtleOnElevation1,
    overflow: 'hidden',
}));

export const FeeOptionErrorMessage = ({ isVisible }: FeeOptionErrorMessageProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedErrorStyle = useAnimatedStyle(
        () => ({
            height: withTiming(isVisible ? ERROR_HEIGHT : 0),
        }),
        [isVisible],
    );

    return (
        <Animated.View style={[applyStyle(errorStyle), animatedErrorStyle]}>
            <HStack alignItems="center" spacing="sp8">
                <Icon name="warningCircle" size="mediumLarge" color="iconAlertRed" />
                <Text variant="hint">
                    <Translation id="moduleSend.fees.error" />
                </Text>
            </HStack>
        </Animated.View>
    );
};
