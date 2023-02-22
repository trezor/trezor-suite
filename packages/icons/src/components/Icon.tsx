import React, { useMemo } from 'react';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color, CSSColor } from '@trezor/theme';

import { IconName, icons } from '../icons';

type IconProps = {
    name: IconName;
    size?: IconSize;
    customSize?: number;
    color?: Color | CSSColor;
};

const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
} as const;

export type IconSize = keyof typeof iconSizes;

export const Icon = ({ name, customSize, size = 'large', color = 'gray1000' }: IconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = customSize || iconSizes[size];
    const paint = useMemo(() => Skia.Paint(), []);
    const skiaColor = color in colors ? colors[color as Color] : color;
    paint.setColorFilter(Skia.ColorFilter.MakeBlend(Skia.Color(skiaColor), BlendMode.SrcIn));

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            <Group layer={paint}>
                {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
            </Group>
        </Canvas>
    );
};
