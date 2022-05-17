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
import { IconType, iconTypes } from './iconTypes';
import { useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

const iconSizes = {
    small: 16,
    big: 24,
} as const;

export type IconSize = keyof typeof iconSizes;

export type IconProps = {
    type: IconType;
    size?: IconSize;
    color?: Color;
};

export const Icon = ({ type, size = 'big', color = 'black' }: IconProps) => {
    const svg = useSVG(iconTypes[type]);
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
