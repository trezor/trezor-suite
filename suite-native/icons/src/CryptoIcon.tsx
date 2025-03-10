import { useMemo } from 'react';

import { Image } from 'expo-image';

import { CryptoIconName, cryptoIcons, genericTokenIcon } from '@suite-common/icons';
import {
    NetworkDisplaySymbol,
    NetworkSymbol,
    getCoingeckoId,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
export interface CryptoIconProps {
    symbol: NetworkSymbol | NetworkDisplaySymbol;
    contractAddress?: string;
    size?: CryptoIconSize | number;
}

export const cryptoIconSizes = {
    tiny: 16,
    extraSmall: 24,
    small: 32,
    large: 48,
    extraLarge: 68,
} as const;

const iconStyle = prepareNativeStyle<{ width: number; height: number }>(
    (utils, { width, height }) => ({
        borderRadius: utils.borders.radii.round,
        overflow: 'hidden',
        width,
        height,
    }),
);

export type CryptoIconSize = keyof typeof cryptoIconSizes;

export const CryptoIcon = ({ symbol, contractAddress, size = 'small' }: CryptoIconProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const sizeNumber = typeof size === 'number' ? size : cryptoIconSizes[size];
    const key = `${symbol}${contractAddress ?? ''}`;

    const sourceUrl = useMemo(() => {
        let url = cryptoIcons[symbol.toLowerCase() as CryptoIconName];

        if (isNetworkSymbol(symbol)) {
            const coingeckoId = getCoingeckoId(symbol);
            if (coingeckoId && contractAddress) {
                const formattedAddress = getContractAddressForNetworkSymbol(
                    symbol,
                    contractAddress,
                );
                url = getAssetLogoUrl({
                    coingeckoId,
                    contractAddress: formattedAddress,
                    quality: '@2x',
                });
            }
        }

        return url;
    }, [contractAddress, symbol]);

    return (
        <Image
            source={sourceUrl}
            accessibilityHint={translate('icons.cryptoIconHint')}
            accessibilityLabel={key}
            recyclingKey={key}
            style={applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber })}
            placeholder={genericTokenIcon}
            cachePolicy="memory-disk"
        />
    );
};
