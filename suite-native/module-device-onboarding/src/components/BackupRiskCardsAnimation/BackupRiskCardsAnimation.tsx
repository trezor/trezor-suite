import { View } from 'react-native';

import { Marquee } from '@animatereactnative/marquee';
import { LinearGradient } from 'expo-linear-gradient';

import { HStack, VStack } from '@suite-native/atoms';
import { getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

import { MarqueeTile } from './MarqueeTile';

const ANIMATION_WIDTH = getScreenWidth();
const ANIMATION_HEIGHT = ANIMATION_WIDTH * 0.33; // the animation dimensions are 1:3 (H:W);

const animationStyle = prepareNativeStyle(() => ({
    width: ANIMATION_WIDTH,
    height: ANIMATION_HEIGHT,
}));

const linearGradientStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: ANIMATION_HEIGHT,
    top: 0,
    left: 0,
    pointerEvents: 'none',
}));

export const BackupRiskCardsAnimation = () => {
    const {
        applyStyle,
        utils: { colors, spacings },
    } = useNativeStyles();

    // 'transparent' color does not work in context of LinearGradient on iOS, RGBA has to be used instead.
    const backgroundColor = colors.surfaceFillPage;
    const transparentColor = hexToRgba(backgroundColor, 0.01);

    return (
        <View style={applyStyle(animationStyle)}>
            <VStack spacing="sp24">
                <Marquee spacing={spacings.sp24}>
                    <HStack spacing="sp24">
                        <MarqueeTile variant="lost" />
                        <MarqueeTile variant="stolen" />
                        <MarqueeTile variant="damaged" />
                    </HStack>
                </Marquee>
                <Marquee spacing={spacings.sp24} reverse>
                    <HStack spacing="sp24">
                        <MarqueeTile variant="lost" />
                        <MarqueeTile variant="stolen" />
                        <MarqueeTile variant="damaged" />
                    </HStack>
                </Marquee>
            </VStack>
            <LinearGradient
                colors={[backgroundColor, transparentColor]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.2, y: 0.5 }}
                style={applyStyle(linearGradientStyle)}
            />
            <LinearGradient
                colors={[transparentColor, backgroundColor]}
                start={{ x: 0.8, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={applyStyle(linearGradientStyle)}
            />
        </View>
    );
};
