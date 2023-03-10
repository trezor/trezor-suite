import React from 'react';
import { Image } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Box, Loader, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const LINE_VISIBILITY_DURATION = 1500;

const loaderContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: utils.spacings.medium * 10,
}));

const imageStyle = prepareNativeStyle(() => ({ width: 283, height: 166 }));

const textContainerStyle = prepareNativeStyle(utils => ({
    overflow: 'hidden',
    height: utils.typography.titleMedium.lineHeight,
}));
export const AccountImportLoader = () => {
    const { applyStyle, utils } = useNativeStyles();
    const { lineHeight } = utils.typography.titleMedium;
    const animatedTextStyle = useAnimatedStyle(() => ({
        height: lineHeight * 3,
        transform: [
            {
                translateY: withSequence(
                    withTiming(lineHeight),
                    withTiming(0),
                    withDelay(LINE_VISIBILITY_DURATION, withTiming(-lineHeight)),
                    withDelay(LINE_VISIBILITY_DURATION, withTiming(-2 * lineHeight)),
                ),
            },
        ],
    }));

    return (
        <Box style={applyStyle(loaderContainerStyle)}>
            {/* eslint-disable-next-line global-require */}
            <Image source={require('../assets/globe.png')} style={applyStyle(imageStyle)} />
            <VStack spacing="large" flex={1} justifyContent="center">
                <Loader />
                <Box style={applyStyle(textContainerStyle)}>
                    <Animated.View style={animatedTextStyle}>
                        <Text variant="titleMedium" align="center">
                            Retrieving Balances
                        </Text>
                        <Text variant="titleMedium" align="center">
                            Confirming assets
                        </Text>
                        <Text variant="titleMedium" align="center">
                            Checking transactions
                        </Text>
                    </Animated.View>
                </Box>
            </VStack>
        </Box>
    );
};
