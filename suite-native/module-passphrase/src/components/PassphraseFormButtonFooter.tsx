import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import { Box, Button } from '@suite-native/atoms';

const SLIDE_ANIMATION_DURATION = 600;
const FADE_ANIMATION_DURATION = 200;
const GRADIENT_BACKGROUND_HEIGHT = 96;

type PassphraseFormButtonFooterProps = {
    isVisible: boolean;
    onPress: () => void;
};

const buttonFooterStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    width: '100%',
    bottom: 0,
    padding: utils.spacings.medium,
}));

const gradientBackgroundStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    height: GRADIENT_BACKGROUND_HEIGHT,
    width: '100%',
    bottom: 0,
}));

export const PassphraseFormButtonFooter = ({
    isVisible,
    onPress,
}: PassphraseFormButtonFooterProps) => {
    const { applyStyle, utils } = useNativeStyles();

    if (!isVisible) {
        return null;
    }

    return (
        <Box>
            {/* The gradient cannot be part of the button slide-up animation, because the expo-linear-gradient and slide-up animation do not work together.
                For this reason there is a second fade-in animation for the gradient with some delay to make it feel more natural.
            */}
            <Animated.View
                entering={FadeIn.delay(FADE_ANIMATION_DURATION).duration(FADE_ANIMATION_DURATION)}
            >
                <LinearGradient
                    colors={[
                        'transparent',
                        utils.colors.backgroundSurfaceElevation0,
                        utils.colors.backgroundSurfaceElevation0,
                        utils.colors.backgroundSurfaceElevation0,
                    ]}
                    style={applyStyle(gradientBackgroundStyle)}
                />
            </Animated.View>
            <Animated.View
                entering={SlideInDown.duration(SLIDE_ANIMATION_DURATION)}
                exiting={SlideOutDown.duration(SLIDE_ANIMATION_DURATION)}
                style={applyStyle(buttonFooterStyle)}
            >
                <Button
                    accessibilityRole="button"
                    accessibilityLabel="confirm passphrase"
                    onPress={onPress}
                >
                    <Translation id="modulePassphrase.form.submitButton" />
                </Button>
            </Animated.View>
        </Box>
    );
};
