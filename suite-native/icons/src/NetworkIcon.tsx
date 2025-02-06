import { Image } from 'expo-image';

import { networkIcons } from '@suite-common/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useTranslate } from '@suite-native/intl';
import { useActiveColorScheme } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CryptoIconSize } from './CryptoIcon';

export interface NetworkIconProps {
    symbol: NetworkSymbol;
    size?: CryptoIconSize | number;
}

export const networkIconSizes = {
    extraSmall: 9,
    small: 12,
    large: 18,
    extraLarge: 24,
} as const;

const iconStyle = prepareNativeStyle<{ width: number; height: number }>((_, { width, height }) => ({
    width,
    height,
}));

export const NetworkIcon = ({ symbol, size = 'small' }: NetworkIconProps) => {
    const { applyStyle } = useNativeStyles();
    const isDarkScheme = useActiveColorScheme() === 'dark';
    const { translate } = useTranslate();
    const iconName = `${symbol.toLowerCase()}${isDarkScheme ? '_inverse' : ''}`;

    const sizeNumber = typeof size === 'number' ? size : networkIconSizes[size];
    const sourceUrl = networkIcons[iconName as keyof typeof networkIcons] ?? undefined;

    if (!sourceUrl) {
        return null;
    }

    return (
        <Image
            accessibilityHint={translate('icons.networkIconHint')}
            source={sourceUrl}
            recyclingKey={symbol}
            style={applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber })}
            cachePolicy="memory-disk"
        />
    );
};
