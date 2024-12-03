import React, { useMemo } from 'react';

import Lottie, { AnimationObject } from 'lottie-react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CSSColor } from '@trezor/theme';

import { useIllustrationColors } from './useIllustrationColors';

type LottieAnimationSize = 'standard' | 'small';
type LottieAnimationProps = {
    source: AnimationObject;
    size?: LottieAnimationSize;
};

type LottieColor = [number, number, number, 1];
type LottieColors = {
    lineColor: LottieColor;
    fillColor: LottieColor;
};

const hexToLottieColor = (hex: CSSColor): LottieColor => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return [r / 255, g / 255, b / 255, 1];
};

const colorizeLayer = (layer: any, { lineColor, fillColor }: LottieColors) => ({
    ...layer,
    shapes: layer.shapes?.map((shape: any) => ({
        ...shape,
        it: shape.it?.map((it: any) =>
            it.c?.k ? { ...it, c: { ...it.c, k: it.c.k[0] === 0 ? lineColor : fillColor } } : it,
        ),
    })),
});

const sizeToDimensionsMap = {
    standard: 224,
    small: 90,
} as const satisfies Record<LottieAnimationSize, number>;

const animationStyle = prepareNativeStyle<{ size: LottieAnimationSize }>((_, { size }) => ({
    width: sizeToDimensionsMap[size],
    height: sizeToDimensionsMap[size],
}));

export const LottieAnimation = ({ source, size = 'standard' }: LottieAnimationProps) => {
    const { lineColor, fillColor } = useIllustrationColors();
    const { applyStyle } = useNativeStyles();

    const colorizedSource = useMemo(() => {
        const colors = {
            lineColor: hexToLottieColor(lineColor),
            fillColor: hexToLottieColor(fillColor),
        };

        return {
            ...source,
            assets: source.assets.map((asset: { layers: any[] }) => ({
                ...asset,
                layers: asset.layers.map(l => colorizeLayer(l, colors)),
            })),
            layers: source.layers.map(l => colorizeLayer(l, colors)),
        };
    }, [source, lineColor, fillColor]);

    return (
        <Lottie
            source={colorizedSource}
            style={applyStyle(animationStyle, { size })}
            autoPlay
            loop
        />
    );
};
