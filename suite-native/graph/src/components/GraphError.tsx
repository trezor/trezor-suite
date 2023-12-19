import Animated, { FadeInDown, FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';
import { Text, VStack } from '@suite-native/atoms';

type GraphErrorProps = {
    error: string;
    onTryAgain: () => void;
};

const errorIconStyle = prepareNativeStyle(({ colors }) => ({
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlertYellowSubtleOnElevation1,
    borderColor: colors.backgroundAlertYellowSubtleOnElevation0,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
}));

const tryAgainButtonStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.small,
}));

const ErrorIcon = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Animated.View style={applyStyle(errorIconStyle)} entering={FadeInUp} exiting={FadeInDown}>
            <Icon name="warningTriangle" color="iconAlertYellow" />
        </Animated.View>
    );
};

export const GraphError = ({ error, onTryAgain }: GraphErrorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="small" alignItems="center" paddingHorizontal="medium">
            <ErrorIcon />
            <Animated.View entering={FadeInDown} exiting={FadeOutUp}>
                <Text variant="hint" color="textSubdued" textAlign="center">
                    There are some troubles with loading graph points: {error}
                </Text>
                <Text.Pressable
                    variant="body"
                    color="textSecondaryHighlight"
                    textAlign="center"
                    onPress={onTryAgain}
                    style={applyStyle(tryAgainButtonStyle)}
                >
                    Try again
                </Text.Pressable>
            </Animated.View>
        </VStack>
    );
};
