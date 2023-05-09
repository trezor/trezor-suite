import React from 'react';

import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { CryptoIconName, cryptoIcons } from '../icons';

type CryptoIconProps = {
    name: CryptoIconName;
    size?: CryptoIconSize;
};

export const cryptoIconSizes = {
    extraSmall: 16,
    small: 24,
    large: 42,
} as const;

export type CryptoIconSize = keyof typeof cryptoIconSizes;

export const CryptoIcon = ({ name, size = 'small' }: CryptoIconProps) => {
    const svg = useSVG(cryptoIcons[name]);
    const sizeNumber = cryptoIconSizes[size];

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
        </Canvas>
    );
};
