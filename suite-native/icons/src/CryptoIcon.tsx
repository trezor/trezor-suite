import { useMemo, useState } from 'react';

import { Image } from 'expo-image';

import { type CryptoIconName, cryptoIcons, genericTokenIcon } from '@suite-common/icons';
import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getCoingeckoId,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CryptoIconPlaceholder } from './CryptoIconPlaceholder';

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
    const [logoIndex, setLogoIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    const sizeNumber = typeof size === 'number' ? size : cryptoIconSizes[size];
    const iconContainerStyle = useMemo(
        () => applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber }),
        [applyStyle, sizeNumber],
    );

    const key = `${symbol}${contractAddress ?? ''}`;

    const sourceUrls = useMemo(() => {
        let url = [cryptoIcons[symbol.toLowerCase() as CryptoIconName]];

        if (isNetworkSymbol(symbol)) {
            const coingeckoId = getCoingeckoId(symbol);
            if (coingeckoId && contractAddress) {
                const logoAddresses = getAssetLogoContractAddresses(symbol, contractAddress);

                if (logoAddresses?.length) {
                    url = logoAddresses.map(address =>
                        getAssetLogoUrl({
                            coingeckoId,
                            contractAddress: address,
                            density: 2,
                            size: sizeNumber,
                        }),
                    );
                }
            }
        }

        return url;
    }, [contractAddress, sizeNumber, symbol]);

    /**
     * Retries loading the icon with the next available address in sourceUrls.
     * This is crucial for ADA, where the logo might be stored
     * under either the policyId or the full contract address.
     */
    const handleLoadError = () => {
        if (logoIndex + 1 >= sourceUrls.length) {
            setShowPlaceholder(true);
        } else {
            setLogoIndex(prevState => prevState + 1);
        }
    };

    if (showPlaceholder) {
        return (
            <CryptoIconPlaceholder
                placeholder={symbol.toUpperCase()}
                containerStyle={iconContainerStyle}
            />
        );
    }

    return (
        <Image
            source={sourceUrls[logoIndex]}
            accessibilityHint={translate('icons.cryptoIconHint')}
            accessibilityLabel={key}
            recyclingKey={key}
            style={iconContainerStyle}
            placeholder={genericTokenIcon}
            onError={handleLoadError}
            cachePolicy="memory-disk"
        />
    );
};
