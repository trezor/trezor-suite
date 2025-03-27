import { View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import Lottie from 'lottie-react-native';

import { getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@trezor/utils';

import riskCardsLottie from '../assets/risk-cards-lottie.json';

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
        utils: { colors },
    } = useNativeStyles();

    // 'transparent' color does not work in context of LinearGradient on iOS, RGBA has to be used instead.
    const backgroundColor = colors.backgroundSurfaceElevation0;
    const transparentColor = hexToRgba(backgroundColor, 0.01);

    return (
        <View style={applyStyle(animationStyle)}>
            <Lottie source={riskCardsLottie} autoPlay loop style={applyStyle(animationStyle)} />
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
