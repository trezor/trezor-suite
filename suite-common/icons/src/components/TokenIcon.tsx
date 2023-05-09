import React from 'react';

import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { TokenSymbol } from '@suite-common/wallet-types';

import { TokenIconName, ethereumTokenIcons } from '../icons';
import { CryptoIconSize, cryptoIconSizes } from './CryptoIcon';

type CryptoIconProps = {
    symbol?: TokenSymbol;
    size?: CryptoIconSize;
};

const getTokenIconName = (symbol?: TokenSymbol) => {
    if (!symbol) return 'erc20';

    const lowerCaseSymbol = symbol.toLowerCase();
    return (lowerCaseSymbol in ethereumTokenIcons ? lowerCaseSymbol : 'erc20') as TokenIconName;
};

export const TokenIcon = ({ symbol, size = 'small' }: CryptoIconProps) => {
    const tokenIconName = getTokenIconName(symbol);
    const svg = useSVG(ethereumTokenIcons[tokenIconName]);
    const sizeNumber = cryptoIconSizes[size];

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
        </Canvas>
    );
};
