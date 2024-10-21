import { Image } from 'expo-image';

import {
    CryptoIconName,
    cryptoIcons,
    TokenIconName,
    tokenIcons,
} from '@suite-common/icons/src/cryptoIcons';
import { networks } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

export type CoinSymbolName = CryptoIconName | TokenAddress;

export interface CryptoIconProps {
    symbol: CoinSymbolName;
    size?: CryptoIconSize | number;
}

export const cryptoIconSizes = {
    extraSmall: 16,
    small: 24,
    large: 42,
} as const;

export type CryptoIconSize = keyof typeof cryptoIconSizes;

const genericTokenIconName: TokenIconName = 'erc20';

const getIconFile = (symbol: CoinSymbolName) => {
    if (symbol in networks) return cryptoIcons[symbol as CryptoIconName];

    // the symbol in case of a token is a contract address. Since it is hexadecimal value, we can convert it
    // to lowerCase to mach definition `suite-common/icons/icons.ts` without changing the meaning of the date.
    return tokenIcons[symbol.toLowerCase() as TokenIconName] ?? tokenIcons[genericTokenIconName];
};

export const CryptoIcon = ({ symbol, size = 'small' }: CryptoIconProps) => {
    const iconFile = getIconFile(symbol);
    const sizeNumber = typeof size === 'number' ? size : cryptoIconSizes[size];

    return (
        <Image
            source={iconFile}
            style={{ width: sizeNumber, height: sizeNumber }}
            // memory cause sounds like good idea, but IDK if it has any effect
            cachePolicy="memory"
        />
    );
};
