import React from 'react';

import {
    Canvas,
    ImageSVG,
    useSVG,
    Group,
    Paint,
    BlendColor,
    usePaintRef,
} from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { IconName, icons } from '../icons';

type IconProps = {
    name: IconName;
    size?: IconSize;
    color?: Color;
};

const iconSizes = {
    small: 12,
    medium: 16,
    large: 24,
} as const;

export type IconSize = keyof typeof iconSizes;

export const Icon = ({ name, size = 'large', color = 'black' }: IconProps) => {
    const svg = useSVG(icons[name]);
    const {
        utils: { colors },
    } = useNativeStyles();
    const sizeNumber = iconSizes[size];
    const paint = usePaintRef();

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            <Paint ref={paint}>
                <BlendColor color={colors[color]} mode="srcIn" />
            </Paint>
            <Group layer={paint}>
                {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
            </Group>
        </Canvas>
    );
};
