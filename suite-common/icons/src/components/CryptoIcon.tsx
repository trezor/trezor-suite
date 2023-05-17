import React from 'react';

import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { networks } from '@suite-common/wallet-config';
import { TokenSymbol } from '@suite-common/wallet-types';

import { CryptoIconName, cryptoIcons, TokenIconName, tokenIcons } from '../icons';

export type CoinSymbol = CryptoIconName | TokenSymbol | undefined;

type CryptoIconProps = {
    symbol: CoinSymbol;
    size?: CryptoIconSize;
};

export const cryptoIconSizes = {
    extraSmall: 16,
    small: 24,
    large: 42,
} as const;

export type CryptoIconSize = keyof typeof cryptoIconSizes;

const getIconFile = (symbol?: CoinSymbol) => {
    if (!symbol) return tokenIcons.erc20;

    if (symbol in networks) return cryptoIcons[symbol as CryptoIconName];

    const lowerCaseSymbol = symbol?.toLowerCase();
    const tokenIconName = (
        lowerCaseSymbol in tokenIcons ? lowerCaseSymbol : 'erc20'
    ) as TokenIconName;
    return tokenIcons[tokenIconName];
};

export const CryptoIcon = ({ symbol, size = 'small' }: CryptoIconProps) => {
    const iconFile = getIconFile(symbol);
    const svg = useSVG(iconFile);
    const sizeNumber = cryptoIconSizes[size];

    return (
        <Canvas style={{ height: sizeNumber, width: sizeNumber }}>
            {svg && <ImageSVG svg={svg} x={0} y={0} width={sizeNumber} height={sizeNumber} />}
        </Canvas>
    );
};
