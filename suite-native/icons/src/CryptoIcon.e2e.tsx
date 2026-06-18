// expo-image uses Fresco HARDWARE bitmaps which cause a SIGSEGV in the swiftshader GPU
// renderer on Android API 35 emulators. RN Image avoids this by using a non-HARDWARE path.
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';

import { type CryptoIconName, cryptoIcons } from '@suite-common/icons';
import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getCoingeckoId,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
    extraLarge: 64,
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
    const [logoIndex, setLogoIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    const sizeNumber = typeof size === 'number' ? size : cryptoIconSizes[size];
    const iconContainerStyle = useMemo(
        () => applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber }),
        [applyStyle, sizeNumber],
    );

    const [sourceUrls, setSourceUrls] = useState<Array<number | { uri: string }>>([
        cryptoIcons[symbol.toLowerCase() as CryptoIconName],
    ]);

    useEffect(() => {
        let cancelled = false;

        const fetchLogoAddresses = async () => {
            if (!isNetworkSymbol(symbol)) return;

            const coingeckoId = getCoingeckoId(symbol);
            if (!coingeckoId || !contractAddress) return;

            const logoAddresses = await getAssetLogoContractAddresses(symbol, contractAddress);

            if (cancelled || !logoAddresses?.length) return;

            setSourceUrls(
                logoAddresses.map(address => ({
                    uri: getAssetLogoUrl({
                        coingeckoId,
                        contractAddress: address,
                        density: 2,
                        size: sizeNumber,
                    }),
                })),
            );
        };

        setLogoIndex(0);
        setShowPlaceholder(false);
        setSourceUrls([cryptoIcons[symbol.toLowerCase() as CryptoIconName]]);
        fetchLogoAddresses();

        return () => {
            cancelled = true;
        };
    }, [contractAddress, sizeNumber, symbol]);

    useEffect(() => {
        setLogoIndex(0);
        setShowPlaceholder(false);
    }, [sourceUrls]);

    /**
     * Retries loading the icon with the next available address in sourceUrls.
     * This is crucial for:
     * - ADA, where the logo might be stored under either the policyId or the
     *   full contract address.
     * - XLM, where the logo might be stored under either the classic
     *   CODE-ISSUER address or the Soroban contract id, depending on how far
     *   CoinGecko has progressed with its Stellar id migration for the token.
     */
    const handleLoadError = () => {
        if (logoIndex + 1 >= sourceUrls.length) {
            setShowPlaceholder(true);
        } else {
            setLogoIndex(prevState => prevState + 1);
        }
    };

    if (showPlaceholder || !sourceUrls[logoIndex]) {
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
            style={iconContainerStyle}
            onError={handleLoadError}
        />
    );
};
