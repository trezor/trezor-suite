/* eslint-disable global-require */
import React, { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { Box, Loader, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AccountImportLoaderProps = {
    onLoad(): void;
};

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
export const AccountImportLoader = ({ onLoad }: AccountImportLoaderProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { lineHeight } = utils.typography.titleMedium;
    const lineVisibilityDuration = 1500;
    const animatedTextStyle = useAnimatedStyle(() => ({
        height: lineHeight * 3,
        transform: [
            {
                translateY: withSequence(
                    withTiming(lineHeight),
                    withTiming(0),
                    withDelay(lineVisibilityDuration, withTiming(-lineHeight)),
                    withDelay(lineVisibilityDuration, withTiming(-2 * lineHeight)),
                ),
            },
        ],
    }));

    useEffect(() => {
        // loader should disappear after 5 seconds soonest by design.
        const timeout = setTimeout(onLoad, 5000);
        return () => clearTimeout(timeout);
    }, [onLoad]);

    return (
        <Box style={applyStyle(loaderContainerStyle)}>
            <Image source={require('../assets/globe.png')} style={applyStyle(imageStyle)} />
            <VStack spacing="large" flex={1} justifyContent="center">
                <Loader />
                <Box style={applyStyle(textContainerStyle)}>
                    <Animated.View style={[animatedTextStyle]}>
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
