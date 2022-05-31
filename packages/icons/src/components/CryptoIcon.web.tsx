import React from 'react';
import { CryptoIconName } from '../icons';

type CryptoIconProps = {
    name: CryptoIconName;
    size?: CryptoIconSize;
};

const cryptoIconSizes = {
    small: 24,
    large: 42,
} as const;

type CryptoIconSize = keyof typeof cryptoIconSizes;

// This will be used for web in the future
export const CryptoIcon: React.FC<CryptoIconProps> = () => null;
