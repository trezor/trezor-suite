import { Canvas, ImageSVG, useSVG } from '@shopify/react-native-skia';

import { networks } from '@suite-common/wallet-config';

import { CryptoIconName, cryptoIcons } from '../icons';
import { genericTokenIcon, TokenIconName, tokenIcons } from '../tokenIcons';
import { CoinSymbol, CryptoIconProps, cryptoIconSizes } from '../config';

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
