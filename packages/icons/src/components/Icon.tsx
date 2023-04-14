import React, { useMemo } from 'react';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { IconName, icons } from '../icons';

type IconProps = {
    name: IconName;
    size?: IconSize;
    customSize?: number;
    color?: Color;
};

const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
    extraLarge: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

export const Icon = ({ name, customSize, size = 'large', color = 'iconDefault' }: IconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = customSize || iconSizes[size];
    const paint = useMemo(() => Skia.Paint(), []);
    paint.setColorFilter(Skia.ColorFilter.MakeBlend(Skia.Color(colors[color]), BlendMode.SrcIn));

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            <Group layer={paint}>
                {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
            </Group>
        </Canvas>
    );
};
