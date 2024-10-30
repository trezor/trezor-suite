import { useMemo } from 'react';

import { Image } from 'expo-image';

import { cryptoIcons, genericTokenIcon, CryptoIconName } from '@suite-common/icons';
import { getCoingeckoId, NetworkSymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetwork } from '@suite-common/wallet-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export interface CryptoIconProps {
    symbol: NetworkSymbol;
    contractAddress?: string;
    size?: CryptoIconSize | number;
}

export const cryptoIconSizes = {
    extraSmall: 16,
    small: 24,
    large: 42,
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
    const sizeNumber = typeof size === 'number' ? size : cryptoIconSizes[size];

    const sourceUrl = useMemo(() => {
        const coingeckoId = getCoingeckoId(symbol);
        let url = cryptoIcons[symbol.toLowerCase() as CryptoIconName];
        if (coingeckoId && contractAddress) {
            const formattedAddress = getContractAddressForNetwork(symbol, contractAddress);
            url = getAssetLogoUrl({
                coingeckoId,
                contractAddress: formattedAddress,
                quality: '@2x',
            });
        }

        return url;
    }, [contractAddress, symbol]);

    return (
        <Image
            source={sourceUrl}
            recyclingKey={sourceUrl}
            style={applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber })}
            placeholder={genericTokenIcon}
            cachePolicy="memory-disk"
        />
    );
};
