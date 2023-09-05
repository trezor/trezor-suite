import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { networks } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

import { CryptoIconName, cryptoIcons } from '../icons';
import { genericTokenIcon, TokenIconName, tokenIcons } from '../tokenIcons';

export type CoinSymbol = CryptoIconName | TokenAddress;

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

const getIconFile = (symbol: CoinSymbol) => {
    if (symbol in networks) return cryptoIcons[symbol as CryptoIconName];

    // the symbol in case of a token is a contract address. Since it is hexadecimal value, we can convert it
    // to lowerCase to mach definition `suite-common/icons/icons.ts` without changing the meaning of the date.
    return tokenIcons[symbol.toLowerCase() as TokenIconName] ?? genericTokenIcon;
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
