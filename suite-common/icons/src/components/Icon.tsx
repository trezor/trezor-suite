import React, { useMemo } from 'react';

import { Canvas, ImageSVG, useSVG, Group, Skia, BlendMode } from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';

import { icons } from '../icons';
import { IconProps, iconSizes } from '../config';

export const Icon = ({ name, size = 'large', color = 'iconDefault' }: IconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = typeof size === 'string' ? iconSizes[size] : size;
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
