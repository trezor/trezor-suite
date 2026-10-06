import { View, useWindowDimensions } from 'react-native';

import { Marquee } from '@animatereactnative/marquee';
import { LinearGradient } from 'expo-linear-gradient';

import { HStack, VStack } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

import { animationStyle, linearGradientStyle } from './BackupRiskCardsAnimation.styles';
import { MarqueeTile } from './MarqueeTile';

export const BackupRiskCardsAnimation = () => {
    const {
        applyStyle,
        utils: { colors, spacings },
    } = useNativeStyles();
    const { width: animationWidth } = useWindowDimensions();

    // 'transparent' color does not work in context of LinearGradient on iOS, RGBA has to be used instead.
    const backgroundColor = colors.surfaceFillPage;
    const transparentColor = hexToRgba(backgroundColor, 0.01);

    return (
        <View style={applyStyle(animationStyle, { animationWidth })}>
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
                style={applyStyle(linearGradientStyle, { animationWidth })}
            />
            <LinearGradient
                colors={[transparentColor, backgroundColor]}
                start={{ x: 0.8, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={applyStyle(linearGradientStyle, { animationWidth })}
            />
        </View>
    );
};
