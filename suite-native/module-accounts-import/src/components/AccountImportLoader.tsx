import { useEffect, useState } from 'react';
import Animated, {
    useAnimatedStyle,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Box, Spinner, type SpinnerLoadingState, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const LINE_VISIBILITY_DURATION = 1000;

type AccountImportLoaderProps = {
    loadingState: SpinnerLoadingState;
    onComplete?: () => void;
};

const loaderContainerStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
}));

const ANIMATION_SAFETY_MARGIN = 5;

const textContainerStyle = prepareNativeStyle(utils => ({
    overflow: 'hidden',
    height: utils.typography['headline-sm'].lineHeight + ANIMATION_SAFETY_MARGIN * 2,
    paddingHorizontal: ANIMATION_SAFETY_MARGIN,
}));

const textStyle = prepareNativeStyle(utils => ({
    lineHeight: utils.typography['headline-sm'].lineHeight + ANIMATION_SAFETY_MARGIN * 2,
    textAlign: 'center',
}));

export const AccountImportLoader = ({ loadingState, onComplete }: AccountImportLoaderProps) => {
    const { applyStyle } = useNativeStyles();
    const [lineHeight1, setLineHeight1] = useState(0);
    const [lineHeight2, setLineHeight2] = useState(0);
    const [lineHeight3, setLineHeight3] = useState(0);
    const [hasTextAnimationFinished, setHasTextAnimationFinished] = useState(false);
    const animatedTextStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: withSequence(
                    withTiming(-lineHeight1),
                    withTiming(0),
                    withDelay(LINE_VISIBILITY_DURATION, withTiming(-lineHeight2)),
                    withDelay(LINE_VISIBILITY_DURATION, withTiming(-lineHeight3)),
                ),
            },
        ],
    }));

    useEffect(() => {
        const timeout = setTimeout(() => {
            setHasTextAnimationFinished(true);
        }, 3 * LINE_VISIBILITY_DURATION);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    // Spinner should not stop spinning before the text animation is finished.
    const spinnerLoadingState = hasTextAnimationFinished ? loadingState : 'idle';

    return (
        <Box style={applyStyle(loaderContainerStyle)}>
            <Box marginBottom="sp24">
                <Spinner loadingState={spinnerLoadingState} onComplete={onComplete} />
            </Box>
            <Box style={applyStyle(textContainerStyle)}>
                <Animated.View style={animatedTextStyle}>
                    <Text
                        variant="headline-sm"
                        style={applyStyle(textStyle)}
                        onLayout={event => {
                            setLineHeight1(event.nativeEvent.layout.y);
                        }}
                    >
                        <Translation id="moduleAccountImport.accountImportLoaderScreen.loaderState.balances" />
                    </Text>
                    <Text
                        variant="headline-sm"
                        style={applyStyle(textStyle)}
                        onLayout={event => {
                            setLineHeight2(event.nativeEvent.layout.y);
                        }}
                    >
                        <Translation id="moduleAccountImport.accountImportLoaderScreen.loaderState.assets" />
                    </Text>
                    <Text
                        variant="headline-sm"
                        style={applyStyle(textStyle)}
                        onLayout={event => {
                            setLineHeight3(event.nativeEvent.layout.y);
                        }}
                    >
                        <Translation id="moduleAccountImport.accountImportLoaderScreen.loaderState.transactions" />
                    </Text>
                </Animated.View>
            </Box>
        </Box>
    );
};
