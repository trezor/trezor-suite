import React from 'react';
import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';
import { FlagIconName, flagIcons } from '../icons';

type FlagIconProps = {
    name: FlagIconName;
    size?: FlagIconSize;
};

const flagIconSizes = {
    small: 30,
} as const;

type FlagIconSize = keyof typeof flagIconSizes;

export const FlagIcon = ({ name, size = 'small' }: FlagIconProps) => {
    const svg = useSVG(flagIcons[name]);
    const sizeNumber = flagIconSizes[size];
    return (
        <Canvas
            style={{
                height: sizeNumber,
                width: sizeNumber,
            }}
        >
            {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
        </Canvas>
    );
};
