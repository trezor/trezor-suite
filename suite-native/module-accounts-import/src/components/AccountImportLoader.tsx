import React, { useState } from 'react';
import Animated, {
    useAnimatedStyle,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import Lottie from 'lottie-react-native';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import spinnerSuccess from '../assets/spinnerSuccess.json';

const LINE_VISIBILITY_DURATION = 1000;

const loaderContainerStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
}));

const successSpinnerStyle = prepareNativeStyle(utils => ({
    width: 50,
    height: 50,
    marginBottom: utils.spacings.large,
}));

const ANIMATION_SAFETY_MARGIN = 5;

const textContainerStyle = prepareNativeStyle(utils => ({
    overflow: 'hidden',
    height: utils.typography.titleSmall.lineHeight + ANIMATION_SAFETY_MARGIN * 2,
    paddingHorizontal: ANIMATION_SAFETY_MARGIN,
}));

const textStyle = prepareNativeStyle(utils => ({
    lineHeight: utils.typography.titleSmall.lineHeight + ANIMATION_SAFETY_MARGIN * 2,
    textAlign: 'center',
}));

export const AccountImportLoader = () => {
    const { applyStyle } = useNativeStyles();
    const [lineHeight1, setLineHeight1] = useState(0);
    const [lineHeight2, setLineHeight2] = useState(0);
    const [lineHeight3, setLineHeight3] = useState(0);
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

    return (
        <Box style={applyStyle(loaderContainerStyle)}>
            <Box>
                <Lottie
                    source={spinnerSuccess}
                    autoPlay
                    style={applyStyle(successSpinnerStyle)}
                    loop={false}
                    resizeMode="cover"
                />
            </Box>
            <Box style={applyStyle(textContainerStyle)}>
                <Animated.View style={animatedTextStyle}>
                    <Text
                        variant="titleSmall"
                        style={applyStyle(textStyle)}
                        onLayout={event => {
                            setLineHeight1(event.nativeEvent.layout.y);
                        }}
                    >
                        Retrieving Balances
                    </Text>
                    <Text
                        variant="titleSmall"
                        style={applyStyle(textStyle)}
                        onLayout={event => {
                            setLineHeight2(event.nativeEvent.layout.y);
                        }}
                    >
                        Confirming assets
                    </Text>
                    <Text
                        variant="titleSmall"
                        style={applyStyle(textStyle)}
                        onLayout={event => {
                            setLineHeight3(event.nativeEvent.layout.y);
                        }}
                    >
                        Checking transactions
                    </Text>
                </Animated.View>
            </Box>
        </Box>
    );
};
