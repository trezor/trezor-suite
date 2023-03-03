import React from 'react';

import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { EthereumTokenIconName, ethereumTokenIcons } from '../icons';
import { CryptoIconSize, cryptoIconSizes } from './CryptoIcon';

type CryptoIconProps = {
    name: EthereumTokenIconName;
    size?: CryptoIconSize;
};

export const EthereumTokenIcon = ({ name, size = 'small' }: CryptoIconProps) => {
    // if symbol (name) is in ethereumTokenIcons, use it, else use the default icon erc20
    const svg = useSVG(ethereumTokenIcons[name]);
    const sizeNumber = cryptoIconSizes[size];

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
        </Canvas>
    );
};
